import { useState } from "react";
import type { FormEvent } from "react";
import { Plus } from "lucide-react";
import { api } from "@/shared/api";
import { errorText } from "@/shared/lib";
import { Sheet } from "@/shared/ui";
import { useGroceryStore } from "@/entities/grocery-item";

const UNITS = [
  { value: "pcs", label: "шт" },
  { value: "g", label: "г" },
  { value: "ml", label: "мл" },
];

/** Добавить в список свою позицию, которой нет в рецептах. */
export default function AddGroceryItemButton({ planId }: { planId: string }) {
  const refresh = useGroceryStore((s) => s.refresh);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [qty, setQty] = useState(1);
  const [unit, setUnit] = useState("pcs");
  const [price, setPrice] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await api.addGroceryItem(planId, {
        product_name: name.trim(),
        needed_quantity: qty,
        needed_unit: unit,
        ...(price ? { price: Number(price) } : {}),
      });
      await refresh(planId);
      setOpen(false);
      setName("");
      setQty(1);
      setPrice("");
    } catch (err) {
      setError(errorText(err, "Не удалось добавить"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button className="chip" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Добавить позицию
      </button>
      {open && (
        <Sheet title="Своя позиция" onClose={() => setOpen(false)}>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label" htmlFor="g-name">Название</label>
              <input id="g-name" className="input" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="g-qty">Количество</label>
                <input id="g-qty" type="number" min={0.1} step="any" className="input" value={qty} onChange={(e) => setQty(Number(e.target.value))} required />
              </div>
              <div>
                <label className="label" htmlFor="g-unit">Единица</label>
                <select id="g-unit" className="input" value={unit} onChange={(e) => setUnit(e.target.value)}>
                  {UNITS.map((u) => (
                    <option key={u.value} value={u.value}>{u.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="label" htmlFor="g-price">Цена, ₽ (если знаете)</label>
              <input id="g-price" type="number" min={0} step="any" className="input" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            {error && <div className="alert alert-bad">{error}</div>}
            <button type="submit" disabled={busy} className="btn btn-primary w-full">
              {busy ? "Добавляем" : "Добавить"}
            </button>
          </form>
        </Sheet>
      )}
    </>
  );
}
