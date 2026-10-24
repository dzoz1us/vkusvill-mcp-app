import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "@/shared/api";
import { errorText } from "@/shared/lib";
import { Logo } from "@/shared/ui";
import { useUserStore } from "@/entities/user";

export type AuthMode = "login" | "register" | "forgot" | "reset";

const TITLES: Record<AuthMode, string> = {
  login: "Вход",
  register: "Регистрация",
  forgot: "Восстановление доступа",
  reset: "Новый пароль",
};

const SUBMIT: Record<AuthMode, string> = {
  login: "Войти",
  register: "Создать аккаунт",
  forgot: "Получить ссылку",
  reset: "Сохранить пароль",
};

/** Единая форма для входа, регистрации и восстановления доступа. */
export default function AuthForm({ mode }: { mode: AuthMode }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") || "/plans";
  const { login, register } = useUserStore();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [devToken, setDevToken] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      if (mode === "login") {
        await login(email.trim(), password);
        navigate(next, { replace: true });
      } else if (mode === "register") {
        await register(name.trim(), email.trim(), password);
        navigate(next, { replace: true });
      } else if (mode === "forgot") {
        const res = await api.forgotPassword(email.trim());
        setInfo(res.message);
        setDevToken(res.reset_token);
      } else {
        await api.resetPassword(params.get("token") ?? "", password);
        navigate("/login", { replace: true });
      }
    } catch (err) {
      setError(errorText(err, "Не получилось, попробуйте ещё раз"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col justify-center px-5 py-10">
      <Link to="/" className="mb-8 self-start" aria-label="На главную">
        <Logo />
      </Link>
      <h1 className="heading mb-6">{TITLES[mode]}</h1>

      <form onSubmit={submit} className="space-y-4">
        {mode === "register" && (
          <div>
            <label className="label" htmlFor="name">Имя</label>
            <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
          </div>
        )}
        {mode !== "reset" && (
          <div>
            <label className="label" htmlFor="email">Почта</label>
            <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          </div>
        )}
        {mode !== "forgot" && (
          <div>
            <label className="label" htmlFor="password">
              {mode === "reset" ? "Новый пароль" : "Пароль"}
            </label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={mode === "login" ? undefined : 8}
              required
            />
            {mode !== "login" && <p className="text-muted mt-1.5 ml-4 text-sm">Не короче 8 символов</p>}
          </div>
        )}

        {error && <div className="alert alert-bad">{error}</div>}
        {info && <div className="alert alert-warn">{info}</div>}
        {devToken && (
          <Link to={`/reset-password?token=${devToken}`} className="btn btn-outline btn-sm w-full">
            Открыть ссылку сброса
          </Link>
        )}

        <button type="submit" disabled={busy} className="btn btn-primary w-full">
          {busy ? "Подождите" : SUBMIT[mode]}
        </button>
      </form>

      <div className="mt-6 flex flex-col items-center gap-2 text-center">
        {mode === "login" && (
          <>
            <Link className="link" to="/forgot-password">Забыли пароль?</Link>
            <span className="text-muted">
              Нет аккаунта? <Link className="link" to={`/register?next=${encodeURIComponent(next)}`}>Зарегистрироваться</Link>
            </span>
          </>
        )}
        {mode === "register" && (
          <span className="text-muted">
            Уже есть аккаунт? <Link className="link" to={`/login?next=${encodeURIComponent(next)}`}>Войти</Link>
          </span>
        )}
        {(mode === "forgot" || mode === "reset") && (
          <Link className="link" to="/login">Вернуться ко входу</Link>
        )}
      </div>
    </div>
  );
}
