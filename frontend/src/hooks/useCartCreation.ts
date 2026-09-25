import { useState } from 'react';
import { useAppStore } from '../store';

export function useCartCreation(planId: string | undefined) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [priceWarning, setPriceWarning] = useState(false);
  const { createCart, refreshPrices } = useAppStore();

  const handleCreateCart = async () => {
    if (!planId || isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Опционально обновляем цены перед созданием корзины
      try {
        const result = await refreshPrices(planId);
        if (result.cost_changed) {
          setPriceWarning(true);
        }
      } catch {
        // Продолжаем даже если обновление цен не удалось
      }
      
      await createCart(planId);
    } catch (err) {
      setError('Не удалось создать корзину. Попробуйте позже.');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    priceWarning,
    handleCreateCart,
  };
}
