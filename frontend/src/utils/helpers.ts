import type { DayOfWeek } from '../types';

export const DAY_LABELS: Record<DayOfWeek, string> = {
  mon: 'Понедельник',
  tue: 'Вторник',
  wed: 'Среда',
  thu: 'Четверг',
  fri: 'Пятница',
  sat: 'Суббота',
  sun: 'Воскресенье',
};

export const DAY_SHORT: Record<DayOfWeek, string> = {
  mon: 'Пн',
  tue: 'Вт',
  wed: 'Ср',
  thu: 'Чт',
  fri: 'Пт',
  sat: 'Сб',
  sun: 'Вс',
};

export const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Завтрак',
  lunch: 'Обед',
  dinner: 'Ужин',
};

export const MEAL_EMOJIS: Record<string, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
};

export const formatPrice = (price: number): string => {
  return `${price.toLocaleString('ru-RU')} ₽`;
};

export const formatCalories = (calories: number): string => {
  return `${calories} ккал`;
};

export const getBudgetColor = (percent: number): string => {
  if (percent > 90) return 'text-red-500';
  if (percent > 70) return 'text-amber-500';
  return 'text-emerald-500';
};

export const getBudgetBarColor = (percent: number): string => {
  if (percent > 90) return 'bg-red-500';
  if (percent > 70) return 'bg-amber-500';
  return 'bg-emerald-500';
};
