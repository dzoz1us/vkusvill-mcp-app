import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Check } from "lucide-react";
import { FoodIcon, StateCard } from "@/shared/ui";
import type { FoodIconName } from "@/shared/ui";
import { useMealPlanStore } from "@/entities/meal-plan";
import { usePlanPreferencesStore } from "@/features/plan-preferences";

const ORBIT: FoodIconName[] = [
  "avocado",
  "tomato",
  "hot-pepper",
  "leafy-green",
  "eggplant",
  "garlic",
  "ear-of-corn",
  "cucumber",
  "lemon",
  "carrot",
];

const TASKS = [
  "Подбираем блюда под бюджет",
  "Расставляем меню по дням",
  "Собираем список покупок",
];

export default function GeneratingPage() {
  const navigate = useNavigate();
  const { currentPlan, planState, planError, generatePlan } =
    useMealPlanStore();
  const form = usePlanPreferencesStore((s) => s.form);
  const generationStarted = useRef(false);
  const [progress, setProgress] = useState(4);

  useEffect(() => {
    if (planState !== "idle" || generationStarted.current) return;
    generationStarted.current = true;
    void generatePlan(form);
  }, [generatePlan, planState, form]);

  // Прогресс подползает к 92%, а по готовности плана доходит до 100
  useEffect(() => {
    if (planState === "success") {
      setProgress(100);
      return;
    }
    const timer = setInterval(
      () => setProgress((p) => (p < 92 ? p + (92 - p) * 0.06 : p)),
      120,
    );
    return () => clearInterval(timer);
  }, [planState]);

  useEffect(() => {
    if (planState === "success" && currentPlan) {
      const timer = setTimeout(() => {
        navigate(`/plan/${currentPlan.id}`, { replace: true });
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [planState, currentPlan, navigate]);

  if (planState === "error") {
    return (
      <StateCard
        icon={<FoodIcon name="confused-face" className="h-12 w-12" />}
        title="Не получилось"
        text={planError ?? undefined}
        action={
          <button onClick={() => navigate("/start")} className="btn btn-primary w-full">
            Повторить
          </button>
        }
      />
    );
  }

  const doneCount = progress >= 100 ? 3 : Math.floor(progress / 31);

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col px-5 pt-[calc(2.5rem+env(safe-area-inset-top))] pb-8">
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="heading"
      >
        Собираем вашу неделю…
      </motion.h1>

      {/* Орбита из продуктов */}
      <div className="relative mx-auto my-auto aspect-square w-full max-w-[340px]">
        <div className="animate-orbit absolute inset-0">
          {ORBIT.map((name, i) => {
            const angle = (i / ORBIT.length) * 360;
            return (
              <div
                key={name}
                className="absolute top-1/2 left-1/2 h-0 w-0"
                style={{ transform: `rotate(${angle}deg) translateY(-138px)` }}
              >
                {/* контр-вращение держит иконку «вертикально» */}
                <div
                  className="animate-orbit-reverse -mt-6 -ml-6 h-12 w-12"
                  style={{ animationDelay: `${-(angle / 360) * 14}s` }}
                >
                  <FoodIcon name={name} className="h-full w-full drop-shadow" />
                </div>
              </div>
            );
          })}
        </div>
        <div className="absolute inset-[22%] flex flex-col items-center justify-center rounded-full bg-accent-soft">
          <span className="font-display text-[44px] leading-none font-bold">
            {Math.round(progress)}
            <span className="text-2xl">%</span>
          </span>
        </div>
      </div>

      <div className="card space-y-4 p-6 shadow-[0_20px_40px_-24px_rgba(22,26,16,0.35)]">
        {TASKS.map((task, i) => {
          const done = i < doneCount;
          const active = i === doneCount;
          return (
            <div key={task} className="flex items-center gap-4">
              <span
                className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-300 ${
                  done ? "bg-accent-strong border-accent-strong text-white" : "border-line"
                }`}
              >
                {done && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 18 }}>
                    <Check className="h-4 w-4" strokeWidth={3.5} />
                  </motion.span>
                )}
                {active && (
                  <span className="border-accent-dark h-3.5 w-3.5 animate-spin rounded-full border-2 border-t-transparent" />
                )}
              </span>
              <span className={`text-lg font-semibold transition-colors ${done || active ? "" : "text-muted"}`}>
                {task}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
