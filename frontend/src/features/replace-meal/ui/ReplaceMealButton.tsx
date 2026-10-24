import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { api } from "@/shared/api";
import { Toast } from "@/shared/ui";
import { useMealPlanStore } from "@/entities/meal-plan";

interface ReplaceMealButtonProps {
  planId: string;
  mealId: string;
}

export default function ReplaceMealButton({
  planId,
  mealId,
}: ReplaceMealButtonProps) {
  const setPlan = useMealPlanStore((s) => s.setPlan);
  const [isReplacing, setIsReplacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReplace = async () => {
    if (isReplacing) return;
    setIsReplacing(true);
    setError(null);
    try {
      const result = await api.replaceMeal(planId, mealId);
      setPlan(result.plan);
    } catch (e) {
      setError(
        e instanceof Error && e.message.includes("budget")
          ? "Замена не укладывается в бюджет"
          : "Не удалось заменить блюдо",
      );
    } finally {
      setIsReplacing(false);
    }
  };

  return (
    <>
      <button
        onClick={handleReplace}
        disabled={isReplacing}
        className="icon-btn"
        aria-label="Заменить блюдо"
        title="Заменить блюдо"
      >
        <RefreshCw className={isReplacing ? "animate-spin" : ""} />
      </button>
      {error && <Toast message={error} onHide={() => setError(null)} />}
    </>
  );
}
