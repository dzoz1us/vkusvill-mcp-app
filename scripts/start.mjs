// Запуск «Менюшки» одной командой без Docker:  npm start
//
// Что делает скрипт:
//   1. находит JDK 21,
//   2. собирает бэкенд (Maven скачивается сам через mvnw, первый раз — несколько минут),
//   3. ставит зависимости фронтенда,
//   4. запускает бэкенд со встроенным PostgreSQL 17 (база создаётся сама, данные лежат в backend/data/postgres),
//   5. запускает фронтенд.
//
// Чтобы использовать свой PostgreSQL, задайте DB_URL (и DB_USER, DB_PASSWORD), например:
//   DB_URL=jdbc:postgresql://localhost:5432/menyushka DB_USER=menyushka DB_PASSWORD=menyushka npm start
// Ключ --build пересобирает бэкенд, даже если jar уже есть.

import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const backendDir = path.join(root, "backend");
const frontendDir = path.join(root, "frontend");
const jar = path.join(backendDir, "target", "menyushka-backend-0.1.0.jar");
const isWindows = process.platform === "win32";
const forceBuild = process.argv.includes("--build");
const useExternalDb = Boolean(process.env.DB_URL);

const log = (msg) => console.log(`\x1b[32m[menyushka]\x1b[0m ${msg}`);
const fail = (msg) => {
  console.error(`\x1b[31m[menyushka] ${msg}\x1b[0m`);
  process.exit(1);
};

/** Путь к JDK 21: сначала JAVA_HOME, потом java из PATH. Maven собирает по JAVA_HOME. */
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
    return firstBin ? path.dirname(path.dirname(firstBin.trim())) : null;
  }
  return null;
}

const javaHome = findJava21Home();
if (!javaHome) {
  fail("Нужна Java 21: установите JDK 21 (https://adoptium.net) и задайте JAVA_HOME или добавьте java в PATH.");
}

// JDK 21 первым в PATH: путь с пробелами (C:\Program Files\...) не нужно передавать в оболочку
const env = {
  ...process.env,
  JAVA_HOME: javaHome,
  PATH: `${path.join(javaHome, "bin")}${path.delimiter}${process.env.PATH ?? ""}`,
};
if (useExternalDb) {
  env.DB_USER = process.env.DB_USER ?? "menyushka";
  env.DB_PASSWORD = process.env.DB_PASSWORD ?? "menyushka";
} else {
  env.SPRING_PROFILES_ACTIVE = "embedded-db";
}

/** Запускает команду и ждёт окончания; при ошибке останавливает скрипт. */
function runOrFail(cmd, args, cwd, what) {
  log(what);
  const res = spawnSync(cmd, args, { cwd, stdio: "inherit", shell: isWindows, env });
  if (res.status !== 0) fail(`Не получилось: ${cmd} ${args.join(" ")}`);
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

async function waitForBackend(timeoutMs = 240_000) {
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

function main() {
  if (forceBuild || !existsSync(jar)) {
    const mvnw = isWindows ? "mvnw.cmd" : "./mvnw";
    runOrFail(mvnw, ["-q", "-B", "-DskipTests", "package"], backendDir, "Собираем бэкенд (первый раз это займёт несколько минут)");
  }
  if (!existsSync(path.join(frontendDir, "node_modules"))) {
    runOrFail("npm", ["install", "--no-audit", "--no-fund"], frontendDir, "Устанавливаем зависимости фронтенда");
  }

  log(useExternalDb ? `Запускаем бэкенд, база: ${process.env.DB_URL}` : "Запускаем бэкенд со встроенным PostgreSQL (база создаётся сама)");
  children.push(start("backend", "java", ["-jar", jar], backendDir));

  return waitForBackend().then((up) => {
    if (!up) {
      stopAll();
      fail("Бэкенд не поднялся за 4 минуты. Смотрите вывод [backend] выше.");
    }
    log("Бэкенд готов");
    children.push(start("frontend", "npm", ["run", "dev"], frontendDir));
    log("Откройте в браузере: http://localhost:5173  (Ctrl+C — остановить всё)");
    log("Администратор: admin@menyushka.ru / admin12345");
  });
}

main();
