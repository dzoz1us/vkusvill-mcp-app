import { useEffect, useState } from "react";
import { api } from "@/shared/api";
import type { DayOfWeek, MealPlan, MealType, PlanSummary, RecipeShort } from "@/shared/api";
import { DAY_LABELS, MEAL_LABELS, errorText } from "@/shared/lib";
import { DishArt, Sheet } from "@/shared/ui";

const DAY_ORDER: DayOfWeek[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const MEAL_ORDER: MealType[] = ["breakfast", "lunch", "dinner"];

interface Props {
  /** Если план известен — выбор плана не показываем. */
  planId?: string;
  /** Если блюдо известно — выбор блюда не показываем. */
  recipe?: RecipeShort;
  /** Дни, доступные в плане (по умолчанию вся неделя). */
  days?: DayOfWeek[];
  onClose: () => void;
  onAdded: (plan: MealPlan) => void;
}

/** Окно «Добавить блюдо в план»: план, день, приём пищи, порции и блюдо. */
export default function AddMealSheet({ planId, recipe, days, onClose, onAdded }: Props) {
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [chosenPlan, setChosenPlan] = useState(planId ?? "");
  const [chosenRecipe, setChosenRecipe] = useState<RecipeShort | undefined>(recipe);
  const [day, setDay] = useState<DayOfWeek>(days?.[0] ?? "mon");
  const [mealType, setMealType] = useState<MealType>("dinner");
  const [servings, setServings] = useState(2);
  const [q, setQ] = useState("");
  const [found, setFound] = useState<RecipeShort[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (planId) return;
    api.listPlans().then((p) => {
      setPlans(p);
      if (p[0]) setChosenPlan(p[0].id);
    }).catch(() => undefined);
  }, [planId]);

  useEffect(() => {
    if (recipe) return;
    const t = setTimeout(() => {
      api.listRecipes({ q: q.trim() || undefined, limit: 8 }).then((r) => setFound(r.items)).catch(() => undefined);
    }, 250);
    return () => clearTimeout(t);
  }, [q, recipe]);

  const dayList = days && days.length > 0 ? DAY_ORDER.filter((d) => days.includes(d)) : DAY_ORDER;

  const submit = async () => {
    if (!chosenPlan || !chosenRecipe || busy) return;
    setBusy(true);
    setError(null);
    try {
      const plan = await api.addMeal(chosenPlan, {
        day,
        meal_type: mealType,
        recipe_id: Number(chosenRecipe.id),
        servings,
      });
      onAdded(plan);
    } catch (e) {
      setError(errorText(e, "Не получилось добавить блюдо"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet title="Добавить в план" onClose={onClose}>
      <div className="space-y-4">
        {!planId && (
          plans.length === 0 ? (
            <p className="text-muted">Сначала создайте план питания.</p>
          ) : (
            <div>
              <label className="label" htmlFor="am-plan">План</label>
              <select id="am-plan" className="input" value={chosenPlan} onChange={(e) => setChosenPlan(e.target.value)}>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title || `План №${p.id}`}
                  </option>
                ))}
              </select>
            </div>
          )
        )}

        {!recipe && (
          <div>
            <label className="label" htmlFor="am-q">Блюдо</label>
            <input id="am-q" className="input" placeholder="Поиск по названию" value={q} onChange={(e) => setQ(e.target.value)} />
            <div className="mt-2 max-h-48 space-y-2 overflow-y-auto">
              {found.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setChosenRecipe(r)}
                  className={`flex w-full items-center gap-3 rounded-[24px] border p-2 text-left ${chosenRecipe?.id === r.id ? "border-accent bg-accent-soft" : "border-line"}`}
                >
                  <DishArt recipeName={r.name} className="h-12 w-12 rounded-2xl" />
                  <span className="font-bold">{r.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {recipe && <p className="text-lg font-bold">{recipe.name}</p>}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="am-day">День</label>
            <select id="am-day" className="input" value={day} onChange={(e) => setDay(e.target.value as DayOfWeek)}>
              {dayList.map((d) => (
                <option key={d} value={d}>{DAY_LABELS[d]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="am-meal">Приём пищи</label>
            <select id="am-meal" className="input" value={mealType} onChange={(e) => setMealType(e.target.value as MealType)}>
              {MEAL_ORDER.map((m) => (
                <option key={m} value={m}>{MEAL_LABELS[m]}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="am-servings">Порций</label>
          <input id="am-servings" type="number" min={1} max={12} className="input" value={servings} onChange={(e) => setServings(Math.max(1, Math.min(12, Number(e.target.value) || 1)))} />
        </div>

        {error && <div className="alert alert-bad">{error}</div>}

        <button className="btn btn-primary w-full" disabled={busy || !chosenPlan || !chosenRecipe} onClick={submit}>
          {busy ? "Добавляем" : "Добавить"}
        </button>
      </div>
    </Sheet>
  );
}
