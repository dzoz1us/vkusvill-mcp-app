import type { Ingredient } from "../types";

interface IngredientItemProps {
  ingredient: Ingredient;
}

export default function IngredientItem({ ingredient }: IngredientItemProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-gray-700">{ingredient.name}</span>
      <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
        {ingredient.quantity} {ingredient.unit}
      </span>
    </div>
  );
}
