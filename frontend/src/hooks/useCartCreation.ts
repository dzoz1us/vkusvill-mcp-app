import { useState } from "react";
import { useAppStore } from "../store";

export function useCartCreation(planId: string | undefined) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { createCart } = useAppStore();

  const handleCreateCart = async () => {
    if (!planId || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      await createCart(planId);
    } catch (err) {
      setError("Не удалось создать корзину. Попробуйте позже.");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    handleCreateCart,
  };
}
