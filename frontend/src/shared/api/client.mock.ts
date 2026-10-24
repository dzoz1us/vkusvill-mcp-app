import type {
  ApplianceType,
  CartResponse,
  DietType,
  DayMeal,
  GenerateRequest,
  GroceryItem,
  GroceryList,
  Ingredient,
  MealPlan,
  MealType,
  PreferenceTag,
  Recipe,
  ReplaceMealResponse,
} from "./types";
import recipesSeed from "./mock-data/recipes.json";
import ingredientsSeed from "./mock-data/ingredients.json";

// Mock работает на тех же рецептах, что и настоящий бэкенд (seed/recipes.json):
// название, ингредиенты, шаги и КБЖУ всегда относятся к одному и тому же блюду.

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const UNITS: Record<string, string> = { g: "г", ml: "мл", pcs: "шт" };

const DISPLAY_NAMES = new Map<string, string>(
  ingredientsSeed.map((i) => [i.normalized_name, i.name]),
);

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

interface SeedRecipe {
  name: string;
  description: string;
  meal_type: string;
  servings: number;
  cook_time_minutes: number;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  diet: string;
  tags: string[];
  appliances: string[];
  ingredients: { normalized_name: string; quantity: number; unit: string }[];
  steps: string[];
}

const RECIPES: Recipe[] = (recipesSeed as SeedRecipe[]).map((r, index) => ({
  id: `recipe-${index + 1}`,
  name: r.name,
  image_url: null,
  cook_time_minutes: r.cook_time_minutes,
  servings: r.servings,
  nutrition: {
    calories: r.calories,
    protein: r.protein,
    fat: r.fat,
    carbs: r.carbs,
  },
  diet: r.diet as DietType,
  appliances: r.appliances as ApplianceType[],
  ingredients: r.ingredients.map((ing, i) => ({
    id: `recipe-${index + 1}-ing-${i + 1}`,
    name:
      DISPLAY_NAMES.get(ing.normalized_name) ?? capitalize(ing.normalized_name),
    quantity: ing.quantity,
    unit: UNITS[ing.unit] ?? ing.unit,
  })),
  steps: r.steps,
}));

const META = new Map(
  (recipesSeed as SeedRecipe[]).map((r, i) => [
    `recipe-${i + 1}`,
    { meal_type: r.meal_type, tags: r.tags },
  ]),
);

const DIET_ALLOWED: Record<DietType, DietType[]> = {
  none: ["none", "vegetarian", "vegan", "pescatarian"],
  vegetarian: ["vegetarian", "vegan"],
  vegan: ["vegan"],
  pescatarian: ["pescatarian", "vegetarian", "vegan"],
};

const shuffle = <T>(items: T[]): T[] => {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/** Рецепты, подходящие под приём пищи и параметры пользователя, лучшие — первыми. */
function candidatesFor(
  mealType: MealType,
  req: Pick<GenerateRequest, "diet" | "appliances" | "preferences">,
): Recipe[] {
  const byMeal = RECIPES.filter((r) => {
    const m = META.get(r.id)!.meal_type;
    return m === mealType || (m === "any" && mealType !== "breakfast");
  });
  const byDiet = byMeal.filter((r) => DIET_ALLOWED[req.diet].includes(r.diet));
  const byAppliance = byDiet.filter((r) =>
    r.appliances.every((a) => req.appliances.includes(a)),
  );
  const pool = byAppliance.length > 0 ? byAppliance : byDiet;
  const score = (r: Recipe) =>
    META.get(r.id)!.tags.filter((t) =>
      req.preferences.includes(t as PreferenceTag),
    ).length;
  return shuffle(pool).sort((a, b) => score(b) - score(a));
}

function generateMealPlan(request: GenerateRequest): MealPlan {
  const mealTypes: MealType[] = ["breakfast", "lunch", "dinner"];
  const used = new Set<string>();
  const meals: DayMeal[] = [];

  request.days.forEach((day) => {
    mealTypes.forEach((mealType) => {
      const pool = candidatesFor(mealType, request);
      const recipe =
        pool.find((r) => !used.has(r.id)) ??
        pool[Math.floor(Math.random() * pool.length)] ??
        RECIPES[0];
      used.add(recipe.id);
      meals.push({
        id: `meal-${day}-${mealType}-${Date.now()}`,
        day,
        meal_type: mealType,
        recipe,
      });
    });
  });

  const plan: MealPlan = {
    id: `plan-${Date.now()}`,
    created_at: new Date().toISOString(),
    params: request,
    meals,
    cart_estimated_cost: 0,
    budget: request.budget,
    unresolved_items_count: 0,
    status: "ready",
  };
  fitToBudget(plan);
  refreshTotals(plan);
  return plan;
}

function refreshTotals(plan: MealPlan) {
  const grocery = generateGroceryList(plan);
  plan.cart_estimated_cost = grocery.total_cost;
  plan.unresolved_items_count = grocery.not_found_count;
}

/** Заменяет блюда на более дешёвые, пока стоимость не уложится в бюджет. */
function fitToBudget(plan: MealPlan) {
  const cost = () => generateGroceryList(plan).total_cost;
  let current = cost();

  for (const allowRepeats of [false, true]) {
    for (let guard = 0; guard < 80 && current > plan.budget; guard++) {
      const used = new Set(plan.meals.map((m) => m.recipe.id));
      let best: { index: number; recipe: Recipe; cost: number } | null = null;

      plan.meals.forEach((meal, index) => {
        const original = meal.recipe;
        for (const r of candidatesFor(meal.meal_type, plan.params)) {
          if (r.id === original.id || (!allowRepeats && used.has(r.id))) continue;
          meal.recipe = r;
          const c = cost();
          meal.recipe = original;
          if (c < current && (!best || c < best.cost)) best = { index, recipe: r, cost: c };
        }
      });

      if (!best) break;
      const pick: { index: number; recipe: Recipe; cost: number } = best;
      plan.meals[pick.index].recipe = pick.recipe;
      current = pick.cost;
    }
  }
}

// Стабильная «цена» по названию продукта: один и тот же товар стоит одинаково
const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};

function generateGroceryList(plan: MealPlan): GroceryList {
  const totals = new Map<
    string,
    { name: string; quantity: number; unit: string }
  >();

  plan.meals.forEach((meal) => {
    const recipe = meal.recipe as Recipe;
    const factor = plan.params.people_count / Math.max(1, recipe.servings);
    (recipe.ingredients ?? []).forEach((ing: Ingredient) => {
      const key = `${ing.name}|${ing.unit}`;
      const qty = ing.quantity * factor;
      const existing = totals.get(key);
      if (existing) existing.quantity += qty;
      else totals.set(key, { name: ing.name, quantity: qty, unit: ing.unit });
    });
  });

  let totalCost = 0;
  let matched = 0;
  let review = 0;
  let notFound = 0;

  const items: GroceryItem[] = Array.from(totals.values()).map((ing, i) => {
    const h = hash(ing.name);
    const quantity = Math.max(1, Math.round(ing.quantity));
    const packageQty = ing.unit === "г" ? 500 : ing.unit === "мл" ? 1000 : 1;
    const packageCount = Math.max(1, Math.ceil(quantity / packageQty));
    const pricePerPackage =
      ing.unit === "шт"
        ? 8 + (h % 25)
        : ing.unit === "мл"
          ? 45 + (h % 50)
          : 39 + (h % 80);
    const total = pricePerPackage * packageCount;

    // Штучные позиции, которые нельзя сопоставить с граммами, требуют проверки
    const status =
      h % 17 === 0
        ? "not_found"
        : ing.unit === "шт" && h % 5 === 0
          ? "requires_review"
          : "matched";
    if (status === "not_found") notFound++;
    else {
      totalCost += total;
      if (status === "matched") matched++;
      else review++;
    }

    return {
      id: `grocery-${i}`,
      product_name: ing.name,
      needed_quantity: quantity,
      needed_unit: ing.unit,
      package_quantity: packageQty,
      package_unit: ing.unit,
      package_count: packageCount,
      price_per_package: status === "not_found" ? null : pricePerPackage,
      total_price: status === "not_found" ? null : total,
      match_status: status,
      is_bought: false,
      ingredient_id: `ing-${i}`,
    };
  });

  return {
    items,
    total_cost: Math.round(totalCost),
    matched_count: matched,
    review_count: review,
    not_found_count: notFound,
  };
}

const loadPlan = (id: string): MealPlan | null => {
  const stored = localStorage.getItem(`meal-plan-${id}`);
  return stored ? (JSON.parse(stored) as MealPlan) : null;
};

const DEFAULT_REQUEST: GenerateRequest = {
  people_count: 2,
  days: ["mon", "tue", "wed", "thu", "fri"],
  budget: 5000,
  preferences: ["healthy", "family"],
  diet: "none",
  appliances: ["stove", "oven"],
};

const planOrDefault = (planId: string): MealPlan =>
  loadPlan(planId) ?? { ...generateMealPlan(DEFAULT_REQUEST), id: planId };

// API Client
export const api = {
  async generateMealPlan(request: GenerateRequest): Promise<MealPlan> {
    await delay(3600); // чтобы был виден экран «Собираем вашу неделю»
    return generateMealPlan(request);
  },

  async getMealPlan(id: string): Promise<MealPlan> {
    await delay(400);
    const stored = loadPlan(id);
    if (stored) return stored;
    const plan = planOrDefault(id);
    localStorage.setItem(`meal-plan-${id}`, JSON.stringify(plan));
    return plan;
  },

  async getRecipe(id: string): Promise<Recipe> {
    await delay(250);
    const recipe = RECIPES.find((r) => r.id === id);
    if (!recipe) throw new Error(`Recipe ${id} not found`);
    return recipe;
  },

  async replaceMeal(
    planId: string,
    dayMealId: string,
  ): Promise<ReplaceMealResponse> {
    await delay(900);
    const plan = planOrDefault(planId);

    const idx = plan.meals.findIndex((m) => m.id === dayMealId);
    if (idx < 0) {
      throw new Error(`Meal ${dayMealId} not found in plan ${planId}`);
    }

    const original = plan.meals[idx].recipe;
    const used = new Set(plan.meals.map((m) => m.recipe.id));
    const pool = candidatesFor(plan.meals[idx].meal_type, plan.params).filter(
      (r) => r.id !== original.id,
    );
    // Подходят только замены, которые не выводят стоимость за бюджет
    const fits = (r: Recipe) => {
      plan.meals[idx].recipe = r;
      const ok = generateGroceryList(plan).total_cost <= plan.budget;
      plan.meals[idx].recipe = original;
      return ok;
    };
    const replacement =
      pool.find((r) => !used.has(r.id) && fits(r)) ?? pool.find(fits);
    if (!replacement) throw new Error("No replacement within budget");

    plan.meals[idx].recipe = replacement;
    refreshTotals(plan);
    localStorage.setItem(`meal-plan-${planId}`, JSON.stringify(plan));

    return { plan, replaced_recipe: replacement };
  },

  async getGroceryList(planId: string): Promise<GroceryList> {
    await delay(500);
    return generateGroceryList(planOrDefault(planId));
  },

  async updateGroceryItem(
    itemId: string,
    isBought: boolean,
  ): Promise<GroceryItem> {
    await delay(150);
    return {
      id: itemId,
      product_name: "",
      needed_quantity: 1,
      needed_unit: "шт",
      package_quantity: 1,
      package_unit: "шт",
      package_count: 1,
      price_per_package: 0,
      total_price: 0,
      match_status: "matched",
      is_bought: isBought,
      ingredient_id: null,
    };
  },

  async createVkusvillCart(planId: string): Promise<CartResponse> {
    await delay(1200);
    const list = generateGroceryList(planOrDefault(planId));
    const itemCount = list.matched_count + list.review_count;

    const carts: CartResponse["carts"] = [];
    let remaining = itemCount;
    let cartNum = 1;
    while (remaining > 0) {
      const count = Math.min(remaining, 100); // одна корзина ВкусВилл
      carts.push({
        cart_url: `https://vkusvill.ru/cart?plan=${planId}&cart=${cartNum}&items=${count}`,
        items_count: count,
      });
      remaining -= count;
      cartNum++;
    }

    return {
      carts,
      price_changed: false,
      unresolved_items: list.not_found_count,
    };
  },

  async refreshPrices(
    planId: string,
  ): Promise<{ cost_changed: boolean; new_cost: number }> {
    await delay(600);
    const cost = generateGroceryList(planOrDefault(planId)).total_cost;
    return { cost_changed: false, new_cost: cost };
  },
};
