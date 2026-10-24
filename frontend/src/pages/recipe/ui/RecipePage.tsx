import { useParams, useNavigate } from "react-router-dom";
import { FoodIcon, PageHeader, PageSkeleton, StateCard } from "@/shared/ui";
import { useRecipe } from "@/entities/recipe";
import { RecipeDetails } from "@/widgets/recipe-details";

export default function RecipePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { recipe, state } = useRecipe(id);

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
      <PageHeader title={recipe.name} onBack={() => navigate(-1)} />
      <main>
        <RecipeDetails recipe={recipe} />
      </main>
    </div>
  );
}
