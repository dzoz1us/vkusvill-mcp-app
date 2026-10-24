import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api } from "@/shared/api";
import type { Category } from "@/shared/api";
import { errorText } from "@/shared/lib";
import { Toast } from "@/shared/ui";

export default function CategoriesTab() {
  const [items, setItems] = useState<Category[] | null>(null);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => api.listCategories().then(setItems).catch(() => setItems([]));
  useEffect(() => {
    void load();
  }, []);

  const wrap = async (fn: () => Promise<unknown>, fallback: string) => {
    try {
      await fn();
      await load();
    } catch (e) {
      setError(errorText(e, fallback));
    }
  };

  const add = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await wrap(() => api.admin.createCategory({ name: name.trim() }), "Не удалось создать категорию");
    setName("");
  };

  return (
    <div className="space-y-4">
      <form onSubmit={add} className="flex gap-2">
        <input className="input" placeholder="Новая категория" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn btn-primary btn-sm" type="submit">
          Добавить
        </button>
      </form>
      <div className="data-frame">
        {items?.map((c) => (
          <div key={c.id} className="data-row">
            {editing?.id === c.id ? (
              <input
                className="input !py-2 !text-base"
                value={editing.name}
                autoFocus
                onChange={(e) => setEditing({ id: c.id, name: e.target.value })}
              />
            ) : (
              <span className="font-bold">{c.name}</span>
            )}
            <span className="flex gap-2">
              {editing?.id === c.id ? (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={async () => {
                    await wrap(() => api.admin.updateCategory(c.id, { name: editing.name.trim() }), "Не удалось переименовать");
                    setEditing(null);
                  }}
                >
                  Сохранить
                </button>
              ) : (
                <button className="btn btn-outline btn-sm" onClick={() => setEditing({ id: c.id, name: c.name })}>
                  Изменить
                </button>
              )}
              <button className="btn btn-danger btn-sm" onClick={() => wrap(() => api.admin.deleteCategory(c.id), "Нельзя удалить категорию")}>
                Удалить
              </button>
            </span>
          </div>
        ))}
      </div>
      {error && <Toast message={error} onHide={() => setError(null)} />}
    </div>
  );
}
