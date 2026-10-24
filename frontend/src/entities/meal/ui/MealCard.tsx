import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type { DayMeal } from "@/shared/api";
import { MEAL_LABELS } from "@/shared/lib";
import { Icon, DishArt } from "@/shared/ui";
import type { IconName } from "@/shared/ui";

const MEAL_STYLE: Record<string, { icon: IconName; tone: string }> = {
  breakfast: { icon: "sun-horizon", tone: "text-[#d99a00]" },
  lunch: { icon: "sun", tone: "text-accent-ink" },
  dinner: { icon: "moon-stars", tone: "text-berry" },
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
          <Icon name={style.icon} className={`h-[18px] w-[18px] ${style.tone}`} />
          {MEAL_LABELS[meal.meal_type]}
        </p>
        <Link
          to={`/recipe/${recipe.id}`}
          className="hover:text-accent-ink block text-[17px] leading-snug font-bold transition-colors"
        >
          {recipe.name}
        </Link>
        <p className="text-muted mt-0.5 text-sm">
          {recipe.cook_time_minutes} мин{n && ` · ${n.calories} ккал`}
        </p>
      </div>

      <div className="flex flex-shrink-0 flex-col gap-2">
        {actions}
        <Link
          to={`/recipe/${recipe.id}`}
          className="icon-btn"
          aria-label="Открыть рецепт"
          title="Открыть рецепт"
        >
          <ArrowRight />
        </Link>
      </div>
    </article>
  );
}
