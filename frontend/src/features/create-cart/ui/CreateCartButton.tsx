import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { api } from "@/shared/api";
import { errorText } from "@/shared/lib";
import { Toast } from "@/shared/ui";

/** «Собрать корзину»: создаёт заказ и открывает корзину приложения со списком продуктов. */
export default function CreateCartButton({ planId }: { planId: string }) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const order = await api.createOrder(planId);
      if (!order.cart_url) throw new Error("В корзину ничего не попало");
      navigate(`/cart/${order.id}`);
    } catch (e) {
      setError(errorText(e, "Не удалось собрать корзину"));
      setIsLoading(false);
    }
  };

  return (
    <>
      <button onClick={handleCreate} disabled={isLoading} className="btn btn-primary w-full sm:w-auto sm:min-w-[260px]">
        {isLoading && <RefreshCw className="h-5 w-5 animate-spin" />}
        {isLoading ? "Собираем" : "Собрать корзину"}
      </button>
      {error && <Toast message={error} onHide={() => setError(null)} />}
    </>
  );
}
