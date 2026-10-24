import type { Recipe } from "@/shared/api";
import { DishArt, FoodIcon } from "@/shared/ui";
import { IngredientItem } from "@/entities/recipe";

export default function RecipeDetails({ recipe }: { recipe: Recipe }) {
  const n = recipe.nutrition;

  return (
    <div className="space-y-8">
      <DishArt
        recipeName={recipe.name}
        className="h-56 w-full rounded-[32px] sm:h-72"
      />

      <div className="flex flex-wrap justify-center gap-2">
        <span className="chip pointer-events-none">
          <FoodIcon name="stopwatch" className="h-5 w-5" />
          {recipe.cook_time_minutes} мин
        </span>
        <span className="chip pointer-events-none">
          <FoodIcon name="busts-in-silhouette" className="h-5 w-5" />
          {recipe.servings} порц.
        </span>
        {n && (
          <span className="chip pointer-events-none">
            <FoodIcon name="fire" className="h-5 w-5" />
            {n.calories} ккал
          </span>
        )}
      </div>

      {n && (
        <section className="space-y-3">
          <h2 className="block-title">На порцию</h2>
          <div className="data-frame">
            <div className="data-row">
              <span className="data-label">Белки</span>
              <span className="data-value text-ink">{n.protein} г</span>
            </div>
            <div className="data-row">
              <span className="data-label">Жиры</span>
              <span className="data-value">{n.fat} г</span>
            </div>
            <div className="data-row">
              <span className="data-label">Углеводы</span>
              <span className="data-value text-ink">{n.carbs} г</span>
            </div>
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="block-title">Ингредиенты</h2>
        <div className="data-frame">
          {recipe.ingredients.map((ing, i) => (
            <IngredientItem key={i} ingredient={ing} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="block-title">Приготовление</h2>
        <ol className="space-y-4">
          {recipe.steps.map((step, i) => (
            <li key={i} className="flex gap-4">
              <span className="bg-accent-soft text-ink flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl font-bold">
                {i + 1}
              </span>
              <p className="pt-1">{step}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
