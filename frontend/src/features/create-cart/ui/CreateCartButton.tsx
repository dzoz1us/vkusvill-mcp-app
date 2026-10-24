import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { api } from "@/shared/api";
import { errorText } from "@/shared/lib";
import { Toast } from "@/shared/ui";

/** «Перейти во ВкусВилл»: собирает одну корзину, сохраняет заказ в истории и сразу открывает ВкусВилл. */
export default function CreateCartButton({ planId }: { planId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const order = await api.createOrder(planId);
      if (!order.cart_url) throw new Error("В корзину ничего не попало");
      window.location.href = order.cart_url;
    } catch (e) {
      setError(errorText(e, "Не удалось собрать корзину"));
      setIsLoading(false);
    }
  };

  return (
    <>
      <button onClick={handleCreate} disabled={isLoading} className="btn btn-primary w-full">
        {isLoading && <RefreshCw className="h-5 w-5 animate-spin" />}
        {isLoading ? "Собираем корзину" : "Перейти во ВкусВилл"}
      </button>
      {error && <Toast message={error} onHide={() => setError(null)} />}
    </>
  );
}
