import { useEffect, useState } from "react";
import { api } from "@/shared/api";
import type { User } from "@/shared/api";
import { errorText, formatDate } from "@/shared/lib";
import { Toast } from "@/shared/ui";
import { useUserStore } from "@/entities/user";

export default function UsersTab() {
  const me = useUserStore((s) => s.user);
  const [users, setUsers] = useState<User[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.admin.users().then(setUsers).catch((e) => {
      setError(errorText(e, "Не удалось загрузить пользователей"));
      setUsers([]);
    });
  }, []);

  const update = async (u: User, patch: { blocked?: boolean; role?: "CLIENT" | "ADMIN" }) => {
    try {
      const next = await api.admin.updateUser(u.id, patch);
      setUsers((cur) => cur?.map((x) => (x.id === u.id ? next : x)) ?? cur);
    } catch (e) {
      setError(errorText(e, "Не удалось изменить пользователя"));
    }
  };

  return (
    <div className="grid gap-3">
      {users === null && <div className="skeleton h-24" />}
      {users?.map((u) => (
        <article key={u.id} className="card flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-bold">
              {u.name} {u.blocked && <span className="pill pill-bad">Заблокирован</span>}
            </p>
            <p className="text-muted text-sm">
              {u.email} · {formatDate(u.created_at)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="input !w-auto !py-2 !text-base"
              value={u.role}
              disabled={u.id === me?.id}
              aria-label="Роль"
              onChange={(e) => update(u, { role: e.target.value as "CLIENT" | "ADMIN" })}
            >
              <option value="CLIENT">Клиент</option>
              <option value="ADMIN">Администратор</option>
            </select>
            <button
              className={`btn btn-sm ${u.blocked ? "btn-outline" : "btn-danger"}`}
              disabled={u.id === me?.id}
              onClick={() => update(u, { blocked: !u.blocked })}
            >
              {u.blocked ? "Разблокировать" : "Заблокировать"}
            </button>
          </div>
        </article>
      ))}
      {error && <Toast message={error} onHide={() => setError(null)} />}
    </div>
  );
}
