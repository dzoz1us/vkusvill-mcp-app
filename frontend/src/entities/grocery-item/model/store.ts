import { create } from "zustand";
import { api } from "@/shared/api";
import type { GroceryList, NetworkState } from "@/shared/api";

interface GroceryState {
  groceryList: GroceryList | null;
  groceryState: NetworkState;

  loadGroceryList: (planId: string) => Promise<void>;
  setBought: (itemId: string, isBought: boolean) => void;
}

export const useGroceryStore = create<GroceryState>((set) => ({
  groceryList: null,
  groceryState: "idle",

  loadGroceryList: async (planId) => {
    set({ groceryState: "loading" });
    try {
      const list = await api.getGroceryList(planId);
      set({ groceryList: list, groceryState: "success" });
    } catch {
      set({ groceryState: "error" });
    }
  },

  setBought: (itemId, isBought) =>
    set((state) => {
      if (!state.groceryList) return state;
      const items = state.groceryList.items.map((item) =>
        item.id === itemId ? { ...item, is_bought: isBought } : item,
      );
      return { groceryList: { ...state.groceryList, items } };
    }),
}));
