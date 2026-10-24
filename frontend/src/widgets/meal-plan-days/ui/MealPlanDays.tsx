import type { DayMeal, DayOfWeek } from "@/shared/api";
import { DAY_LABELS } from "@/shared/lib";
import { MealCard } from "@/entities/meal";
import { ReplaceMealButton } from "@/features/replace-meal";

interface MealPlanDaysProps {
  planId: string;
  meals: DayMeal[];
}

export default function MealPlanDays({ planId, meals }: MealPlanDaysProps) {
  const mealsByDay = meals.reduce(
    (acc, meal) => {
      (acc[meal.day] ??= []).push(meal);
      return acc;
    },
    {} as Record<string, DayMeal[]>,
  );

  return (
    <div className="space-y-6">
      {Object.entries(mealsByDay).map(([day, dayMeals]) => (
        <section key={day} className="space-y-3">
          <h2 className="block-title">{DAY_LABELS[day as DayOfWeek]}</h2>
          <div className="grid gap-3">
            {dayMeals.map((meal) => (
              <MealCard
                key={meal.id}
                meal={meal}
                actions={<ReplaceMealButton planId={planId} mealId={meal.id} />}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
