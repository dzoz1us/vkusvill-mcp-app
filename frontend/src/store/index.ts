import { create } from "zustand";
import type {
  MealPlan,
  GroceryList,
  CartResponse,
  NetworkState,
  OnboardingParams,
  DayOfWeek,
  PreferenceTag,
  DietType,
  ApplianceType,
} from "../types";
import { api } from "../api/client";

interface AppState {
  // Onboarding form state
  form: {
    people_count: number;
    days: DayOfWeek[];
    budget: number;
    preferences: PreferenceTag[];
    diet: DietType;
    appliances: ApplianceType[];
  };
  setFormField: <K extends keyof OnboardingParams>(
    key: K,
    value: OnboardingParams[K],
  ) => void;
  resetForm: () => void;

  // Meal plan state
  currentPlan: MealPlan | null;
  planState: NetworkState;
  planError: string | null;

  // Grocery list state
  groceryList: GroceryList | null;
  groceryState: NetworkState;

  // Cart state
  cartResponse: CartResponse | null;
  cartState: NetworkState;
  cartError: string | null;

  // Replace meal state
  replacingMealId: string | null;
  replaceState: NetworkState;
  replaceError: string | null;

  // Actions
  generatePlan: () => Promise<void>;
  loadPlan: (id: string) => Promise<void>;
  replaceMeal: (planId: string, mealId: string) => Promise<void>;
  loadGroceryList: (planId: string) => Promise<void>;
  toggleBought: (itemId: string, isBought: boolean) => Promise<void>;
  createCart: (planId: string) => Promise<void>;
  refreshPrices: (
    planId: string,
  ) => Promise<{ cost_changed: boolean; new_cost: number }>;
  clearCart: () => void;
}

const defaultForm = {
  people_count: 2,
  days: [] as DayOfWeek[],
  budget: 3000,
  preferences: [] as PreferenceTag[],
  diet: "none" as DietType,
  appliances: [] as ApplianceType[],
};

export const useAppStore = create<AppState>((set, get) => ({
  // Initial form state
  form: { ...defaultForm },
  setFormField: (key, value) =>
    set((state) => ({
      form: { ...state.form, [key]: value },
    })),
  resetForm: () =>
    set({
      form: { ...defaultForm, days: [], preferences: [], appliances: [] },
    }),

  // Initial states
  currentPlan: null,
  planState: "idle",
  planError: null,
  groceryList: null,
  groceryState: "idle",
  cartResponse: null,
  cartState: "idle",
  cartError: null,
  replacingMealId: null,
  replaceState: "idle",
  replaceError: null,

  // Generate plan
  generatePlan: async () => {
    set({ planState: "loading", planError: null });
    try {
      const { form } = get();
      const plan = await api.generateMealPlan({
        people_count: form.people_count,
        days: form.days,
        budget: form.budget,
        preferences: form.preferences,
        diet: form.diet,
        appliances: form.appliances,
      });
      localStorage.setItem(`meal-plan-${plan.id}`, JSON.stringify(plan));
      set({ currentPlan: plan, planState: "success" });
    } catch (err) {
      set({
        planState: "error",
        planError: "Не удалось создать план питания. Попробуйте ещё раз.",
      });
    }
  },

  // Load plan
  loadPlan: async (id: string) => {
    set({ planState: "loading", planError: null });
    try {
      const plan = await api.getMealPlan(id);
      set({ currentPlan: plan, planState: "success" });
    } catch (err) {
      set({ planState: "error", planError: "План питания не найден." });
    }
  },

  // Replace meal
  replaceMeal: async (planId: string, mealId: string) => {
    set({
      replaceState: "loading",
      replacingMealId: mealId,
      replaceError: null,
    });
    try {
      const result = await api.replaceMeal(planId, mealId);
      localStorage.setItem(`meal-plan-${planId}`, JSON.stringify(result.plan));
      set({
        currentPlan: result.plan,
        replaceState: "success",
        replacingMealId: null,
      });
    } catch (err) {
      set({
        replaceState: "error",
        replaceError: "Не удалось заменить блюдо. Попробуйте ещё раз.",
        replacingMealId: null,
      });
      throw err;
    }
  },

  // Load grocery list
  loadGroceryList: async (planId: string) => {
    set({ groceryState: "loading" });
    try {
      const list = await api.getGroceryList(planId);
      set({ groceryList: list, groceryState: "success" });
    } catch (err) {
      set({ groceryState: "error" });
    }
  },

  // Toggle bought status
  toggleBought: async (itemId: string, isBought: boolean) => {
    try {
      await api.updateGroceryItem(itemId, isBought);
      set((state) => {
        if (!state.groceryList) return state;
        const items = state.groceryList.items.map((item) =>
          item.id === itemId ? { ...item, is_bought: isBought } : item,
        );
        return { groceryList: { ...state.groceryList, items } };
      });
    } catch (err) {
      // Revert on error - could add toast notification
    }
  },

  // Create cart
  createCart: async (planId: string) => {
    set({ cartState: "loading", cartError: null });
    try {
      const response = await api.createVkusvillCart(planId);
      set({ cartResponse: response, cartState: "success" });
    } catch (err) {
      set({
        cartState: "error",
        cartError: "Не удалось создать корзину. Попробуйте позже.",
      });
      throw err;
    }
  },

  // Refresh prices
  refreshPrices: async (planId: string) => {
    return await api.refreshPrices(planId);
  },

  // Clear cart
  clearCart: () =>
    set({ cartResponse: null, cartState: "idle", cartError: null }),
}));
