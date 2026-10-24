import type { FoodIconName, IconName } from "@/shared/ui";
import type { DayOfWeek, DietType, PreferenceTag } from "@/shared/api";

export const DAYS: { value: DayOfWeek; short: string; full: string }[] = [
  { value: "mon", short: "Пн", full: "Понедельник" },
  { value: "tue", short: "Вт", full: "Вторник" },
  { value: "wed", short: "Ср", full: "Среда" },
  { value: "thu", short: "Чт", full: "Четверг" },
  { value: "fri", short: "Пт", full: "Пятница" },
  { value: "sat", short: "Сб", full: "Суббота" },
  { value: "sun", short: "Вс", full: "Воскресенье" },
];

export const ALL_DAYS: DayOfWeek[] = DAYS.map((d) => d.value);
export const WEEKDAYS: DayOfWeek[] = ["mon", "tue", "wed", "thu", "fri"];
export const WEEKEND: DayOfWeek[] = ["sat", "sun"];

export const PREFERENCES: {
  value: PreferenceTag;
  label: string;
  icon: IconName;
  tone: string;
}[] = [
  { value: "quick", label: "Быстро", icon: "lightning", tone: "text-[#d99a00]" },
  { value: "low_calorie", label: "Лёгкое", icon: "leaf", tone: "text-accent-ink" },
  { value: "family", label: "Семейное", icon: "users-three", tone: "text-sky" },
  { value: "healthy", label: "Здоровое", icon: "heart", tone: "text-berry" },
  { value: "high_protein", label: "Белок", icon: "barbell", tone: "text-tomato" },
  { value: "budget", label: "Бюджетное", icon: "coins", tone: "text-[#d99a00]" },
  { value: "hearty", label: "Сытное", icon: "hamburger", tone: "text-tomato" },
];

export const DIETS: {
  value: DietType;
  label: string;
  emoji?: FoodIconName;
  glyph?: IconName;
}[] = [
  { value: "none", label: "Без ограничений", glyph: "fork-knife" },
  { value: "vegetarian", label: "Вегетарианство", emoji: "carrot" },
  { value: "vegan", label: "Веганство", emoji: "leafy-green" },
  { value: "pescatarian", label: "Пескетарианство", emoji: "fish" },
];

export const BUDGET_MIN = 1000;
export const BUDGET_MAX = 20000;
export const BUDGET_STEP = 500;
export const BUDGET_PRESETS = [3000, 5000, 8000, 12000];

/** Самый скромный бюджет, в который меню гарантированно укладывается (≈150 ₽ на человека в день). */
export const minBudgetFor = (people: number, days: number): number =>
  Math.max(
    BUDGET_MIN,
    Math.ceil((people * Math.max(1, days) * 150) / BUDGET_STEP) * BUDGET_STEP,
  );
