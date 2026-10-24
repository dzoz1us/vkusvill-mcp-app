import { api } from "@/shared/api";
import { useGroceryStore } from "@/entities/grocery-item";

export function useToggleGroceryItem() {
  const setBought = useGroceryStore((s) => s.setBought);

  return async (itemId: string, isBought: boolean) => {
    try {
      await api.updateGroceryItem(itemId, isBought);
      setBought(itemId, isBought);
    } catch {
      // Состояние не меняем: галочка остаётся прежней.
    }
  };
}
