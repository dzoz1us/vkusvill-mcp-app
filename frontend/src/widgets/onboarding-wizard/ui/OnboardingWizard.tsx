import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, animate, motion } from "motion/react";
import { ArrowLeft, Check, Minus, Plus } from "lucide-react";
import { FoodIcon } from "@/shared/ui";
import { formatPrice } from "@/shared/lib";
import { useMealPlanStore } from "@/entities/meal-plan";
import {
  usePlanPreferencesStore,
  DAYS,
  ALL_DAYS,
  WEEKDAYS,
  WEEKEND,
  PREFERENCES,
  DIETS,
  BUDGET_MAX,
  BUDGET_MIN,
  BUDGET_STEP,
  BUDGET_PRESETS,
} from "@/features/plan-preferences";
import KitchenScene from "./KitchenScene";

const PERSON_TONES = [
  "bg-accent-soft text-ink",
  "bg-sky-soft text-sky",
  "bg-berry-soft text-berry",
  "bg-tomato-soft text-tomato",
  "bg-mustard-soft text-ink",
];

const SPRING = { type: "spring", stiffness: 520, damping: 28 } as const;

function pluralPeople(n: number) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return "человек";
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return "человека";
  return "человек";
}

/** Плавно «докручивает» число до нового значения. */
function useAnimatedNumber(value: number) {
  const [shown, setShown] = useState(value);
  useEffect(() => {
    const controls = animate(shown, value, {
      duration: 0.35,
      ease: "easeOut",
      onUpdate: (v) => setShown(Math.round(v)),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return shown;
}

function CheckBadge({ on }: { on: boolean }) {
  return (
    <AnimatePresence>
      {on && (
        <motion.span
          initial={{ scale: 0, rotate: -40 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0 }}
          transition={SPRING}
          className="bg-accent-strong absolute top-2.5 right-2.5 flex h-6 w-6 items-center justify-center rounded-full text-white"
        >
          <Check className="h-4 w-4" strokeWidth={3.5} />
        </motion.span>
      )}
    </AnimatePresence>
  );
}

/* ---------- Шаги ---------- */

function StepShop() {
  return (
    <div className="space-y-3">
      <div
        role="radio"
        aria-checked="true"
        className="select-card relative min-h-[170px]"
      >
        <CheckBadge on />
        <span className="bg-accent-soft text-ink flex h-14 w-14 items-center justify-center rounded-[20px]">
          <FoodIcon name="shopping-cart" className="h-9 w-9" />
        </span>
        <span className="font-display text-ink text-[30px] leading-none font-bold">
          ВкусВилл
        </span>
      </div>
      <p className="text-muted text-center">Другие магазины добавим позже</p>
    </div>
  );
}

function StepPeople() {
  const { form, setFormField } = usePlanPreferencesStore();
  const n = form.people_count;
  const set = (v: number) =>
    setFormField("people_count", Math.min(10, Math.max(1, v)));

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex items-center gap-6">
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => set(n - 1)}
          disabled={n <= 1}
          aria-label="Меньше"
          className="border-line flex h-16 w-16 items-center justify-center rounded-full border-2 bg-white disabled:opacity-30"
        >
          <Minus className="h-7 w-7" />
        </motion.button>
        <div className="relative h-28 w-32 overflow-hidden text-center">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={n}
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -40, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="font-display absolute inset-0 flex items-center justify-center text-[88px] leading-none font-bold"
            >
              {n}
            </motion.span>
          </AnimatePresence>
        </div>
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => set(n + 1)}
          disabled={n >= 10}
          aria-label="Больше"
          className="border-line flex h-16 w-16 items-center justify-center rounded-full border-2 bg-white disabled:opacity-30"
        >
          <Plus className="h-7 w-7" />
        </motion.button>
      </div>

      <div className="flex min-h-[44px] flex-wrap justify-center gap-2">
        <AnimatePresence initial={false}>
          {Array.from({ length: n }).map((_, i) => {
            const tone = PERSON_TONES[i % PERSON_TONES.length];
            return (
              <motion.span
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={SPRING}
                className={`flex h-12 w-12 items-center justify-center rounded-full ${tone}`}
              >
                <FoodIcon name="busts-in-silhouette" className="h-7 w-7" />
              </motion.span>
            );
          })}
        </AnimatePresence>
      </div>
      <p className="text-muted -mt-4">{pluralPeople(n)}</p>
    </div>
  );
}

function StepDays() {
  const { form, setFormField, toggleListItem } = usePlanPreferencesStore();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-center gap-3">
        {DAYS.map((day) => {
          const on = form.days.includes(day.value);
          const weekend = day.value === "sat" || day.value === "sun";
          return (
            <motion.button
              key={day.value}
              whileTap={{ scale: 0.94 }}
              onClick={() => toggleListItem("days", day.value)}
              role="checkbox"
              aria-checked={on}
              aria-label={day.full}
              className="select-card min-h-[104px] w-[calc((100%-36px)/4)]"
            >
              <span
                className={`font-display text-[26px] leading-none font-bold ${
                  weekend && !on ? "text-tomato" : ""
                }`}
              >
                {day.short}
              </span>
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
                  on ? "bg-accent-strong border-accent-strong text-white" : "border-line"
                }`}
              >
                {on && <Check className="h-4 w-4" strokeWidth={3.5} />}
              </span>
            </motion.button>
          );
        })}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <button className="chip" onClick={() => setFormField("days", WEEKDAYS)}>
          Будни
        </button>
        <button className="chip" onClick={() => setFormField("days", WEEKEND)}>
          Выходные
        </button>
        <button className="chip" onClick={() => setFormField("days", ALL_DAYS)}>
          Вся неделя
        </button>
      </div>
    </div>
  );
}

function StepBudget() {
  const { form, setFormField } = usePlanPreferencesStore();
  const min = BUDGET_MIN;
  const budget = Math.min(BUDGET_MAX, Math.max(min, form.budget));
  const shown = useAnimatedNumber(budget);
  const fill = ((budget - min) / (BUDGET_MAX - min)) * 100;
  const perDay =
    form.days.length > 0
      ? Math.round(budget / form.people_count / form.days.length)
      : null;

  // Бюджет не может быть меньше минимума
  useEffect(() => {
    if (form.budget !== budget) setFormField("budget", budget);
  }, [form.budget, budget, setFormField]);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="font-display text-[56px] leading-none font-bold">
          {formatPrice(shown)}
        </div>
        <p className="text-muted mt-3">
          {perDay ? `≈ ${formatPrice(perDay)} на человека в день` : "на неделю"}
        </p>
      </div>
      <div>
        <input
          type="range"
          className="slider"
          min={min}
          max={BUDGET_MAX}
          step={BUDGET_STEP}
          value={budget}
          style={{ ["--fill" as string]: `${fill}%` }}
          onChange={(e) => setFormField("budget", Number(e.target.value))}
          aria-label="Бюджет на неделю"
        />
        <div className="text-muted flex justify-between text-sm">
          <span>от {formatPrice(min)}</span>
          <span>{formatPrice(BUDGET_MAX)}</span>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {BUDGET_PRESETS.filter((a) => a >= min).map((amount) => (
          <button
            key={amount}
            onClick={() => setFormField("budget", amount)}
            aria-pressed={budget === amount}
            className={`chip ${budget === amount ? "chip-active" : ""}`}
          >
            {formatPrice(amount)}
          </button>
        ))}
      </div>
    </div>
  );
}

function StepPrefs() {
  const { form, toggleListItem } = usePlanPreferencesStore();
  return (
    <div className="grid grid-cols-2 gap-3">
      {PREFERENCES.map(({ value, label, icon }, i) => {
        const on = form.preferences.includes(value);
        return (
          <motion.button
            key={value}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.25 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => toggleListItem("preferences", value)}
            aria-pressed={on}
            className="select-card"
          >
            <CheckBadge on={on} />
            <FoodIcon name={icon} className="h-9 w-9" />
            {label}
          </motion.button>
        );
      })}
    </div>
  );
}

function StepDiet() {
  const { form, setFormField } = usePlanPreferencesStore();
  return (
    <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Диета">
      {DIETS.map(({ value, label, emoji, glyph }, i) => {
        const on = form.diet === value;
        return (
          <motion.button
            key={value}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.25 }}
            whileTap={{ scale: 0.96 }}
            role="radio"
            aria-checked={on}
            onClick={() => setFormField("diet", value)}
            className="select-card min-h-[132px]"
          >
            <CheckBadge on={on} />
            {emoji ? (
              <FoodIcon name={emoji} className="h-10 w-10" />
            ) : (
              <FoodIcon name={glyph!} className="h-10 w-10" />
            )}
            <span className="text-base leading-tight">{label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

function StepAppliances() {
  const { form, toggleListItem } = usePlanPreferencesStore();
  return (
    <KitchenScene
      selected={form.appliances}
      onToggle={(v) => toggleListItem("appliances", v)}
    />
  );
}

/* ---------- Каркас мастера ---------- */

interface StepDef {
  key: string;
  title: string;
  sub?: string;
  ok: boolean;
  node: ReactNode;
}

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const resetPlan = useMealPlanStore((s) => s.resetPlan);
  const form = usePlanPreferencesStore((s) => s.form);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);

  const steps: StepDef[] = useMemo(
    () => [
      { key: "shop", title: "Выберите магазин", ok: true, node: <StepShop /> },
      { key: "people", title: "Сколько вас?", ok: form.people_count >= 1, node: <StepPeople /> },
      { key: "days", title: "В какие дни готовите?", ok: form.days.length > 0, node: <StepDays /> },
      { key: "budget", title: "Бюджет на неделю", ok: form.budget >= BUDGET_MIN, node: <StepBudget /> },
      { key: "prefs", title: "Что любите?", sub: "Можно пропустить", ok: true, node: <StepPrefs /> },
      { key: "diet", title: "Есть ограничения?", ok: true, node: <StepDiet /> },
      { key: "kitchen", title: "Что есть на кухне?", sub: "Отметьте хотя бы одно", ok: form.appliances.length > 0, node: <StepAppliances /> },
    ],
    [form.people_count, form.days.length, form.budget, form.appliances.length],
  );

  const current = steps[step];
  const isLast = step === steps.length - 1;

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);

  const next = () => {
    if (!current.ok) return;
    if (isLast) {
      resetPlan();
      navigate("/generating");
      return;
    }
    setDir(1);
    setStep((s) => s + 1);
  };

  const back = () => {
    if (step === 0) {
      navigate("/");
      return;
    }
    setDir(-1);
    setStep((s) => s - 1);
  };

  return (
    <div className="wizard">
      <div className="wizard-bar">
        <button onClick={back} className="icon-btn" aria-label="Назад" title="Назад">
          <ArrowLeft />
        </button>
        <div
          className="track"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={steps.length}
          aria-valuenow={step + 1}
          aria-label="Прогресс"
        >
          <motion.div
            className="track-fill"
            initial={false}
            animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
            transition={{ type: "spring", stiffness: 160, damping: 22 }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait" custom={dir} initial={false}>
        <motion.section
          key={current.key}
          custom={dir}
          initial={{ opacity: 0, x: dir * 36 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: dir * -36 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="flex flex-1 flex-col pt-8"
        >
          <h1 className="heading">{current.title}</h1>
          {current.sub && <p className="subheading">{current.sub}</p>}
          <div className="flex flex-1 flex-col justify-center py-8">
            {current.node}
          </div>
        </motion.section>
      </AnimatePresence>

      <div className="wizard-cta">
        <button onClick={next} disabled={!current.ok} className="btn btn-primary w-full">
          {isLast ? "Составить меню" : "Далее"}
        </button>
      </div>
    </div>
  );
}
