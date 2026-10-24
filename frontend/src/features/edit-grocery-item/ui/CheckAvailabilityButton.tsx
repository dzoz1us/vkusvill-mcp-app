import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { api } from "@/shared/api";
import { errorText } from "@/shared/lib";
import { Toast } from "@/shared/ui";
import { useGroceryStore } from "@/entities/grocery-item";

/** Проверяет наличие и актуальные цены во ВкусВилл; недоступные товары заменяются автоматически. */
export default function CheckAvailabilityButton({ planId }: { planId: string }) {
  const refresh = useGroceryStore((s) => s.refresh);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ text: string; kind: "ok" | "bad" } | null>(null);

  const check = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const r = await api.checkAvailability(planId);
      await refresh(planId);
      const parts: string[] = [];
      if (r.price_changed) parts.push(`цен изменилось: ${r.price_changed}`);
      if (r.replaced) parts.push(`заменено: ${r.replaced}`);
      if (r.unavailable) parts.push(`нет в наличии: ${r.unavailable}`);
      setToast({
        text: parts.length ? `Проверено ${r.checked}, ${parts.join(", ")}` : `Всё в наличии (${r.checked})`,
        kind: r.unavailable ? "bad" : "ok",
      });
    } catch (e) {
      setToast({ text: errorText(e, "Не удалось проверить наличие"), kind: "bad" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button className="chip" disabled={busy} onClick={check}>
        <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
        {busy ? "Проверяем" : "Проверить наличие"}
      </button>
      {toast && <Toast message={toast.text} kind={toast.kind} onHide={() => setToast(null)} />}
    </>
  );
}
