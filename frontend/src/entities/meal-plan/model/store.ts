import { create } from "zustand";
import { api } from "@/shared/api";
import type { MealPlan, NetworkState, OnboardingParams } from "@/shared/api";

interface MealPlanState {
  currentPlan: MealPlan | null;
  planState: NetworkState;
  planError: string | null;

  generatePlan: (params: OnboardingParams) => Promise<void>;
  loadPlan: (id: string) => Promise<void>;
  setPlan: (plan: MealPlan) => void;
  resetPlan: () => void;
}

export const useMealPlanStore = create<MealPlanState>((set) => ({
  currentPlan: null,
  planState: "idle",
  planError: null,

  generatePlan: async (params) => {
    set({ planState: "loading", planError: null });
    try {
      const plan = await api.generateMealPlan(params);
      localStorage.setItem(`meal-plan-${plan.id}`, JSON.stringify(plan));
      set({ currentPlan: plan, planState: "success" });
    } catch {
      set({
        planState: "error",
        planError: "Не удалось создать план. Попробуйте ещё раз.",
      });
    }
  },

  loadPlan: async (id) => {
    set({ planState: "loading", planError: null });
    try {
      const plan = await api.getMealPlan(id);
      set({ currentPlan: plan, planState: "success" });
    } catch {
      set({ planState: "error", planError: "План не найден." });
    }
  },

  setPlan: (plan) => {
    localStorage.setItem(`meal-plan-${plan.id}`, JSON.stringify(plan));
    set({ currentPlan: plan });
  },

  resetPlan: () =>
    set({ planState: "idle", currentPlan: null, planError: null }),
}));
