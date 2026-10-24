import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { RecipeShort } from "@/shared/api";
import { DishArt, FoodIcon } from "@/shared/ui";

/** Карточка рецепта в каталоге: рисунок слева, название и коротко о блюде справа. */
export default function RecipeCard({ recipe, actions }: { recipe: RecipeShort; actions?: ReactNode }) {
  const n = recipe.nutrition;
  return (
    <article className="card flex items-center gap-4 p-3">
      <Link to={`/recipe/${recipe.id}`} className="flex-shrink-0" tabIndex={-1} aria-hidden="true">
        <DishArt recipeName={recipe.name} className="h-[92px] w-[92px] rounded-[26px]" />
      </Link>
      <div className="min-w-0 flex-1">
        <Link
          to={`/recipe/${recipe.id}`}
          className="hover:text-accent-ink block text-[17px] leading-snug font-bold transition-colors"
        >
          {recipe.name}
        </Link>
        <p className="text-muted mt-1 flex flex-wrap items-center gap-x-3 text-sm">
          <span className="flex items-center gap-1">
            <FoodIcon name="stopwatch" className="h-4 w-4" />
            {recipe.cook_time_minutes} мин
          </span>
          {n && (
            <span className="flex items-center gap-1">
              <FoodIcon name="fire" className="h-4 w-4" />
              {n.calories} ккал
            </span>
          )}
        </p>
        {recipe.categories && recipe.categories.length > 0 && (
          <p className="text-muted mt-1 truncate text-xs">
            {recipe.categories.map((c) => c.name).join(" · ")}
          </p>
        )}
        {recipe.published === false && <span className="pill pill-warn mt-1">Скрыт</span>}
      </div>
      {actions && <div className="flex flex-shrink-0 flex-col gap-2">{actions}</div>}
    </article>
  );
}
