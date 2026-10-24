import { useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { AlertTriangle, ShoppingCart } from "lucide-react";
import { FoodIcon, PageHeader, PageSkeleton, StateCard } from "@/shared/ui";
import { useMealPlanStore, BudgetProgress } from "@/entities/meal-plan";
import { MealPlanDays } from "@/widgets/meal-plan-days";
import { CreateCartButton } from "@/features/create-cart";

export default function MealPlanPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentPlan, planState, planError, loadPlan } = useMealPlanStore();

  useEffect(() => {
    if (id && (!currentPlan || currentPlan.id !== id)) {
      void loadPlan(id);
    }
  }, [id]);

  if (planState === "error") {
    return (
      <StateCard
        icon={<FoodIcon name="confused-face" className="h-12 w-12" />}
        title="Ошибка"
        text={planError ?? undefined}
        action={
          <button onClick={() => navigate("/start")} className="btn btn-primary w-full">
            На главную
          </button>
        }
      />
    );
  }

  if (planState === "loading" || !currentPlan || currentPlan.id !== id) {
    return <PageSkeleton rows={4} />;
  }

  const planId = currentPlan.id;

  return (
    <div className="page">
      <PageHeader
        title="План питания"
        onBack={() => navigate("/start")}
        action={
          <Link
            to={`/plan/${planId}/grocery`}
            className="icon-btn"
            aria-label="Список покупок"
            title="Список покупок"
          >
            <ShoppingCart />
          </Link>
        }
      />

      <main className="space-y-6">
        <BudgetProgress
          currentCost={currentPlan.cart_estimated_cost}
          budget={currentPlan.budget}
        />

        {currentPlan.unresolved_items_count > 0 && (
          <div className="alert alert-warn">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <p>Не подобрано в ВкусВилл: {currentPlan.unresolved_items_count}</p>
          </div>
        )}

        <MealPlanDays planId={planId} meals={currentPlan.meals} />

        <CreateCartButton planId={planId} />
      </main>
    </div>
  );
}
