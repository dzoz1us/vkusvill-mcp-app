// Запуск «Менюшки» без Docker: проверяет окружение, собирает бэкенд, поднимает бэкенд и фронтенд.
// Использование из корня проекта:  npm start           (или node scripts/start.mjs)
//   --build   пересобрать бэкенд, даже если jar уже есть
// Параметры базы берутся из переменных DB_URL, DB_USER, DB_PASSWORD (по умолчанию — база menyushka на localhost:5432).

import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const backendDir = path.join(root, "backend");
const frontendDir = path.join(root, "frontend");
const jar = path.join(backendDir, "target", "menyushka-backend-0.1.0.jar");
const isWindows = process.platform === "win32";
const forceBuild = process.argv.includes("--build");

/** Возвращает путь к JDK 21: сначала JAVA_HOME, потом java из PATH. Maven собирает по JAVA_HOME. */
function findJava21Home() {
  const javaBin = (home) => (home ? path.join(home, "bin", isWindows ? "java.exe" : "java") : "java");
  const isJava21 = (bin) => {
    const res = spawnSync(bin, ["-version"], { encoding: "utf8" });
    return !res.error && /version "21/.test(`${res.stdout}${res.stderr}`);
  };
  if (process.env.JAVA_HOME && isJava21(javaBin(process.env.JAVA_HOME))) return process.env.JAVA_HOME;
  if (isJava21(javaBin(null))) {
    const which = spawnSync(isWindows ? "where" : "which", ["java"], { encoding: "utf8" });
    const firstBin = which.stdout.split(/\r?\n/).find(Boolean);
    return firstBin ? path.dirname(path.dirname(firstBin)) : null;
  }
  return null;
}

const javaHome = findJava21Home();
if (!javaHome) fail("Нужна Java 21: задайте JAVA_HOME на JDK 21 (https://adoptium.net) или добавьте её в PATH.");

const env = {
  ...process.env,
  JAVA_HOME: javaHome,
  DB_URL: process.env.DB_URL ?? "jdbc:postgresql://localhost:5432/menyushka",
  DB_USER: process.env.DB_USER ?? "menyushka",
  DB_PASSWORD: process.env.DB_PASSWORD ?? "menyushka",
};

const log = (msg) => console.log(`\x1b[32m[menyushka]\x1b[0m ${msg}`);
const fail = (msg) => {
  console.error(`\x1b[31m[menyushka] ${msg}\x1b[0m`);
  process.exit(1);
};

/** Запускает команду и ждёт её окончания; при ошибке останавливает скрипт. */
function runOrFail(cmd, args, cwd, what) {
  log(what);
  const res = spawnSync(cmd, args, { cwd, stdio: "inherit", shell: isWindows, env });
  if (res.status !== 0) fail(`Не получилось: ${cmd} ${args.join(" ")}`);
}

/** Проверяет, что в PATH есть нужная программа. */
function requireTool(cmd, args, hint) {
  const res = spawnSync(cmd, args, { shell: isWindows, encoding: "utf8" });
  if (res.error || res.status !== 0) fail(`Не найдено: ${cmd}. ${hint}`);
  return `${res.stdout ?? ""}${res.stderr ?? ""}`;
}

/** Есть ли в сети порт базы. Сама база проверяется через подключение бэкенда. */
function portOpen(host, port) {
  return new Promise((resolve) => {
    const sock = net.createConnection({ host, port, timeout: 1500 });
    sock.once("connect", () => (sock.destroy(), resolve(true)));
    sock.once("timeout", () => (sock.destroy(), resolve(false)));
    sock.once("error", () => resolve(false));
  });
}

async function checkDatabase() {
  const m = env.DB_URL.match(/jdbc:postgresql:\/\/([^:/]+):(\d+)\/(\w+)/);
  if (!m) fail(`Некорректный DB_URL: ${env.DB_URL}`);
  const [, host, port, name] = m;
  if (!(await portOpen(host, Number(port)))) {
    fail(
      `PostgreSQL не отвечает на ${host}:${port}.\n` +
        "  Установите PostgreSQL 17 (https://www.postgresql.org/download/) или запустите контейнер:\n" +
        "    docker run -d --name menyushka-db -p 5432:5432 -e POSTGRES_USER=menyushka -e POSTGRES_PASSWORD=menyushka -e POSTGRES_DB=menyushka postgres:17\n" +
        `  Затем, если базы ещё нет, создайте её (база «${name}», пользователь menyushka, пароль menyushka).`,
    );
  }
}

/** Запускает процесс и печатает его вывод с префиксом. */
function start(name, cmd, args, cwd) {
  const child = spawn(cmd, args, { cwd, env, shell: isWindows, stdio: ["ignore", "pipe", "pipe"] });
  const prefix = (chunk) =>
    String(chunk)
      .split(/\r?\n/)
      .filter(Boolean)
      .forEach((line) => console.log(`\x1b[36m[${name}]\x1b[0m ${line}`));
  child.stdout.on("data", prefix);
  child.stderr.on("data", prefix);
  child.on("exit", (code) => {
    if (code !== null && code !== 0) log(`${name} остановился с кодом ${code}`);
  });
  return child;
}

async function waitForBackend(timeoutMs = 180_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch("http://localhost:8000/health");
      if (res.ok) return true;
    } catch {
      // ещё не поднялся
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

const children = [];
function stopAll() {
  for (const c of children) {
    if (!c.pid) continue;
    if (isWindows) spawnSync("taskkill", ["/pid", String(c.pid), "/T", "/F"]);
    else c.kill("SIGTERM");
  }
}
process.on("SIGINT", () => {
  log("Останавливаем…");
  stopAll();
  process.exit(0);
});

async function main() {
  log("Проверяем окружение");
  requireTool("mvn", ["-v"], "Установите Maven 3.9+: https://maven.apache.org/download.cgi");
  requireTool("node", ["-v"], "Установите Node.js 20+: https://nodejs.org");
  await checkDatabase();

  if (forceBuild || !existsSync(jar)) {
    runOrFail("mvn", ["-q", "-B", "-DskipTests", "package"], backendDir, "Собираем бэкенд (первый раз это займёт пару минут)");
  }
  if (!existsSync(path.join(frontendDir, "node_modules"))) {
    runOrFail("npm", ["install"], frontendDir, "Устанавливаем зависимости фронтенда");
  }

  log("Запускаем бэкенд на порту 8000");
  children.push(start("backend", "java", ["-jar", jar], backendDir));
  if (!(await waitForBackend())) fail("Бэкенд не поднялся за 3 минуты. Смотрите вывод [backend] выше.");
  log("Бэкенд готов");

  log("Запускаем фронтенд");
  children.push(start("frontend", "npm", ["run", "dev"], frontendDir));
  log("Откройте в браузере: http://localhost:5173  (Ctrl+C — остановить всё)");
  log("Администратор: admin@menyushka.ru / admin12345");
}

main();
