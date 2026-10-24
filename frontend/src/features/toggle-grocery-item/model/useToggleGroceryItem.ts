import { api } from "@/shared/api";
import { useGroceryStore } from "@/entities/grocery-item";

export function useToggleGroceryItem() {
  const setBought = useGroceryStore((s) => s.setBought);

  return async (itemId: string, isBought: boolean) => {
    setBought(itemId, isBought);
    try {
      await api.updateGroceryItem(itemId, { is_bought: isBought });
    } catch {
      setBought(itemId, !isBought);
    }
  };
}
