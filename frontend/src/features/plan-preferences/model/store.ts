import { create } from "zustand";
import type { OnboardingParams } from "@/shared/api";

const createDefaultForm = (): OnboardingParams => ({
  people_count: 2,
  days: [],
  budget: 3000,
  preferences: [],
  diet: "none",
  appliances: [],
});

interface PlanPreferencesState {
  form: OnboardingParams;
  setFormField: <K extends keyof OnboardingParams>(
    key: K,
    value: OnboardingParams[K],
  ) => void;
  toggleListItem: <
    K extends "days" | "preferences" | "appliances",
  >(
    key: K,
    value: OnboardingParams[K][number],
  ) => void;
  resetForm: () => void;
}

export const usePlanPreferencesStore = create<PlanPreferencesState>((set) => ({
  form: createDefaultForm(),

  setFormField: (key, value) =>
    set((state) => ({ form: { ...state.form, [key]: value } })),

  toggleListItem: (key, value) =>
    set((state) => {
      const list = state.form[key] as string[];
      const next = list.includes(value as string)
        ? list.filter((v) => v !== value)
        : [...list, value as string];
      return { form: { ...state.form, [key]: next } };
    }),

  resetForm: () => set({ form: createDefaultForm() }),
}));
