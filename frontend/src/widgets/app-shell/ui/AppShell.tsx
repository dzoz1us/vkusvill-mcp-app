import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { Icon, Logo, Sheet } from "@/shared/ui";
import type { IconName } from "@/shared/ui";
import { formatDate } from "@/shared/lib";
import { useUserStore } from "@/entities/user";
import { useNotificationStore } from "@/entities/notification";
import TabBar from "./TabBar";
import type { TabItem } from "./TabBar";

const LINKS: { to: string; label: string; icon: IconName; auth?: boolean }[] = [
  { to: "/catalog", label: "Рецепты", icon: "book-open-text" },
  { to: "/plans", label: "Планы", icon: "calendar-check", auth: true },
  { to: "/orders", label: "Заказы", icon: "shopping-cart", auth: true },
  { to: "/profile", label: "Профиль", icon: "user", auth: true },
];

function Bell_() {
  const navigate = useNavigate();
  const { items, unread, load, read, readAll } = useNotificationStore();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    void load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  return (
    <>
      <button className="icon-btn relative" onClick={() => setOpen(true)} aria-label="Уведомления" title="Уведомления">
        <Bell />
        {unread > 0 && <span className="badge">{unread}</span>}
      </button>
      {open && (
        <Sheet title="Уведомления" onClose={() => setOpen(false)}>
          {items.length === 0 ? (
            <p className="text-muted py-6 text-center">Пока ничего нет</p>
          ) : (
            <div className="space-y-3">
              <div className="max-h-[50vh] space-y-2 overflow-y-auto">
                {items.map((n) => (
                  <button
                    key={n.id}
                    className={`block w-full rounded-[24px] border p-4 text-left ${n.is_read ? "border-line" : "border-accent bg-accent-soft"}`}
                    onClick={() => {
                      void read(n.id);
                      if (n.order_id) {
                        setOpen(false);
                        navigate("/orders");
                      }
                    }}
                  >
                    <p className="font-bold">{n.title}</p>
                    {n.body && <p className="text-muted mt-0.5 text-sm">{n.body}</p>}
                    <p className="text-muted mt-1 text-xs">{formatDate(n.created_at)}</p>
                  </button>
                ))}
              </div>
              {unread > 0 && (
                <button className="btn btn-outline btn-sm w-full" onClick={() => void readAll()}>
                  Прочитать все
                </button>
              )}
            </div>
          )}
        </Sheet>
      )}
    </>
  );
}

/** Верхняя панель на компьютере, нижние вкладки на телефоне. */
export default function AppShell() {
  const { user } = useUserStore();
  const clear = useNotificationStore((s) => s.clear);

  useEffect(() => {
    if (!user) clear();
  }, [user, clear]);

  const unread = useNotificationStore((s) => s.unread);
  const links = LINKS.filter((l) => !l.auth || user);
  if (user?.role === "ADMIN") links.push({ to: "/admin", label: "Админка", icon: "fork-knife" });

  // нижнее меню: 4 пункта, «Профиль» последний; админка открывается из профиля
  const tabs: TabItem[] = user
    ? [
        { label: "Рецепты", to: "/catalog", icon: "book-open-text" },
        { label: "Планы", to: "/plans", icon: "calendar-check" },
        { label: "Заказы", to: "/orders", icon: "shopping-cart", badge: unread > 0 },
        { label: "Профиль", to: "/profile", icon: "user", also: ["/admin"] },
      ]
    : [
        { label: "Рецепты", to: "/catalog", icon: "book-open-text" },
        { label: "Составить меню", to: "/start", icon: "fork-knife" },
        { label: "Войти", to: "/login", icon: "user" },
      ];

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="mr-2" aria-label="На главную">
            <Logo />
          </Link>
          <nav className="hidden flex-1 gap-1 md:flex">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`}>
                <Icon name={l.icon} className="h-5 w-5" />
                {l.label}
              </NavLink>
            ))}
          </nav>
          <span className="flex-1 md:hidden" />
          {user ? (
            <Bell_ />
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">Войти</Link>
          )}
        </div>
      </header>

      <div className="pb-[110px] md:pb-0">
        <Outlet />
      </div>

      <TabBar tabs={tabs} />
    </>
  );
}
