import type { DayMeal, DayOfWeek } from "@/shared/api";
import { DAY_LABELS } from "@/shared/lib";
import { MealCard } from "@/entities/meal";
import { MealActions } from "@/features/edit-meal";

const DAY_ORDER: DayOfWeek[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const MEAL_ORDER = ["breakfast", "lunch", "dinner"];

interface MealPlanDaysProps {
  planId: string;
  meals: DayMeal[];
}

export default function MealPlanDays({ planId, meals }: MealPlanDaysProps) {
  const byDay = new Map<DayOfWeek, DayMeal[]>();
  for (const m of meals) byDay.set(m.day, [...(byDay.get(m.day) ?? []), m]);

  return (
    <div className="space-y-6">
      {DAY_ORDER.filter((d) => byDay.has(d)).map((day) => (
        <section key={day} className="space-y-3">
          <h2 className="block-title">{DAY_LABELS[day]}</h2>
          <div className="grid gap-3">
            {byDay
              .get(day)!
              .sort((a, b) => MEAL_ORDER.indexOf(a.meal_type) - MEAL_ORDER.indexOf(b.meal_type))
              .map((meal) => (
                <MealCard key={meal.id} meal={meal} actions={<MealActions planId={planId} meal={meal} />} />
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
