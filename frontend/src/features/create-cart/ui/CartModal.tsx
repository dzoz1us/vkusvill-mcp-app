import { AlertTriangle } from "lucide-react";
import type { CartResponse } from "@/shared/api";
import { Sheet } from "@/shared/ui";

interface CartModalProps {
  cartResponse: CartResponse;
  onClose: () => void;
}

export default function CartModal({ cartResponse, onClose }: CartModalProps) {
  const hasCarts = cartResponse.carts.length > 0;

  return (
    <Sheet
      title={hasCarts ? "Корзина готова" : "Корзина не создана"}
      onClose={onClose}
    >
      <div className="space-y-3">
        {cartResponse.price_changed && (
          <div className="alert alert-warn">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>Цены обновились</span>
          </div>
        )}

        {cartResponse.unresolved_items > 0 && (
          <div className="alert alert-warn">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>Не найдено: {cartResponse.unresolved_items}</span>
          </div>
        )}

        {!hasCarts && (
          <p className="text-muted">Проверьте список покупок</p>
        )}

        {cartResponse.carts.map((cart, i) => (
          <a
            key={i}
            href={cart.cart_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary w-full"
          >
            <span>
              {cartResponse.carts.length > 1 ? `Корзина ${i + 1}` : "Открыть"}
              <span className="ml-2 font-semibold opacity-90">
                · {cart.items_count} шт.
              </span>
            </span>
          </a>
        ))}
      </div>
    </Sheet>
  );
}
