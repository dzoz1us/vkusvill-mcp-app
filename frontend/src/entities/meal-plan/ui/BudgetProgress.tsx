import { formatPrice, getBudgetColor, getBudgetBarColor } from "@/shared/lib";

interface BudgetProgressProps {
  currentCost: number;
  budget: number;
}

export default function BudgetProgress({
  currentCost,
  budget,
}: BudgetProgressProps) {
  const rawPercent = (currentCost / budget) * 100;
  const percent = Math.min(100, rawPercent);

  return (
    <div className="data-frame">
      <div className="data-row">
        <span className="data-label">Бюджет</span>
        <span className="data-value">{formatPrice(budget)}</span>
      </div>
      <div className="data-row">
        <span className="data-label">Стоимость</span>
        <span className={`data-value ${getBudgetColor(rawPercent)}`}>
          {formatPrice(currentCost)}
        </span>
      </div>
      <div className="px-5 py-4">
        <div
          className="border-line h-3 w-full overflow-hidden rounded-full border bg-white"
          role="progressbar"
          aria-valuenow={Math.round(percent)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Использовано от бюджета"
        >
          <div
            className={`h-full rounded-full transition-all duration-500 ${getBudgetBarColor(rawPercent)}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
