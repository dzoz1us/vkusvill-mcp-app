import type { Ingredient } from "@/shared/api";
import { unitLabel } from "@/shared/lib";

interface IngredientItemProps {
  ingredient: Ingredient;
}

export default function IngredientItem({ ingredient }: IngredientItemProps) {
  return (
    <div className="data-row">
      <span>{ingredient.name}</span>
      <span className="data-value whitespace-nowrap">
        {ingredient.quantity} {unitLabel(ingredient.unit)}
      </span>
    </div>
  );
}
