import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@/shared/api";
import type { Order } from "@/shared/api";
import { formatPrice } from "@/shared/lib";
import { FoodIcon, PageHeader, PageSkeleton, StateCard } from "@/shared/ui";

/** Корзина приложения: что понадобится для меню, перед переходом во ВкусВилл. */
export default function CartPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    api.getOrder(orderId).then(setOrder).catch(() => setFailed(true));
  }, [orderId]);

  if (failed) {
    return (
      <StateCard
        icon={<FoodIcon name="confused-face" className="h-12 w-12" />}
        title="Корзина не нашлась"
        action={
          <button onClick={() => navigate("/orders")} className="btn btn-primary w-full">
            К заказам
          </button>
        }
      />
    );
  }
  if (!order) return <PageSkeleton rows={4} />;

  return (
    <div className="page">
      <PageHeader title="Корзина" onBack={() => navigate(-1)} />

      <main className="space-y-6">
        <div>
          <h2 className="block-title">Для вашего меню понадобятся эти продукты</h2>
          <p className="text-muted mt-2">Мы собрали их в одну корзину ВкусВилл. Останется проверить и оформить заказ.</p>
        </div>

        <div className="data-frame">
          {order.items.map((it, i) => (
            <div key={i} className="data-row">
              <div className="min-w-0">
                <p className="font-bold">{it.product_name}</p>
                <p className="text-muted text-sm">
                  {it.sold_by_weight ? `${it.cart_quantity} кг` : `${it.package_count} шт.`}
                </p>
              </div>
              <span className="data-value whitespace-nowrap">
                {it.total_price != null ? formatPrice(Math.round(it.total_price)) : "—"}
              </span>
            </div>
          ))}
          <div className="data-row">
            <span className="data-label">Итого</span>
            <span className="data-value">{formatPrice(Math.round(order.total_cost))}</span>
          </div>
        </div>

        {order.cart_url ? (
          <a href={order.cart_url} className="btn btn-primary w-full">
            Перейти во ВкусВилл
          </a>
        ) : (
          <p className="text-muted text-center">В корзину ничего не попало</p>
        )}
      </main>
    </div>
  );
}
