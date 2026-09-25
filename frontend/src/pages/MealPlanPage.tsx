import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../store';
import type { DayMeal, DayOfWeek } from '../types';
import {
  Clock, ShoppingCart, RefreshCw, ChevronRight, AlertTriangle,
  ArrowLeft, ExternalLink, TrendingUp
} from 'lucide-react';

const DAY_LABELS: Record<DayOfWeek, string> = {
  mon: 'Понедельник',
  tue: 'Вторник',
  wed: 'Среда',
  thu: 'Четверг',
  fri: 'Пятница',
  sat: 'Суббота',
  sun: 'Воскресенье',
};

const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Завтрак',
  lunch: 'Обед',
  dinner: 'Ужин',
};

const MEAL_EMOJIS: Record<string, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
};

export default function MealPlanPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    currentPlan, planState, planError,
    loadPlan, replaceMeal, replacingMealId, replaceState,
    createCart, cartResponse, cartState, cartError, clearCart,
    refreshPrices,
  } = useAppStore();

  const [priceWarning, setPriceWarning] = useState(false);
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

  const budgetPercent = Math.min(100, (currentPlan.cart_estimated_cost / currentPlan.budget) * 100);
  const budgetColor = budgetPercent > 90 ? 'text-red-500' : budgetPercent > 70 ? 'text-amber-500' : 'text-emerald-500';
  const budgetBarColor = budgetPercent > 90 ? 'bg-red-500' : budgetPercent > 70 ? 'bg-amber-500' : 'bg-emerald-500';

  const handleReplace = async (mealId: string) => {
    if (replacingMealId || !id) return;
    await replaceMeal(id, mealId);
  };

  const handleCreateCart = async () => {
    if (!id) return;
    try {
      const result = await refreshPrices(id);
      if (result.cost_changed) {
        setPriceWarning(true);
      }
      // reload plan so unresolved_items_count and cost get updated
      await loadPlan(id);
    } catch {
      // Continue anyway
    }
    await createCart(id);
  };

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
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              <span className="font-medium text-gray-900">Бюджет</span>
            </div>
            <span className={`font-bold ${budgetColor}`}>
              {currentPlan.cart_estimated_cost.toLocaleString()} ₽ / {currentPlan.budget.toLocaleString()} ₽
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${budgetBarColor}`}
              style={{ width: `${budgetPercent}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-400">Ориентировочная стоимость</span>
            <span className="text-xs text-gray-400">{Math.round(budgetPercent)}% использовано</span>
          </div>
        </div>

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
                <div
                  key={meal.id}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition group"
                >
                  <div className="flex items-start gap-4">
                    {/* Image */}
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center text-2xl flex-shrink-0">
                      {MEAL_EMOJIS[meal.meal_type]}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          {MEAL_LABELS[meal.meal_type]}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {meal.recipe.cook_time_minutes} мин
                        </span>
                      </div>
                      <Link
                        to={`/recipe/${meal.recipe.id}`}
                        className="font-semibold text-gray-900 hover:text-emerald-600 transition block truncate"
                      >
                        {meal.recipe.name}
                      </Link>
                      {meal.recipe.nutrition && (
                        <p className="text-xs text-gray-400 mt-1">
                          {meal.recipe.nutrition.calories} ккал • Б:{meal.recipe.nutrition.protein} Ж:{meal.recipe.nutrition.fat} У:{meal.recipe.nutrition.carbs}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleReplace(meal.id)}
                        disabled={replacingMealId === meal.id}
                        className={`p-2 rounded-lg transition ${
                          replacingMealId === meal.id
                            ? 'bg-emerald-100 text-emerald-500'
                            : 'hover:bg-gray-100 text-gray-400 hover:text-emerald-500 opacity-0 group-hover:opacity-100'
                        }`}
                        title="Заменить блюдо"
                      >
                        <RefreshCw className={`w-4 h-4 ${replacingMealId === meal.id ? 'animate-spin' : ''}`} />
                      </button>
                      <Link
                        to={`/recipe/${meal.recipe.id}`}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Replace error */}
        {replaceState === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <p className="text-sm text-red-600">Не удалось заменить блюдо. Попробуйте ещё раз.</p>
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
            disabled={cartState === 'loading'}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-green-600 transition shadow-md shadow-emerald-200 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {cartState === 'loading' ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            {priceWarning && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-amber-700">Цены обновились с момента создания плана</span>
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

            <h3 className="text-lg font-bold text-gray-900 mb-2">Корзина готова!</h3>
            
            {cartResponse.carts.length > 1 && (
              <p className="text-sm text-gray-500 mb-4">
                В корзине ВкусВилл лимит 20 позиций, поэтому создано {cartResponse.carts.length} корзины.
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
              onClick={() => { setShowCartModal(false); clearCart(); }}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      {/* Cart error */}
      {cartState === 'error' && (
        <div className="fixed bottom-4 left-4 right-4 z-50 bg-red-500 text-white p-4 rounded-xl shadow-lg max-w-md mx-auto">
          <p className="text-sm">{cartError}</p>
        </div>
      )}
    </div>
  );
}
