import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../store';
import { ArrowLeft, ShoppingCart, AlertTriangle, RefreshCw } from 'lucide-react';
import ProductMatchCard from '../components/ProductMatchCard';
import CartModal from '../components/CartModal';
import { useGroceryToggle } from '../hooks/useGroceryToggle';
import { useCartCreation } from '../hooks/useCartCreation';
import { formatPrice } from '../utils/helpers';

export default function GroceryListPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    groceryList, groceryState,
    loadGroceryList, cartResponse, cartState, cartError, clearCart,
  } = useAppStore();

  const { handleToggle } = useGroceryToggle();
  const { isLoading: isCreatingCart, error: cartCreationError, handleCreateCart } = useCartCreation(id);
  const [showCartModal, setShowCartModal] = useState(false);

  useEffect(() => {
    if (id) {
      loadGroceryList(id);
    }
  }, [id]);

  useEffect(() => {
    if (cartState === 'success') {
      setShowCartModal(true);
    }
  }, [cartState]);

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
  const totalBoughtCost = boughtItems.reduce((sum, i) => sum + i.price_per_package * i.package_count, 0);

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
              <p className="text-2xl font-bold text-gray-900">{formatPrice(groceryList.total_cost)}</p>
              <p className="text-xs text-gray-400 mt-1">Ориентировочная стоимость</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Куплено</p>
              <p className="text-lg font-bold text-emerald-600">{formatPrice(totalBoughtCost)}</p>
              <p className="text-xs text-gray-400">{boughtItems.length} из {groceryList.items.length}</p>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-50">
            {groceryList.items.map(item => (
              <ProductMatchCard
                key={item.id}
                item={item}
                onToggle={handleToggle}
              />
            ))}
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
              onClick={handleCreateCart}
              disabled={isCreatingCart}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-green-600 transition shadow-md shadow-emerald-200 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isCreatingCart ? (
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
        {showCartModal && cartResponse && (
          <CartModal
            cartResponse={cartResponse}
            onClose={() => { setShowCartModal(false); clearCart(); }}
          />
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
