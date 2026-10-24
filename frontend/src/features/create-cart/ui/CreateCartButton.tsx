import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { api } from "@/shared/api";
import type { CartResponse } from "@/shared/api";
import { Toast } from "@/shared/ui";
import CartModal from "./CartModal";

interface CreateCartButtonProps {
  planId: string;
}

/** Основная кнопка «Создать корзину»: сама ведёт запрос, показывает окно и ошибку. */
export default function CreateCartButton({ planId }: CreateCartButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<CartResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      setResponse(await api.createVkusvillCart(planId));
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

      {response && (
        <CartModal cartResponse={response} onClose={() => setResponse(null)} />
      )}
      {error && <Toast message={error} onHide={() => setError(null)} />}
    </>
  );
}
