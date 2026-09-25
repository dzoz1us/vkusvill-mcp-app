import { useState } from 'react';
import { useAppStore } from '../store';

export function useReplaceMeal(planId: string | undefined) {
  const [replacingMealId, setReplacingMealId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { replaceMeal } = useAppStore();

  const handleReplace = async (mealId: string) => {
    if (!planId || replacingMealId) return;
    
    setReplacingMealId(mealId);
    setError(null);
    
    try {
      await replaceMeal(planId, mealId);
    } catch (err) {
      setError('Не удалось заменить блюдо. Попробуйте ещё раз.');
    } finally {
      setReplacingMealId(null);
    }
  };

  return {
    replacingMealId,
    error,
    handleReplace,
  };
}
