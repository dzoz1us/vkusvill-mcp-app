import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../store';
import type { MatchStatus } from '../types';
import {
  ArrowLeft, ShoppingCart, Check, AlertTriangle, XCircle,
  Package, ExternalLink, RefreshCw
} from 'lucide-react';

const STATUS_CONFIG: Record<MatchStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  matched: {
    label: 'Найден',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    icon: <Check className="w-3.5 h-3.5" />,
  },
  requires_review: {
    label: 'Проверьте',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
  },
  not_found: {
    label: 'Не найден',
    color: 'text-red-600',
    bg: 'bg-red-50',
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
};

export default function GroceryListPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    groceryList, groceryState, currentPlan,
    loadGroceryList, toggleBought,
    createCart, cartResponse, cartState, cartError, clearCart,
  } = useAppStore();

  useEffect(() => {
    if (id) {
      loadGroceryList(id);
    }
  }, [id]);

  if (groceryState === 'loading' || !groceryList) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Загрузка списка покупок...</p>
        </div>
      </div>
    );
  }

  const boughtItems = groceryList.items.filter(i => i.is_bought);
  const totalBoughtCost = boughtItems.reduce(
    (sum, i) => sum + (i.price_per_package ?? 0) * (i.package_count ?? 0),
    0
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg transition">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="font-bold text-gray-900">Список покупок</h1>
              <p className="text-xs text-gray-500">{groceryList.items.length} товаров</p>
            </div>
          </div>
          {id && (
            <Link
              to={`/plan/${id}`}
              className="text-sm text-emerald-600 font-medium hover:text-emerald-700 transition"
            >
              ← К плану
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-emerald-50 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-emerald-600">{groceryList.matched_count}</div>
            <div className="text-xs text-emerald-600 mt-1">Найдено</div>
          </div>
          <div className="bg-amber-50 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-amber-600">{groceryList.review_count}</div>
            <div className="text-xs text-amber-600 mt-1">Проверить</div>
          </div>
          <div className="bg-red-50 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-red-600">{groceryList.not_found_count}</div>
            <div className="text-xs text-red-600 mt-1">Не найдено</div>
          </div>
        </div>

        {/* Total */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Итого</p>
              <p className="text-2xl font-bold text-gray-900">{groceryList.total_cost.toLocaleString()} ₽</p>
              <p className="text-xs text-gray-400 mt-1">Ориентировочная стоимость</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Куплено</p>
              <p className="text-lg font-bold text-emerald-600">{totalBoughtCost.toLocaleString()} ₽</p>
              <p className="text-xs text-gray-400">{boughtItems.length} из {groceryList.items.length}</p>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-50">
            {groceryList.items.map(item => {
              const statusConfig = STATUS_CONFIG[item.match_status];
              return (
                <div
                  key={item.id}
                  className={`p-4 flex items-center gap-4 transition ${
                    item.is_bought ? 'bg-gray-50 opacity-60' : ''
                  } ${item.match_status === 'not_found' ? 'border-l-4 border-l-red-300' : ''}`}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleBought(item.id, !item.is_bought)}
                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition flex-shrink-0 ${
                      item.is_bought
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'border-gray-300 hover:border-emerald-400'
                    }`}
                  >
                    {item.is_bought && <Check className="w-4 h-4 text-white" />}
                  </button>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-medium truncate ${item.is_bought ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                        {item.product_name}
                      </p>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                        {statusConfig.icon}
                        {statusConfig.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        {item.needed_quantity} {item.needed_unit}
                      </span>
                      <span>
                        {item.package_count} × {item.package_quantity} {item.needed_unit}
                      </span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-right flex-shrink-0">
                    <p className={`font-semibold ${item.is_bought ? 'text-gray-400' : 'text-gray-900'}`}>
                      {((item.price_per_package ?? 0) * (item.package_count ?? 0)).toLocaleString()} ₽
                    </p>
                    <p className="text-xs text-gray-400">
                      {item.price_per_package} ₽/уп
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cart Button */}
        {id && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-2">Перейти в ВкусВилл</h3>
            <p className="text-sm text-gray-500 mb-4">
              Создадим корзину с этими продуктами. Цены и наличие могут измениться.
            </p>
            <button
              onClick={async () => {
                if (id) {
                  await createCart(id);
                }
              }}
              disabled={cartState === 'loading'}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-green-600 transition shadow-md shadow-emerald-200 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {cartState === 'loading' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Создаём корзину...
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  Создать корзину в ВкусВилл
                </>
              )}
            </button>
          </div>
        )}

        {/* Cart Modal */}
        {cartState === 'success' && cartResponse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
              {cartResponse.price_changed && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span className="text-sm text-amber-700">Цены обновились</span>
                </div>
              )}

              {cartResponse.unresolved_items > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  <span className="text-sm text-orange-700">
                    {cartResponse.unresolved_items} товар(ов) не найдены
                  </span>
                </div>
              )}

              <h3 className="text-lg font-bold text-gray-900 mb-2">Корзина готова!</h3>
              
              {cartResponse.carts.length > 1 && (
                <p className="text-sm text-gray-500 mb-4">
                  Лимит ВкусВилл — 20 позиций. Создано {cartResponse.carts.length} корзины.
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
                        {cartResponse.carts.length > 1 ? `Корзина ${i + 1}` : 'Перейти в ВкусВилл'}
                      </p>
                      <p className="text-sm text-emerald-600">{cart.items_count} товаров</p>
                    </div>
                    <ExternalLink className="w-5 h-5 text-emerald-500 group-hover:translate-x-1 transition-transform" />
                  </a>
                ))}
              </div>

              <button
                onClick={() => clearCart()}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
              >
                Закрыть
              </button>
            </div>
          </div>
        )}

        {cartState === 'error' && cartError && (
          <div className="fixed bottom-4 left-4 right-4 z-50 bg-red-500 text-white p-4 rounded-xl shadow-lg max-w-md mx-auto">
            <p className="text-sm">{cartError}</p>
          </div>
        )}
      </main>
    </div>
  );
}
