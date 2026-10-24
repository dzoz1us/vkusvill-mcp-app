import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import { api } from "@/shared/api";
import type { AdminProduct, ApplianceType, Category, DietType, RecipeShort, RecipeUpsert } from "@/shared/api";
import { errorText, unitLabel } from "@/shared/lib";
import { Sheet, Toast } from "@/shared/ui";
import { RecipeCard } from "@/entities/recipe";

const APPLIANCES: { value: ApplianceType; label: string }[] = [
  { value: "stove", label: "Плита" },
  { value: "oven", label: "Духовка" },
  { value: "microwave", label: "Микроволновка" },
  { value: "multicooker", label: "Мультиварка" },
  { value: "air_fryer", label: "Аэрогриль" },
  { value: "blender", label: "Блендер" },
];
const DIETS: { value: DietType; label: string }[] = [
  { value: "none", label: "Без ограничений" },
  { value: "vegetarian", label: "Вегетарианское" },
  { value: "vegan", label: "Веганское" },
  { value: "pescatarian", label: "С рыбой" },
];
const MEAL_TYPES = [
  { value: "breakfast", label: "Завтрак" },
  { value: "lunch", label: "Обед" },
  { value: "dinner", label: "Ужин" },
  { value: "any", label: "Любой" },
];
const UNITS = ["g", "ml", "pcs"];

interface FormState extends Omit<RecipeUpsert, "steps" | "calories" | "protein" | "fat" | "carbs"> {
  stepsText: string;
  calories: string;
  protein: string;
  fat: string;
  carbs: string;
}

const emptyForm = (): FormState => ({
  name: "",
  description: "",
  meal_type: "any",
  servings: 2,
  cook_time_minutes: 30,
  calories: "",
  protein: "",
  fat: "",
  carbs: "",
  diet: "none",
  tags: [],
  appliances: ["stove"],
  category_ids: [],
  published: true,
  stepsText: "",
  ingredients: [],
});

const num = (v: string): number | null => (v.trim() === "" ? null : Number(v));

export default function RecipesTab() {
  const [items, setItems] = useState<RecipeShort[] | null>(null);
  const [filter, setFilter] = useState("");
  const [editing, setEditing] = useState<{ id: string | null; form: FormState } | null>(null);
  const [toast, setToast] = useState<{ text: string; kind: "ok" | "bad" } | null>(null);

  const load = () => api.admin.recipes().then((r) => setItems(r.items)).catch(() => setItems([]));
  useEffect(() => {
    void load();
  }, []);

  const fail = (e: unknown, fallback: string) => setToast({ text: errorText(e, fallback), kind: "bad" });

  const openEdit = async (id: string) => {
    try {
      const r = await api.getRecipe(id);
      setEditing({
        id,
        form: {
          name: r.name,
          description: r.description ?? "",
          meal_type: r.meal_type ?? "any",
          servings: r.servings,
          cook_time_minutes: r.cook_time_minutes,
          calories: r.nutrition ? String(r.nutrition.calories) : "",
          protein: r.nutrition ? String(r.nutrition.protein) : "",
          fat: r.nutrition ? String(r.nutrition.fat) : "",
          carbs: r.nutrition ? String(r.nutrition.carbs) : "",
          diet: r.diet,
          tags: r.tags ?? [],
          appliances: r.appliances,
          category_ids: (r.categories ?? []).map((c) => Number(c.id)),
          published: r.published !== false,
          stepsText: r.steps.join("\n"),
          ingredients: r.ingredients.map((i) => ({ ingredient_id: Number(i.id), quantity: i.quantity, unit: i.unit })),
        },
      });
    } catch (e) {
      fail(e, "Не удалось открыть рецепт");
    }
  };

  const shown = (items ?? []).filter((r) => !filter || r.name.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input className="input" placeholder="Поиск по названию" value={filter} onChange={(e) => setFilter(e.target.value)} />
        <button className="btn btn-primary btn-sm" onClick={() => setEditing({ id: null, form: emptyForm() })}>
          Новый
        </button>
      </div>

      <div className="grid gap-3">
        {items === null && <div className="skeleton h-28" />}
        {shown.map((r) => (
          <RecipeCard
            key={r.id}
            recipe={r}
            actions={
              <div className="flex flex-wrap justify-end gap-2">
                <button className="btn btn-outline btn-sm" onClick={() => openEdit(r.id)}>
                  Править
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={async () => {
                    try {
                      await api.admin.publishRecipe(r.id, r.published === false);
                      await load();
                    } catch (e) {
                      fail(e, "Не удалось изменить видимость");
                    }
                  }}
                >
                  {r.published === false ? "Показать" : "Скрыть"}
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={async () => {
                    if (!window.confirm(`Удалить «${r.name}»?`)) return;
                    try {
                      await api.admin.deleteRecipe(r.id);
                      await load();
                    } catch (e) {
                      fail(e, "Рецепт используется в планах — лучше скрыть");
                    }
                  }}
                >
                  Удалить
                </button>
              </div>
            }
          />
        ))}
      </div>

      {editing && (
        <RecipeForm
          id={editing.id}
          initial={editing.form}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void load();
            setToast({ text: "Рецепт сохранён", kind: "ok" });
          }}
        />
      )}
      {toast && <Toast message={toast.text} kind={toast.kind} onHide={() => setToast(null)} />}
    </div>
  );
}

function RecipeForm({
  id,
  initial,
  onClose,
  onSaved,
}: {
  id: string | null;
  initial: FormState;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [f, setF] = useState<FormState>(initial);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.listCategories().then(setCategories).catch(() => undefined);
    api.admin.products().then(setProducts).catch(() => undefined);
  }, []);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((cur) => ({ ...cur, [k]: v }));
  const toggle = <T,>(list: T[], v: T): T[] => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const steps = f.stepsText.split("\n").map((s) => s.trim()).filter(Boolean);
    if (steps.length === 0 || f.ingredients.length === 0) {
      setError("Добавьте хотя бы один ингредиент и один шаг");
      return;
    }
    const body: RecipeUpsert = {
      name: f.name.trim(),
      description: f.description,
      meal_type: f.meal_type,
      servings: f.servings,
      cook_time_minutes: f.cook_time_minutes,
      calories: num(f.calories),
      protein: num(f.protein),
      fat: num(f.fat),
      carbs: num(f.carbs),
      diet: f.diet,
      tags: f.tags,
      appliances: f.appliances,
      category_ids: f.category_ids,
      published: f.published,
      steps,
      ingredients: f.ingredients,
    };
    setBusy(true);
    setError(null);
    try {
      if (id) await api.admin.updateRecipe(id, body);
      else await api.admin.createRecipe(body);
      onSaved();
    } catch (err) {
      setError(errorText(err, "Не удалось сохранить рецепт"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet title={id ? "Правка рецепта" : "Новый рецепт"} onClose={onClose}>
      <form onSubmit={submit} className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
        <input className="input" placeholder="Название" value={f.name} onChange={(e) => set("name", e.target.value)} required />
        <textarea className="input" rows={2} placeholder="Описание" value={f.description} onChange={(e) => set("description", e.target.value)} />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Приём пищи</label>
            <select className="input" value={f.meal_type} onChange={(e) => set("meal_type", e.target.value)}>
              {MEAL_TYPES.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Диета</label>
            <select className="input" value={f.diet} onChange={(e) => set("diet", e.target.value as DietType)}>
              {DIETS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Порций</label>
            <input className="input" type="number" min={1} max={20} value={f.servings} onChange={(e) => set("servings", Number(e.target.value))} />
          </div>
          <div>
            <label className="label">Минут</label>
            <input className="input" type="number" min={1} max={600} value={f.cook_time_minutes} onChange={(e) => set("cook_time_minutes", Number(e.target.value))} />
          </div>
          <input className="input" type="number" placeholder="Ккал" value={f.calories} onChange={(e) => set("calories", e.target.value)} />
          <input className="input" type="number" placeholder="Белки, г" value={f.protein} onChange={(e) => set("protein", e.target.value)} />
          <input className="input" type="number" placeholder="Жиры, г" value={f.fat} onChange={(e) => set("fat", e.target.value)} />
          <input className="input" type="number" placeholder="Углеводы, г" value={f.carbs} onChange={(e) => set("carbs", e.target.value)} />
        </div>

        <div>
          <label className="label">Категории</label>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button type="button" key={c.id} className={`chip ${f.category_ids.includes(Number(c.id)) ? "chip-active" : ""}`} onClick={() => set("category_ids", toggle(f.category_ids, Number(c.id)))}>
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Техника</label>
          <div className="flex flex-wrap gap-2">
            {APPLIANCES.map((a) => (
              <button type="button" key={a.value} className={`chip ${f.appliances.includes(a.value) ? "chip-active" : ""}`} onClick={() => set("appliances", toggle(f.appliances, a.value))}>
                {a.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Ингредиенты</label>
          <div className="space-y-2">
            {f.ingredients.map((ing, i) => (
              <div key={i} className="grid grid-cols-[1fr_5rem_4.5rem_2.75rem] items-center gap-2">
                <select
                  className="input !px-4 !py-2 !text-base"
                  value={ing.ingredient_id}
                  onChange={(e) => {
                    const p = products.find((x) => x.ingredient_id === e.target.value);
                    set("ingredients", f.ingredients.map((x, j) => (j === i ? { ...x, ingredient_id: Number(e.target.value), unit: p?.default_unit ?? x.unit } : x)));
                  }}
                >
                  <option value={0}>Выберите</option>
                  {products.map((p) => (
                    <option key={p.ingredient_id} value={p.ingredient_id}>{p.ingredient_name}</option>
                  ))}
                </select>
                <input className="input !px-3 !py-2 !text-base" type="number" min={0} step="any" value={ing.quantity} onChange={(e) => set("ingredients", f.ingredients.map((x, j) => (j === i ? { ...x, quantity: Number(e.target.value) } : x)))} />
                <select className="input !px-2 !py-2 !text-base" value={ing.unit} onChange={(e) => set("ingredients", f.ingredients.map((x, j) => (j === i ? { ...x, unit: e.target.value } : x)))}>
                  {UNITS.map((u) => (
                    <option key={u} value={u}>{unitLabel(u)}</option>
                  ))}
                </select>
                <button type="button" className="icon-btn !h-10 !w-10" aria-label="Убрать ингредиент" onClick={() => set("ingredients", f.ingredients.filter((_, j) => j !== i))}>
                  <Trash2 />
                </button>
              </div>
            ))}
            <button type="button" className="chip" onClick={() => set("ingredients", [...f.ingredients, { ingredient_id: 0, quantity: 100, unit: "g" }])}>
              <Plus className="h-4 w-4" />
              Ингредиент
            </button>
          </div>
        </div>

        <div>
          <label className="label">Шаги (каждый с новой строки)</label>
          <textarea className="input" rows={5} value={f.stepsText} onChange={(e) => set("stepsText", e.target.value)} />
        </div>

        <label className="flex items-center gap-3 px-2 font-semibold">
          <input type="checkbox" className="h-5 w-5 accent-[#5a9612]" checked={f.published} onChange={(e) => set("published", e.target.checked)} />
          Показывать в каталоге
        </label>

        {error && <div className="alert alert-bad">{error}</div>}
        <button className="btn btn-primary w-full" type="submit" disabled={busy}>
          {busy ? "Сохраняем" : "Сохранить"}
        </button>
      </form>
    </Sheet>
  );
}
