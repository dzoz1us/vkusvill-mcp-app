import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Bookmark, Pencil, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { api } from "@/shared/api";
import { errorText } from "@/shared/lib";
import { FoodIcon, PageHeader, PageSkeleton, Sheet, StateCard, Toast } from "@/shared/ui";
import { useMealPlanStore, BudgetProgress } from "@/entities/meal-plan";
import { MealPlanDays } from "@/widgets/meal-plan-days";
import { CreateCartButton } from "@/features/create-cart";
import { AddMealSheet } from "@/features/add-meal";

export default function MealPlanPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentPlan, planState, planError, loadPlan, setPlan } = useMealPlanStore();
  const [adding, setAdding] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toast, setToast] = useState<{ text: string; kind: "ok" | "bad" } | null>(null);

  useEffect(() => {
    if (id) void loadPlan(id);
  }, [id, loadPlan]);

  if (planState === "error") {
    return (
      <StateCard
        icon={<FoodIcon name="confused-face" className="h-12 w-12" />}
        title="План не найден"
        text={planError ?? undefined}
        action={
          <button onClick={() => navigate("/plans")} className="btn btn-primary w-full">
            К моим планам
          </button>
        }
      />
    );
  }

  if (planState === "loading" || !currentPlan || currentPlan.id !== id) {
    return <PageSkeleton rows={4} />;
  }

  const planId = currentPlan.id;
  const saved = !!currentPlan.saved;
  const heading = currentPlan.title || "План питания";

  const toggleSaved = async () => {
    try {
      setPlan(await api.updatePlan(planId, { saved: !saved }));
      setToast({ text: saved ? "План убран из сохранённых" : "План сохранён", kind: "ok" });
    } catch (e) {
      setToast({ text: errorText(e, "Не удалось сохранить"), kind: "bad" });
    }
  };

  const saveTitle = async () => {
    try {
      setPlan(await api.updatePlan(planId, { title: title.trim(), saved: true }));
      setRenaming(false);
    } catch (e) {
      setToast({ text: errorText(e, "Не удалось переименовать"), kind: "bad" });
    }
  };

  const remove = async () => {
    try {
      await api.deletePlan(planId);
      navigate("/plans", { replace: true });
    } catch (e) {
      setConfirmDelete(false);
      setToast({ text: errorText(e, "Не удалось удалить"), kind: "bad" });
    }
  };

  return (
    <div className="page">
      <PageHeader
        title={heading}
        onBack={() => navigate("/plans")}
        action={
          <Link to={`/plan/${planId}/grocery`} className="icon-btn" aria-label="Список покупок" title="Список покупок">
            <ShoppingCart />
          </Link>
        }
      />

      <main className="space-y-6">
        <BudgetProgress currentCost={currentPlan.cart_estimated_cost} budget={currentPlan.budget} />

        {(currentPlan.omitted_meals ?? 0) > 0 && (
          <div className="alert alert-warn">
            Чтобы уложиться в бюджет, часть приёмов пищи пришлось убрать: {currentPlan.omitted_meals}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button className="chip" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" />
            Добавить блюдо
          </button>
          <button className={`chip ${saved ? "chip-active" : ""}`} aria-pressed={saved} onClick={toggleSaved}>
            <Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
            {saved ? "Сохранён" : "Сохранить"}
          </button>
          <button
            className="chip"
            onClick={() => {
              setTitle(currentPlan.title ?? "");
              setRenaming(true);
            }}
          >
            <Pencil className="h-4 w-4" />
            Название
          </button>
          <button className="chip hover:!border-danger hover:text-danger" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="h-4 w-4" />
            Удалить
          </button>
        </div>

        {currentPlan.meals.length === 0 ? (
          <p className="text-muted py-8 text-center">В плане пока нет блюд. Добавьте первое.</p>
        ) : (
          <MealPlanDays planId={planId} meals={currentPlan.meals} />
        )}

        {currentPlan.meals.length > 0 && <CreateCartButton planId={planId} />}
      </main>

      {adding && (
        <AddMealSheet
          planId={planId}
          days={currentPlan.params.days}
          onClose={() => setAdding(false)}
          onAdded={(plan) => {
            setPlan(plan);
            setAdding(false);
          }}
        />
      )}

      {renaming && (
        <Sheet title="Название плана" onClose={() => setRenaming(false)}>
          <div className="space-y-4">
            <input className="input" value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} placeholder="Например, неделя без мяса" autoFocus />
            <button className="btn btn-primary w-full" onClick={saveTitle}>
              Сохранить
            </button>
          </div>
        </Sheet>
      )}

      {confirmDelete && (
        <Sheet title="Удалить план?" onClose={() => setConfirmDelete(false)}>
          <div className="flex gap-3">
            <button className="btn btn-outline flex-1" onClick={() => setConfirmDelete(false)}>
              Отмена
            </button>
            <button className="btn btn-danger flex-1" onClick={remove}>
              Удалить
            </button>
          </div>
        </Sheet>
      )}

      {toast && <Toast message={toast.text} kind={toast.kind} onHide={() => setToast(null)} />}
    </div>
  );
}
