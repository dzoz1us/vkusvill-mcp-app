import type { CartResponse } from "../types";
import { AlertTriangle, ExternalLink } from "lucide-react";

interface CartModalProps {
  cartResponse: CartResponse;
  onClose: () => void;
}

export default function CartModal({ cartResponse, onClose }: CartModalProps) {
  const hasCarts = cartResponse.carts.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
        {cartResponse.price_changed && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-sm text-amber-700">
              Цены обновились с момента создания плана
            </span>
          </div>
        )}

        {cartResponse.unresolved_items > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <span className="text-sm text-orange-700">
              {cartResponse.unresolved_items} товар(ов) не найдены в каталоге
            </span>
          </div>
        )}

        <h3 className="text-lg font-bold text-gray-900 mb-2">
          {hasCarts ? "Корзина готова!" : "Корзину пока не удалось создать"}
        </h3>

        {!hasCarts && (
          <p className="text-sm text-gray-500 mb-4">
            В списке нет товаров, которые можно автоматически добавить во
            ВкусВилл. Проверьте список покупок.
          </p>
        )}

        {cartResponse.carts.length > 1 && (
          <p className="text-sm text-gray-500 mb-4">
            В корзине ВкусВилл лимит 20 позиций, поэтому создано{" "}
            {cartResponse.carts.length} корзины.
          </p>
        )}

        <div className="space-y-3 mb-6">
          {cartResponse.carts.map((cart, i) => (
            <a
              key={i}
              href={cart.cart_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition group"
            >
              <div>
                <p className="font-medium text-emerald-700">
                  {cartResponse.carts.length > 1
                    ? `Корзина ${i + 1}`
                    : "Перейти в ВкусВилл"}
                </p>
                <p className="text-sm text-emerald-600">
                  {cart.items_count} товаров
                </p>
              </div>
              <ExternalLink className="w-5 h-5 text-emerald-500 group-hover:translate-x-1 transition-transform" />
            </a>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
        >
          Закрыть
        </button>
      </div>
    </div>
  );
}
