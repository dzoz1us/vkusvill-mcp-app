import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api } from "@/shared/api";
import type { AdminProduct, ProductOption } from "@/shared/api";
import { errorText, formatPrice, unitLabel } from "@/shared/lib";
import { Sheet, Toast } from "@/shared/ui";

const UNITS = ["g", "ml", "pcs"];

export default function ProductsTab() {
  const [items, setItems] = useState<AdminProduct[] | null>(null);
  const [filter, setFilter] = useState("");
  const [only, setOnly] = useState<"all" | "unmapped">("all");
  const [pick, setPick] = useState<AdminProduct | null>(null);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState<{ text: string; kind: "ok" | "bad" } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = () => api.admin.products().then(setItems).catch(() => setItems([]));
  useEffect(() => {
    void load();
  }, []);

  const wrap = async (key: string, fn: () => Promise<unknown>, ok: string, fail: string) => {
    setBusy(key);
    try {
      await fn();
      await load();
      setToast({ text: ok, kind: "ok" });
    } catch (e) {
      setToast({ text: errorText(e, fail), kind: "bad" });
    } finally {
      setBusy(null);
    }
  };

  const shown = (items ?? []).filter(
    (i) =>
      (only === "all" || !i.mapped) &&
      (!filter || i.ingredient_name.toLowerCase().includes(filter.toLowerCase())),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <input className="input !w-auto min-w-0 flex-1" placeholder="Поиск по ингредиенту" value={filter} onChange={(e) => setFilter(e.target.value)} />
        <button className={`chip ${only === "unmapped" ? "chip-active" : ""}`} onClick={() => setOnly(only === "all" ? "unmapped" : "all")}>
          Без товара
        </button>
        <button className="chip" onClick={() => setAdding(true)}>
          Новый ингредиент
        </button>
        <button
          className="chip"
          disabled={busy === "sync"}
          onClick={() =>
            wrap("sync", async () => {
              const r = await api.admin.syncProducts();
              setToast({ text: `Проверено ${r.checked}, обновлено ${r.updated}, нет в наличии ${r.unavailable}`, kind: "ok" });
            }, "Синхронизировано", "Не удалось синхронизировать")
          }
        >
          {busy === "sync" ? "Синхронизируем" : "Обновить цены"}
        </button>
      </div>

      <div className="data-frame">
        {items === null && <div className="skeleton m-3 h-16" />}
        {shown.map((i) => (
          <div key={i.ingredient_id} className="space-y-2 px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold">{i.ingredient_name}</p>
                <p className="text-muted text-sm">
                  {i.mapped ? (
                    <>
                      {i.product_name}
                      {i.price != null && ` · ${formatPrice(i.price)}`}
                      {i.package_quantity != null && ` · ${i.package_quantity} ${unitLabel(i.package_unit)}`}
                      {i.sold_by_weight && " · на вес"}
                    </>
                  ) : (
                    "Товар не сопоставлен"
                  )}
                </p>
              </div>
              {i.mapped ? (
                <span className={`pill ${i.available === false ? "pill-bad" : "pill-ok"}`}>
                  {i.available === false ? "Нет в наличии" : "Есть"}
                </span>
              ) : (
                <span className="pill pill-warn">Нет товара</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="btn btn-outline btn-sm" onClick={() => setPick(i)}>
                Выбрать товар
              </button>
              <button
                className="btn btn-outline btn-sm"
                disabled={busy === i.ingredient_id}
                onClick={() => wrap(i.ingredient_id, () => api.admin.autoMatch(i.ingredient_id), "Подобран автоматически", "Автоподбор не нашёл товар")}
              >
                Подобрать сам
              </button>
              {i.mapped && (
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => wrap(i.ingredient_id, () => api.admin.removeMapping(i.ingredient_id), "Сопоставление убрано", "Не удалось убрать")}
                >
                  Убрать товар
                </button>
              )}
              <button
                className="btn btn-danger btn-sm"
                onClick={() => wrap(i.ingredient_id, () => api.admin.deleteIngredient(i.ingredient_id), "Ингредиент удалён", "Ингредиент используется в рецептах")}
              >
                Удалить
              </button>
            </div>
          </div>
        ))}
      </div>

      {pick && (
        <PickProduct
          ingredient={pick}
          onClose={() => setPick(null)}
          onPicked={(o) => {
            const ing = pick;
            setPick(null);
            void wrap(
              ing.ingredient_id,
              () =>
                api.admin.setMapping(ing.ingredient_id, {
                  product_xml_id: o.xml_id,
                  product_name: o.name,
                  product_url: o.url,
                  package_quantity: o.sold_by_weight ? null : o.package_quantity ?? 1,
                  package_unit: o.sold_by_weight ? null : o.package_unit ?? ing.default_unit,
                  price: o.price ?? 0,
                  sold_by_weight: o.sold_by_weight,
                  available: true,
                }),
              "Товар сопоставлен",
              "Не удалось сопоставить",
            );
          }}
        />
      )}
      {adding && <NewIngredient onClose={() => setAdding(false)} onDone={() => { setAdding(false); void load(); }} />}
      {toast && <Toast message={toast.text} kind={toast.kind} onHide={() => setToast(null)} />}
    </div>
  );
}

function PickProduct({
  ingredient,
  onClose,
  onPicked,
}: {
  ingredient: AdminProduct;
  onClose: () => void;
  onPicked: (o: ProductOption) => void;
}) {
  const [q, setQ] = useState(ingredient.ingredient_name);
  const [found, setFound] = useState<ProductOption[] | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      api.admin.searchProducts(q).then(setFound).catch(() => setFound([]));
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <Sheet title={`Товар для «${ingredient.ingredient_name}»`} onClose={onClose}>
      <input className="input mb-3" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск во ВкусВилл" autoFocus />
      <div className="max-h-[50vh] space-y-2 overflow-y-auto">
        {found === null && <p className="text-muted py-4 text-center">Ищем</p>}
        {found?.length === 0 && <p className="text-muted py-4 text-center">Ничего не нашли</p>}
        {found?.map((o) => (
          <button key={o.xml_id} className="border-line hover:border-accent flex w-full items-center justify-between gap-3 rounded-[24px] border p-4 text-left" onClick={() => onPicked(o)}>
            <span className="font-bold">{o.name}</span>
            <span className="font-bold whitespace-nowrap">{o.price != null ? formatPrice(o.price) : "—"}</span>
          </button>
        ))}
      </div>
    </Sheet>
  );
}

function NewIngredient({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("g");
  const [category, setCategory] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.admin.createIngredient({ name: name.trim(), default_unit: unit, category: category.trim() || undefined });
      onDone();
    } catch (err) {
      setError(errorText(err, "Не удалось создать"));
    }
  };

  return (
    <Sheet title="Новый ингредиент" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <input className="input" placeholder="Название" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
        <select className="input" value={unit} onChange={(e) => setUnit(e.target.value)}>
          {UNITS.map((u) => (
            <option key={u} value={u}>{unitLabel(u)}</option>
          ))}
        </select>
        <input className="input" placeholder="Категория (необязательно)" value={category} onChange={(e) => setCategory(e.target.value)} />
        {error && <div className="alert alert-bad">{error}</div>}
        <button className="btn btn-primary w-full" type="submit">
          Создать
        </button>
      </form>
    </Sheet>
  );
}
