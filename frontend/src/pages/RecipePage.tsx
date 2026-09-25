import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { Recipe } from '../types';
import { ArrowLeft, Clock, Users, Flame, ArrowRight } from 'lucide-react';

export default function RecipePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [state, setState] = useState<'loading' | 'success' | 'error' | 'not_found'>('loading');

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        setState('loading');
        const data = await api.getRecipe(id);
        setRecipe(data);
        setState('success');
      } catch {
        setState('not_found');
      }
    };
    load();
  }, [id]);

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Загрузка рецепта...</p>
        </div>
      </div>
    );
  }

  if (state === 'not_found' || state === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <div className="text-5xl mb-4">🔍</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Рецепт не найден</h2>
          <p className="text-gray-500 mb-6">Возможно, он был удалён или перемещён.</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition"
          >
            Вернуться назад
          </button>
        </div>
      </div>
    );
  }

  if (!recipe) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Image */}
      <div className="relative h-64 sm:h-80 bg-gradient-to-br from-emerald-400 to-green-600">
        <div className="absolute inset-0 bg-black/20" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-10 p-2 bg-white/90 backdrop-blur rounded-xl hover:bg-white transition"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{recipe.name}</h1>
            <div className="flex items-center gap-4 text-white/90 text-sm">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {recipe.cook_time_minutes} мин
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {recipe.servings} порции
              </span>
              {recipe.nutrition && (
                <span className="flex items-center gap-1">
                  <Flame className="w-4 h-4" />
                  {recipe.nutrition.calories} ккал
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Nutrition */}
        {recipe.nutrition && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4">Пищевая ценность (на порцию)</h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500">{recipe.nutrition.calories}</div>
                <div className="text-xs text-gray-500 mt-1">ккал</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">{recipe.nutrition.protein}г</div>
                <div className="text-xs text-gray-500 mt-1">белки</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-500">{recipe.nutrition.fat}г</div>
                <div className="text-xs text-gray-500 mt-1">жиры</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">{recipe.nutrition.carbs}г</div>
                <div className="text-xs text-gray-500 mt-1">углеводы</div>
              </div>
            </div>
          </div>
        )}

        {/* Ingredients */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4">Ингредиенты</h3>
          <div className="space-y-3">
            {recipe.ingredients.map((ing, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-gray-700">{ing.name}</span>
                <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                  {ing.quantity} {ing.unit}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Steps */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4">Приготовление</h3>
          <div className="space-y-4">
            {recipe.steps.map((step, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-emerald-600">{i + 1}</span>
                </div>
                <p className="text-gray-700 pt-1">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-emerald-600 font-medium hover:text-emerald-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Вернуться к плану
        </button>
      </main>
    </div>
  );
}
