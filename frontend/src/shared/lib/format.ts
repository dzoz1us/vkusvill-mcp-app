import type { DayOfWeek } from "../api";

export const DAY_LABELS: Record<DayOfWeek, string> = {
  mon: "Понедельник",
  tue: "Вторник",
  wed: "Среда",
  thu: "Четверг",
  fri: "Пятница",
  sat: "Суббота",
  sun: "Воскресенье",
};

export const DAY_SHORT: Record<DayOfWeek, string> = {
  mon: "Пн",
  tue: "Вт",
  wed: "Ср",
  thu: "Чт",
  fri: "Пт",
  sat: "Сб",
  sun: "Вс",
};

export const MEAL_LABELS: Record<string, string> = {
  breakfast: "Завтрак",
  lunch: "Обед",
  dinner: "Ужин",
};

export const formatPrice = (price: number): string => {
  return `${price.toLocaleString("ru-RU")} ₽`;
};

export const formatCalories = (calories: number): string => {
  return `${calories} ккал`;
};

export const getBudgetColor = (percent: number): string => {
  if (percent > 100) return "text-danger";
  if (percent > 85) return "text-ink";
  return "text-ink";
};

export const getBudgetBarColor = (percent: number): string => {
  if (percent > 100) return "bg-danger";
  if (percent > 85) return "bg-mustard";
  return "bg-accent";
};

export const APP_NAME = "Менюшка";

/** Дата из секунд (Instant бэкенда) в вид «3 октября, 14:20». */
export const formatDate = (seconds: number | string): string => {
  const d = typeof seconds === "number" ? new Date(seconds * 1000) : new Date(seconds);
  return d.toLocaleString("ru-RU", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
};

export const errorText = (e: unknown, fallback: string): string =>
  e instanceof Error && e.message && !e.message.startsWith("HTTP ") ? e.message : fallback;

const UNIT_LABELS: Record<string, string> = { g: "г", ml: "мл", pcs: "шт", kg: "кг", l: "л" };
export const unitLabel = (u: string | null | undefined): string => (u ? (UNIT_LABELS[u] ?? u) : "");
