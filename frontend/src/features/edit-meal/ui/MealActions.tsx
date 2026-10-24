import { useState } from "react";
import { Minus, Plus, RefreshCw, Trash2 } from "lucide-react";
import { api } from "@/shared/api";
import type { DayMeal } from "@/shared/api";
import { errorText } from "@/shared/lib";
import { Toast } from "@/shared/ui";
import { useMealPlanStore } from "@/entities/meal-plan";

/** Действия над блюдом в плане: порции, замена, удаление. */
export default function MealActions({ planId, meal }: { planId: string; meal: DayMeal }) {
  const setPlan = useMealPlanStore((s) => s.setPlan);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const servings = meal.servings ?? meal.recipe.servings;

  const run = async (fn: () => Promise<void>, fallback: string) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(errorText(e, fallback));
    } finally {
      setBusy(false);
    }
  };

  const changeServings = (delta: number) => {
    const next = servings + delta;
    if (next < 1 || next > 12) return;
    void run(async () => setPlan(await api.updateServings(planId, meal.id, next)), "Не удалось изменить порции");
  };

  return (
    <>
      <span className="border-line inline-flex items-center rounded-full border">
        <button className="icon-btn !h-9 !w-9 !border-0" onClick={() => changeServings(-1)} disabled={busy || servings <= 1} aria-label="Меньше порций">
          <Minus />
        </button>
        <span className="min-w-[3.2rem] text-center text-sm font-bold">{servings} порц.</span>
        <button className="icon-btn !h-9 !w-9 !border-0" onClick={() => changeServings(1)} disabled={busy || servings >= 12} aria-label="Больше порций">
          <Plus />
        </button>
      </span>
      <button
        className="icon-btn !h-9 !w-9"
        disabled={busy}
        aria-label="Заменить блюдо"
        title="Заменить блюдо"
        onClick={() => run(async () => setPlan((await api.replaceMeal(planId, meal.id)).plan), "Замена не подошла")}
      >
        <RefreshCw className={busy ? "animate-spin" : ""} />
      </button>
      <button
        className="icon-btn !h-9 !w-9 hover:!border-danger hover:text-danger"
        disabled={busy}
        aria-label="Убрать блюдо"
        title="Убрать блюдо"
        onClick={() => run(async () => setPlan(await api.removeMeal(planId, meal.id)), "Не удалось убрать блюдо")}
      >
        <Trash2 />
      </button>
      {error && <Toast message={error} onHide={() => setError(null)} />}
    </>
  );
}
