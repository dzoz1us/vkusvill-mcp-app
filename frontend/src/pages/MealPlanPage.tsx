import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../store';
import type { DayMeal, DayOfWeek } from '../types';
import { DAY_LABELS } from '../utils/helpers';
import { ShoppingCart, ArrowLeft, AlertTriangle, RefreshCw } from 'lucide-react';
import MealCard from '../components/MealCard';
import BudgetProgress from '../components/BudgetProgress';
import CartModal from '../components/CartModal';
import { useReplaceMeal } from '../hooks/useReplaceMeal';
import { useCartCreation } from '../hooks/useCartCreation';

export default function MealPlanPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    currentPlan, planState, planError,
    loadPlan, cartResponse, cartState, cartError, clearCart,
  } = useAppStore();

  const { replacingMealId, error: replaceError, handleReplace } = useReplaceMeal(id);
  const { isLoading: isCreatingCart, error: cartCreationError, handleCreateCart } = useCartCreation(id);
  const [showCartModal, setShowCartModal] = useState(false);

  useEffect(() => {
    if (id && (!currentPlan || currentPlan.id !== id)) {
      loadPlan(id);
    }
  }, [id]);

  useEffect(() => {
    if (cartState === 'success') {
      setShowCartModal(true);
    }
  }, [cartState]);

  if (planState === 'loading' || !currentPlan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Загрузка плана...</p>
        </div>
      </div>
    );
  }

  if (planState === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <div className="text-4xl mb-4">😔</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Ошибка</h2>
          <p className="text-gray-500 mb-6">{planError}</p>
          <button onClick={() => navigate('/')} className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition">
            На главную
          </button>
        </div>
      </div>
    );
  }

  // Group meals by day
  const mealsByDay = currentPlan.meals.reduce((acc, meal) => {
    if (!acc[meal.day]) acc[meal.day] = [];
    acc[meal.day].push(meal);
    return acc;
  }, {} as Record<string, DayMeal[]>);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 rounded-lg transition">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="font-bold text-gray-900">Ваш план питания</h1>
              <p className="text-xs text-gray-500">
                {currentPlan.params.people_count} чел. • {currentPlan.params.days.length} дней
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={`/plan/${id}/grocery`}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition shadow-sm"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">Список покупок</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Budget Progress */}
        <BudgetProgress
          currentCost={currentPlan.cart_estimated_cost}
          budget={currentPlan.budget}
        />

        {/* Unresolved items warning */}
        {currentPlan.unresolved_items_count > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <p className="text-sm text-amber-700">
              {currentPlan.unresolved_items_count} {currentPlan.unresolved_items_count === 1 ? 'товар' : 'товаров'} не удалось подобрать в ВкусВилл. 
              Проверьте список покупок для деталей.
            </p>
          </div>
        )}

        {/* Meals by day */}
        {Object.entries(mealsByDay).map(([day, meals]) => (
          <div key={day} className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span>{DAY_LABELS[day as DayOfWeek]}</span>
            </h2>
            <div className="grid gap-3">
              {meals.map(meal => (
                <MealCard
                  key={meal.id}
                  meal={meal}
                  isReplacing={replacingMealId === meal.id}
                  onReplace={handleReplace}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Replace error */}
        {replaceError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <p className="text-sm text-red-600">{replaceError}</p>
          </div>
        )}

        {/* Cart Button */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-2">Перейти в ВкусВилл</h3>
          <p className="text-sm text-gray-500 mb-4">
            Создадим корзину с продуктами из вашего плана. Цены и наличие могут измениться.
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
      </main>

      {/* Cart Modal */}
      {showCartModal && cartResponse && (
        <CartModal
          cartResponse={cartResponse}
          onClose={() => { setShowCartModal(false); clearCart(); }}
        />
      )}

      {/* Cart error toast */}
      {(cartState === 'error' || cartCreationError) && (
        <div className="fixed bottom-4 left-4 right-4 z-50 bg-red-500 text-white p-4 rounded-xl shadow-lg max-w-md mx-auto">
          <p className="text-sm">{cartError || cartCreationError}</p>
        </div>
      )}
    </div>
  );
}
