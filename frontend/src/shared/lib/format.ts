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
  if (percent > 85) return "text-[#b07400]";
  return "text-accent-ink";
};

export const getBudgetBarColor = (percent: number): string => {
  if (percent > 100) return "bg-danger";
  if (percent > 85) return "bg-mustard";
  return "bg-accent";
};
