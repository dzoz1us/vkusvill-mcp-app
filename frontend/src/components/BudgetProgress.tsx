import { TrendingUp } from 'lucide-react';
import { formatPrice, getBudgetColor, getBudgetBarColor } from '../utils/helpers';

interface BudgetProgressProps {
  currentCost: number;
  budget: number;
}

export default function BudgetProgress({ currentCost, budget }: BudgetProgressProps) {
  const percent = Math.min(100, (currentCost / budget) * 100);
  const budgetColor = getBudgetColor(percent);
  const budgetBarColor = getBudgetBarColor(percent);

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-500" />
          <span className="font-medium text-gray-900">Бюджет</span>
        </div>
        <span className={`font-bold ${budgetColor}`}>
          {formatPrice(currentCost)} / {formatPrice(budget)}
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${budgetBarColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="flex justify-between mt-2">
        <span className="text-xs text-gray-400">Ориентировочная стоимость</span>
        <span className="text-xs text-gray-400">{Math.round(percent)}% использовано</span>
      </div>
    </div>
  );
}
