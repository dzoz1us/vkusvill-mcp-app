import { useAppStore } from '../store';

export function useGroceryToggle() {
  const { toggleBought } = useAppStore();

  const handleToggle = async (itemId: string, isBought: boolean) => {
    await toggleBought(itemId, isBought);
  };

  return {
    handleToggle,
  };
}
