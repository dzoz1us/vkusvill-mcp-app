import { useState } from "react";
import { Minus, Plus, Repeat, Trash2 } from "lucide-react";
import { api } from "@/shared/api";
import type { GroceryItem, ProductOption } from "@/shared/api";
import { errorText, formatPrice } from "@/shared/lib";
import { Sheet, Toast } from "@/shared/ui";
import { useGroceryStore } from "@/entities/grocery-item";

/** Правка позиции списка покупок: количество, замена товара, удаление. */
export default function GroceryItemActions({ planId, item }: { planId: string; item: GroceryItem }) {
  const refresh = useGroceryStore((s) => s.refresh);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<ProductOption[] | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const run = async (fn: () => Promise<unknown>, fallback: string) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await fn();
      await refresh(planId);
    } catch (e) {
      setError(errorText(e, fallback));
    } finally {
      setBusy(false);
    }
  };

  const count = item.package_count ?? 0;
  const canCount = !item.is_manual && item.package_count !== null;
  const countLabel = item.sold_by_weight
    ? `${count * 100} г`
    : `${count} уп.`;

  const openOptions = async () => {
    setLoadingOptions(true);
    setError(null);
    try {
      setOptions(await api.groceryAlternatives(item.id));
    } catch (e) {
      setError(errorText(e, "Не удалось найти замену"));
    } finally {
      setLoadingOptions(false);
    }
  };

  return (
    <>
      {canCount && (
        <span className="border-line inline-flex items-center rounded-full border">
          <button
            className="icon-btn !h-9 !w-9 !border-0"
            disabled={busy || count <= 1}
            aria-label="Меньше"
            onClick={() => run(() => api.updateGroceryItem(item.id, { package_count: count - 1 }), "Не удалось изменить количество")}
          >
            <Minus />
          </button>
          <span className="min-w-[4rem] text-center text-sm font-bold">{countLabel}</span>
          <button
            className="icon-btn !h-9 !w-9 !border-0"
            disabled={busy || count >= 99}
            aria-label="Больше"
            onClick={() => run(() => api.updateGroceryItem(item.id, { package_count: count + 1 }), "Не удалось изменить количество")}
          >
            <Plus />
          </button>
        </span>
      )}
      {!item.is_manual && (
        <button className="chip !min-h-9 !px-3 text-sm" disabled={busy || loadingOptions} onClick={openOptions}>
          <Repeat className="h-4 w-4" />
          {loadingOptions ? "Ищем" : "Заменить"}
        </button>
      )}
      <button
        className="icon-btn !h-9 !w-9 hover:!border-danger hover:text-danger"
        disabled={busy}
        aria-label="Удалить позицию"
        title="Удалить позицию"
        onClick={() => run(() => api.deleteGroceryItem(item.id), "Не удалось удалить")}
      >
        <Trash2 />
      </button>

      {options && (
        <Sheet title="Чем заменить?" onClose={() => setOptions(null)}>
          {options.length === 0 ? (
            <p className="text-muted py-4 text-center">Подходящих товаров не нашлось</p>
          ) : (
            <div className="max-h-[55vh] space-y-2 overflow-y-auto">
              {options.map((o) => (
                <button
                  key={o.xml_id}
                  disabled={busy}
                  className="border-line hover:border-accent flex w-full items-center justify-between gap-3 rounded-[24px] border p-4 text-left"
                  onClick={async () => {
                    await run(() => api.replaceProduct(item.id, o), "Не удалось заменить");
                    setOptions(null);
                  }}
                >
                  <span className="font-bold">{o.name}</span>
                  <span className="font-bold whitespace-nowrap">{o.price != null ? formatPrice(o.price) : "—"}</span>
                </button>
              ))}
            </div>
          )}
        </Sheet>
      )}
      {error && <Toast message={error} onHide={() => setError(null)} />}
    </>
  );
}
