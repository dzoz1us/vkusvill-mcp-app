import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api } from "@/shared/api";
import type { OrderStatus } from "@/shared/api";
import { errorText } from "@/shared/lib";
import { Sheet, Toast } from "@/shared/ui";

const EMPTY: OrderStatus = { code: "", title: "", description: "", sort_order: 100, is_final: false };

export default function StatusesTab() {
  const [items, setItems] = useState<OrderStatus[] | null>(null);
  const [edit, setEdit] = useState<{ original: string | null; value: OrderStatus } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => api.listOrderStatuses().then(setItems).catch(() => setItems([]));
  useEffect(() => {
    void load();
  }, []);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!edit) return;
    const v = edit.value;
    const body = {
      code: v.code.trim().toUpperCase(),
      title: v.title.trim(),
      description: v.description?.trim() || undefined,
      sort_order: v.sort_order,
      is_final: v.is_final,
    };
    try {
      if (edit.original) await api.admin.updateStatus(edit.original, body);
      else await api.admin.createStatus(body);
      setEdit(null);
      await load();
    } catch (err) {
      setError(errorText(err, "Не удалось сохранить статус"));
    }
  };

  const remove = async (code: string) => {
    try {
      await api.admin.deleteStatus(code);
      await load();
    } catch (err) {
      setError(errorText(err, "Статус используется в заказах"));
    }
  };

  return (
    <div className="space-y-4">
      <button className="btn btn-primary btn-sm" onClick={() => setEdit({ original: null, value: { ...EMPTY } })}>
        Новый статус
      </button>
      <div className="data-frame">
        {items?.map((s) => (
          <div key={s.code} className="data-row">
            <div className="min-w-0">
              <p className="font-bold">
                {s.title} <span className="text-muted text-sm font-medium">{s.code}</span>
              </p>
              {s.description && <p className="text-muted text-sm">{s.description}</p>}
            </div>
            <span className="flex flex-shrink-0 gap-2">
              <button className="btn btn-outline btn-sm" onClick={() => setEdit({ original: s.code, value: { ...s } })}>
                Изменить
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => remove(s.code)}>
                Удалить
              </button>
            </span>
          </div>
        ))}
      </div>

      {edit && (
        <Sheet title={edit.original ? "Статус заказа" : "Новый статус"} onClose={() => setEdit(null)}>
          <form onSubmit={save} className="space-y-3">
            <input className="input" placeholder="Код (латиницей)" value={edit.value.code} onChange={(e) => setEdit({ ...edit, value: { ...edit.value, code: e.target.value } })} required />
            <input className="input" placeholder="Название" value={edit.value.title} onChange={(e) => setEdit({ ...edit, value: { ...edit.value, title: e.target.value } })} required />
            <input className="input" placeholder="Описание" value={edit.value.description ?? ""} onChange={(e) => setEdit({ ...edit, value: { ...edit.value, description: e.target.value } })} />
            <input className="input" type="number" min={0} placeholder="Порядок" value={edit.value.sort_order} onChange={(e) => setEdit({ ...edit, value: { ...edit.value, sort_order: Number(e.target.value) } })} />
            <label className="flex items-center gap-3 px-2 font-semibold">
              <input type="checkbox" className="h-5 w-5 accent-[#5a9612]" checked={edit.value.is_final} onChange={(e) => setEdit({ ...edit, value: { ...edit.value, is_final: e.target.checked } })} />
              Финальный статус
            </label>
            <button className="btn btn-primary w-full" type="submit">
              Сохранить
            </button>
          </form>
        </Sheet>
      )}
      {error && <Toast message={error} onHide={() => setError(null)} />}
    </div>
  );
}
