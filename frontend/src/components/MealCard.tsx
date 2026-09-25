import { Link } from 'react-router-dom';
import type { DayMeal } from '../types';
import { MEAL_LABELS, MEAL_EMOJIS } from '../utils/helpers';
import { Clock, RefreshCw, ChevronRight } from 'lucide-react';

interface MealCardProps {
  meal: DayMeal;
  isReplacing: boolean;
  onReplace: (mealId: string) => void;
}

export default function MealCard({ meal, isReplacing, onReplace }: MealCardProps) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition group">
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
            onClick={() => onReplace(meal.id)}
            disabled={isReplacing}
            className={`p-2 rounded-lg transition ${
              isReplacing
                ? 'bg-emerald-100 text-emerald-500'
                : 'hover:bg-gray-100 text-gray-400 hover:text-emerald-500 opacity-0 group-hover:opacity-100'
            }`}
            title="Заменить блюдо"
          >
            <RefreshCw className={`w-4 h-4 ${isReplacing ? 'animate-spin' : ''}`} />
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
  );
}
