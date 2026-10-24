import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Search, X } from "lucide-react";
import { api } from "@/shared/api";
import type { Category, RecipeFilter, RecipeShort } from "@/shared/api";
import { FoodIcon } from "@/shared/ui";
import { useUserStore } from "@/entities/user";
import { RecipeCard } from "@/entities/recipe";
import { FavoriteButton } from "@/features/favorite-recipe";

const MEALS = [
  { value: "breakfast", label: "Завтрак" },
  { value: "lunch", label: "Обед" },
  { value: "dinner", label: "Ужин" },
];
const DIETS = [
  { value: "vegetarian", label: "Вегетарианское" },
  { value: "vegan", label: "Веганское" },
  { value: "pescatarian", label: "С рыбой" },
];
const TIMES = [15, 30, 60];

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button className={`chip flex-shrink-0 ${on ? "chip-active" : ""}`} aria-pressed={on} onClick={onClick}>
      {children}
    </button>
  );
}

export default function CatalogPage() {
  const user = useUserStore((s) => s.user);
  const [categories, setCategories] = useState<Category[]>([]);
  const [q, setQ] = useState("");
  const [meal, setMeal] = useState("");
  const [diet, setDiet] = useState("");
  const [category, setCategory] = useState("");
  const [maxTime, setMaxTime] = useState(0);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [ingInput, setIngInput] = useState("");
  const [favorite, setFavorite] = useState(false);
  const [items, setItems] = useState<RecipeShort[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api.listCategories().then(setCategories).catch(() => undefined);
  }, []);

  const filter = useMemo<RecipeFilter>(
    () => ({
      q: q.trim() || undefined,
      meal_type: meal || undefined,
      diet: diet || undefined,
      category: category || undefined,
      max_time: maxTime || undefined,
      ingredient: ingredients,
      favorite: favorite || undefined,
    }),
    [q, meal, diet, category, maxTime, ingredients, favorite],
  );

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      setFailed(false);
      api
        .listRecipes(filter)
        .then((r) => !cancelled && setItems(r.items))
        .catch(() => {
          if (cancelled) return;
          setFailed(true);
          setItems([]);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [filter]);

  const addIngredient = () => {
    const v = ingInput.trim().toLowerCase();
    if (v && !ingredients.includes(v)) setIngredients([...ingredients, v]);
    setIngInput("");
  };

  const reset = () => {
    setQ("");
    setMeal("");
    setDiet("");
    setCategory("");
    setMaxTime(0);
    setIngredients([]);
    setFavorite(false);
  };
  const dirty = q || meal || diet || category || maxTime || ingredients.length || favorite;
  const activeCount = [meal, diet, category, maxTime, favorite, ...ingredients].filter(Boolean).length;
  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <div className="page">
      <h1 className="heading page-head">Рецепты</h1>

      <div className="relative mb-4">
        <Search className="text-muted pointer-events-none absolute top-1/2 left-5 h-5 w-5 -translate-y-1/2" />
        <input
          className="input pl-12"
          placeholder="Название блюда"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Поиск"
        />
      </div>

      <div className="mb-4 flex items-center gap-3">
        <button className="chip" aria-expanded={filtersOpen} onClick={() => setFiltersOpen(!filtersOpen)}>
          Фильтры{activeCount > 0 ? ` · ${activeCount}` : ""}
        </button>
        {dirty && (
          <button className="link text-sm" onClick={reset}>
            Сбросить
          </button>
        )}
      </div>

      {filtersOpen && (
      <div className="mb-6 space-y-3">
        <div className="tabs">
          {user && (
            <Chip on={favorite} onClick={() => setFavorite(!favorite)}>
              Избранное
            </Chip>
          )}
          {MEALS.map((m) => (
            <Chip key={m.value} on={meal === m.value} onClick={() => setMeal(meal === m.value ? "" : m.value)}>
              {m.label}
            </Chip>
          ))}
          {TIMES.map((t) => (
            <Chip key={t} on={maxTime === t} onClick={() => setMaxTime(maxTime === t ? 0 : t)}>
              до {t} мин
            </Chip>
          ))}
        </div>
        <div className="tabs">
          {DIETS.map((d) => (
            <Chip key={d.value} on={diet === d.value} onClick={() => setDiet(diet === d.value ? "" : d.value)}>
              {d.label}
            </Chip>
          ))}
          {categories.map((c) => (
            <Chip key={c.id} on={category === c.slug} onClick={() => setCategory(category === c.slug ? "" : c.slug)}>
              {c.name}
            </Chip>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            className="input !py-2.5 !text-base"
            placeholder="Продукт, например курица"
            value={ingInput}
            onChange={(e) => setIngInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addIngredient()}
            aria-label="Фильтр по продукту"
          />
          <button className="btn btn-outline btn-sm" onClick={addIngredient}>
            Добавить
          </button>
        </div>
        {ingredients.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {ingredients.map((i) => (
              <button key={i} className="chip chip-active" onClick={() => setIngredients(ingredients.filter((x) => x !== i))}>
                {i}
                <X className="h-4 w-4" />
              </button>
            ))}
          </div>
        )}
      </div>
      )}

      <div className="mt-6 grid gap-3">
        {items === null && Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-[116px]" />)}
        {items?.map((r) => (
          <RecipeCard
            key={r.id}
            recipe={r}
            actions={
              <FavoriteButton
                recipeId={r.id}
                active={!!r.is_favorite}
                onChange={(on) => {
                  if (!on && favorite) setItems((cur) => cur?.filter((x) => x.id !== r.id) ?? cur);
                }}
              />
            }
          />
        ))}
      </div>
      {items?.length === 0 && (
        <div className="py-10 text-center">
          <FoodIcon name="confused-face" className="mx-auto mb-3 h-14 w-14" />
          <p className="text-lg font-bold">{failed ? "Каталог не загрузился" : "Ничего не нашли"}</p>
          <p className="text-muted">{failed ? "Проверьте соединение" : "Попробуйте убрать часть фильтров"}</p>
        </div>
      )}
    </div>
  );
}
