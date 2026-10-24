import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FoodIcon, PageHeader, PageSkeleton, StateCard, Toast } from "@/shared/ui";
import { useRecipe } from "@/entities/recipe";
import { useUserStore } from "@/entities/user";
import { RecipeDetails } from "@/widgets/recipe-details";
import { FavoriteButton } from "@/features/favorite-recipe";
import { AddMealSheet } from "@/features/add-meal";

export default function RecipePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const { recipe, state } = useRecipe(id);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  if (state === "loading") return <PageSkeleton rows={3} />;

  if (state === "not_found" || !recipe) {
    return (
      <StateCard
        icon={<FoodIcon name="confused-face" className="h-12 w-12" />}
        title="Рецепт не найден"
        action={
          <button onClick={() => navigate(-1)} className="btn btn-primary w-full">
            Назад
          </button>
        }
      />
    );
  }

  return (
    <div className="page">
      <PageHeader
        title={recipe.name}
        onBack={() => navigate(-1)}
        action={<FavoriteButton recipeId={recipe.id} active={!!recipe.is_favorite} />}
      />
      <main className="space-y-8">
        <RecipeDetails recipe={recipe} />
        <button
          className="btn btn-primary w-full"
          onClick={() => (user ? setAdding(true) : navigate(`/login?next=/recipe/${recipe.id}`))}
        >
          Добавить в план
        </button>
      </main>

      {adding && (
        <AddMealSheet
          recipe={recipe}
          onClose={() => setAdding(false)}
          onAdded={(plan) => {
            setAdding(false);
            navigate(`/plan/${plan.id}`);
          }}
        />
      )}
      {toast && <Toast message={toast} onHide={() => setToast(null)} />}
    </div>
  );
}
