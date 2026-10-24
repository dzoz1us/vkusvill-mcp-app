import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { api } from "@/shared/api";
import { Toast } from "@/shared/ui";

interface CreateCartButtonProps {
  planId: string;
}

/** Основная кнопка «Создать корзину»: сама ведёт запрос, показывает окно и ошибку. */
export default function CreateCartButton({ planId }: CreateCartButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.createVkusvillCart(planId);
      const url = res.carts[0]?.cart_url;
      if (!url) throw new Error("empty cart");
      window.location.href = url;
    } catch {
      setError("Не удалось создать корзину");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleCreate}
        disabled={isLoading}
        className="btn btn-primary w-full"
      >
        {isLoading && <RefreshCw className="h-5 w-5 animate-spin" />}
        {isLoading ? "Создаём" : "Создать корзину"}
      </button>
      {error && <Toast message={error} onHide={() => setError(null)} />}
    </>
  );
}
