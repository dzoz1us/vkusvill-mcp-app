import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { DayMeal } from "@/shared/api";
import { MEAL_LABELS } from "@/shared/lib";
import { DayPhase, DishArt } from "@/shared/ui";
import type { DayPhaseName } from "@/shared/ui";

const MEAL_STYLE: Record<string, { phase: DayPhaseName }> = {
  breakfast: { phase: "sunrise" },
  lunch: { phase: "day" },
  dinner: { phase: "sunset" },
};

interface MealCardProps {
  meal: DayMeal;
  /** Слот для действий фичи (например, замена блюда). */
  actions?: ReactNode;
}

/** Компактная карточка блюда: фото слева, справа название, приём пищи и действия. */
export default function MealCard({ meal, actions }: MealCardProps) {
  const { recipe } = meal;
  const n = recipe.nutrition;
  const style = MEAL_STYLE[meal.meal_type] ?? MEAL_STYLE.dinner;

  return (
    <article className="card flex items-center gap-4 p-3">
      <Link to={`/recipe/${recipe.id}`} className="flex-shrink-0" tabIndex={-1} aria-hidden="true">
        <DishArt
          recipeName={recipe.name}
          className="h-[92px] w-[92px] rounded-[26px]"
        />
      </Link>

      <div className="min-w-0 flex-1">
        <p className="text-muted mb-1 flex items-center gap-1.5 text-sm font-semibold">
          <DayPhase phase={style.phase} className="h-6 w-6" />
          {MEAL_LABELS[meal.meal_type]}
        </p>
        <Link
          to={`/recipe/${recipe.id}`}
          className="hover:text-accent-strong block text-[17px] leading-snug font-bold transition-colors"
        >
          {recipe.name}
        </Link>
        <p className="text-muted mt-0.5 text-sm">
          {recipe.cook_time_minutes} мин{n && ` · ${n.calories} ккал`}
        </p>
        {actions && <div className="mt-2 flex flex-wrap items-center gap-2">{actions}</div>}
      </div>

    </article>
  );
}
