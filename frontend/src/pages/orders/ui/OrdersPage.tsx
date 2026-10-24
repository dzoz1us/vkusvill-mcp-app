import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/shared/api";
import type { Order } from "@/shared/api";
import { errorText, formatDate, formatPrice } from "@/shared/lib";
import { FoodIcon, Toast } from "@/shared/ui";

export function statusTone(o: Pick<Order, "status_code" | "status_final">): string {
  if (o.status_code === "CANCELLED") return "pill-bad";
  if (o.status_final) return "pill-ok";
  return "pill-neutral";
}

export default function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    api.listOrders().then(setOrders).catch(() => setOrders([]));

  useEffect(() => {
    void load();
  }, []);

  const confirm = async (id: string) => {
    setBusy(id);
    try {
      await api.confirmOrder(id);
      await load();
    } catch (e) {
      setError(errorText(e, "Не удалось обновить заказ"));
    } finally {
      setBusy(null);
    }
  };

  const repeat = async (id: string) => {
    setBusy(id);
    try {
      const order = await api.repeatOrder(id);
      navigate(`/cart/${order.id}`);
    } catch (e) {
      setError(errorText(e, "Не удалось повторить заказ"));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="page">
      <h1 className="heading page-head">Заказы</h1>

      {orders === null && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-28" />
          ))}
        </div>
      )}

      {orders?.length === 0 && (
        <div className="py-12 text-center">
          <FoodIcon name="shopping-cart" className="mx-auto mb-3 h-16 w-16" />
          <p className="text-lg font-bold">Заказов пока нет</p>
          <p className="text-muted">Соберите план и перейдите во ВкусВилл</p>
          <Link to="/start" className="btn btn-primary mt-5">
            Составить меню
          </Link>
        </div>
      )}

      <div className="grid gap-3">
        {orders?.map((o) => (
          <article key={o.id} className="card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-bold">Заказ №{o.id}</p>
                <p className="text-muted text-sm">{formatDate(o.created_at)}</p>
              </div>
              <span className={`pill ${statusTone(o)}`}>{o.status_title}</span>
            </div>
            {o.status_description && <p className="text-muted mt-2 text-sm">{o.status_description}</p>}
            <p className="mt-2 font-bold">
              {formatPrice(Math.round(o.total_cost))}
              <span className="text-muted font-medium"> · {o.items_count} позиций</span>
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {o.status_code === "CREATED" && (
                <>
                  <Link to={`/cart/${o.id}`} className="btn btn-primary btn-sm">
                    Корзина
                  </Link>
                  <button className="btn btn-outline btn-sm" disabled={busy === o.id} onClick={() => confirm(o.id)}>
                    Я оформил заказ
                  </button>
                </>
              )}
              <button className="btn btn-outline btn-sm" disabled={busy === o.id} onClick={() => repeat(o.id)}>
                Повторить
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => setOpen(open === o.id ? null : o.id)}>
                {open === o.id ? "Скрыть состав" : "Состав"}
              </button>
              {o.plan_id && (
                <Link to={`/plan/${o.plan_id}`} className="btn btn-outline btn-sm">
                  План
                </Link>
              )}
            </div>

            {open === o.id && (
              <ul className="divide-line mt-3 divide-y text-sm">
                {o.items.map((it, i) => (
                  <li key={i} className="flex justify-between gap-3 py-2">
                    <span>
                      {it.product_name} <span className="text-muted">× {it.cart_quantity}</span>
                    </span>
                    <span className="font-bold whitespace-nowrap">
                      {it.total_price != null ? formatPrice(Math.round(it.total_price)) : "—"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>

      {error && <Toast message={error} onHide={() => setError(null)} />}
    </div>
  );
}
