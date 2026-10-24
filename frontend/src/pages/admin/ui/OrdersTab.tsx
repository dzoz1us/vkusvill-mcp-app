import { useEffect, useState } from "react";
import { api } from "@/shared/api";
import type { Order, OrderStatus } from "@/shared/api";
import { errorText, formatDate, formatPrice } from "@/shared/lib";
import { Toast } from "@/shared/ui";

export default function OrdersTab() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [statuses, setStatuses] = useState<OrderStatus[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.admin.orders().then(setOrders).catch(() => setOrders([]));
    api.listOrderStatuses().then(setStatuses).catch(() => undefined);
  }, []);

  const change = async (o: Order, code: string) => {
    try {
      const next = await api.admin.setOrderStatus(o.id, code);
      setOrders((cur) => cur?.map((x) => (x.id === o.id ? next : x)) ?? cur);
    } catch (e) {
      setError(errorText(e, "Не удалось сменить статус"));
    }
  };

  return (
    <div className="grid gap-3">
      {orders === null && <div className="skeleton h-24" />}
      {orders?.length === 0 && <p className="text-muted py-8 text-center">Заказов пока нет</p>}
      {orders?.map((o) => (
        <article key={o.id} className="card flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-bold">Заказ №{o.id}</p>
            <p className="text-muted text-sm">
              {o.user_email} · {formatDate(o.created_at)}
            </p>
            <p className="text-sm font-bold">
              {formatPrice(Math.round(o.total_cost))} · {o.items_count} позиций
            </p>
          </div>
          <select className="input !w-auto !py-2 !text-base" value={o.status_code} onChange={(e) => change(o, e.target.value)} aria-label="Статус заказа">
            {statuses.map((s) => (
              <option key={s.code} value={s.code}>{s.title}</option>
            ))}
          </select>
        </article>
      ))}
      {error && <Toast message={error} onHide={() => setError(null)} />}
    </div>
  );
}
