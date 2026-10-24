import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/shared/api";
import { errorText } from "@/shared/lib";
import { Toast } from "@/shared/ui";
import { useUserStore } from "@/entities/user";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, setSession, logout } = useUserStore();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ text: string; kind: "ok" | "bad" } | null>(null);

  if (!user) return null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const res = await api.updateProfile({
        name: name.trim(),
        email: email.trim(),
        ...(newPassword ? { current_password: currentPassword, new_password: newPassword } : {}),
      });
      setSession(res);
      setCurrentPassword("");
      setNewPassword("");
      setToast({ text: "Сохранено", kind: "ok" });
    } catch (err) {
      setToast({ text: errorText(err, "Не удалось сохранить"), kind: "bad" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <h1 className="heading page-head">Профиль</h1>

      {user.role === "ADMIN" && (
        <Link to="/admin" className="btn btn-outline mb-4 w-full">
          Администрирование
        </Link>
      )}

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="p-name">Имя</label>
          <input id="p-name" className="input" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="label" htmlFor="p-email">Почта</label>
          <input id="p-email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <h2 className="block-title pt-2">Смена пароля</h2>
        <div>
          <label className="label" htmlFor="p-cur">Текущий пароль</label>
          <input id="p-cur" type="password" className="input" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" />
        </div>
        <div>
          <label className="label" htmlFor="p-new">Новый пароль</label>
          <input id="p-new" type="password" className="input" minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" />
        </div>

        <button type="submit" disabled={busy} className="btn btn-primary w-full">
          {busy ? "Сохраняем" : "Сохранить"}
        </button>
      </form>

      <button
        className="btn btn-outline mt-4 w-full"
        onClick={() => {
          logout();
          navigate("/", { replace: true });
        }}
      >
        Выйти
      </button>

      {toast && <Toast message={toast.text} kind={toast.kind} onHide={() => setToast(null)} />}
    </div>
  );
}
