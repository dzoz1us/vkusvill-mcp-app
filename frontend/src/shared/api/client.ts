/**
 * HTTP-клиент Java-бэкенда. Запросы идут на /api (в разработке Vite проксирует их на :8000).
 * JWT лежит в localStorage и добавляется ко всем запросам.
 */

import type {
  AdminProduct,
  AuthResponse,
  AvailabilityResult,
  Category,
  GenerateRequest,
  GroceryItem,
  GroceryList,
  MealPlan,
  Notification,
  NotificationsResponse,
  Order,
  OrderStatus,
  PlanSummary,
  ProductOption,
  Recipe,
  RecipeFilter,
  RecipeList,
  RecipeUpsert,
  ReplaceMealResponse,
  Role,
  User,
} from "./types";

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "";
const TOKEN_KEY = "edoplan-token";

export const tokenStore = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string | null) {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {
      // хранилище недоступно — вход продержится до перезагрузки
    }
  },
};

/** Ошибка бэкенда: { error: { code, message, retryable } }. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string | undefined;
  readonly retryable: boolean;

  constructor(status: number, code: string | undefined, message: string, retryable: boolean) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.retryable = retryable;
  }
}

export const AUTH_EXPIRED_EVENT = "edoplan:auth-expired";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = tokenStore.get();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });

  if (!res.ok) {
    let code: string | undefined;
    let message = `HTTP ${res.status}`;
    let retryable = false;
    try {
      const body = await res.json();
      if (body?.error) {
        code = body.error.code;
        message = body.error.message ?? message;
        retryable = Boolean(body.error.retryable);
      }
    } catch {
      // тело не JSON — оставляем значения по умолчанию
    }
    if (res.status === 401 && token) {
      tokenStore.set(null);
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }
    throw new ApiError(res.status, code, message, retryable);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

const json = (method: string, body?: unknown): RequestInit => ({
  method,
  body: body === undefined ? undefined : JSON.stringify(body),
});

const enc = encodeURIComponent;

function recipeQuery(f: RecipeFilter): string {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.diet) p.set("diet", f.diet);
  if (f.meal_type) p.set("meal_type", f.meal_type);
  if (f.category) p.set("category", f.category);
  if (f.max_time) p.set("max_time", String(f.max_time));
  f.ingredient?.filter(Boolean).forEach((i) => p.append("ingredient", i));
  if (f.favorite) p.set("favorite", "true");
  if (f.sort) p.set("sort", f.sort);
  p.set("limit", String(f.limit ?? 200));
  if (f.offset) p.set("offset", String(f.offset));
  return p.toString();
}

export const api = {
  /* ---------- Вход ---------- */
  register: (body: { name: string; email: string; password: string }) =>
    request<AuthResponse>("/api/auth/register", json("POST", body)),
  login: (body: { email: string; password: string }) =>
    request<AuthResponse>("/api/auth/login", json("POST", body)),
  forgotPassword: (email: string) =>
    request<{ message: string; reset_token: string | null }>(
      "/api/auth/forgot-password",
      json("POST", { email }),
    ),
  resetPassword: (token: string, newPassword: string) =>
    request<{ message: string }>(
      "/api/auth/reset-password",
      json("POST", { token, new_password: newPassword }),
    ),
  me: () => request<User>("/api/auth/me"),
  updateProfile: (body: {
    name?: string;
    email?: string;
    current_password?: string;
    new_password?: string;
  }) => request<AuthResponse>("/api/auth/me", json("PATCH", body)),

  /* ---------- Каталог ---------- */
  listRecipes: (filter: RecipeFilter = {}) =>
    request<RecipeList>(`/api/recipes?${recipeQuery(filter)}`),
  getRecipe: (id: string) => request<Recipe>(`/api/recipes/${enc(id)}`),
  listCategories: () => request<Category[]>("/api/categories"),
  listIngredientNames: () => request<string[]>("/api/ingredients"),
  addFavorite: (recipeId: string) =>
    request<void>(`/api/favorites/${enc(recipeId)}`, { method: "PUT" }),
  removeFavorite: (recipeId: string) =>
    request<void>(`/api/favorites/${enc(recipeId)}`, { method: "DELETE" }),

  /* ---------- Планы ---------- */
  generateMealPlan: (req: GenerateRequest) =>
    request<MealPlan>("/api/meal-plans/generate", json("POST", req)),
  listPlans: () => request<PlanSummary[]>("/api/meal-plans"),
  getMealPlan: (id: string) => request<MealPlan>(`/api/meal-plans/${enc(id)}`),
  updatePlan: (id: string, body: { title?: string; saved?: boolean }) =>
    request<MealPlan>(`/api/meal-plans/${enc(id)}`, json("PATCH", body)),
  deletePlan: (id: string) =>
    request<void>(`/api/meal-plans/${enc(id)}`, { method: "DELETE" }),
  addMeal: (
    planId: string,
    body: { day: string; meal_type: string; recipe_id: number; servings?: number },
  ) => request<MealPlan>(`/api/meal-plans/${enc(planId)}/meals`, json("POST", body)),
  removeMeal: (planId: string, mealId: string) =>
    request<MealPlan>(`/api/meal-plans/${enc(planId)}/meals/${enc(mealId)}`, {
      method: "DELETE",
    }),
  updateServings: (planId: string, mealId: string, servings: number) =>
    request<MealPlan>(
      `/api/meal-plans/${enc(planId)}/meals/${enc(mealId)}`,
      json("PATCH", { servings }),
    ),
  replaceMeal: (planId: string, mealId: string, newRecipeId?: string) =>
    request<ReplaceMealResponse>(
      `/api/meal-plans/${enc(planId)}/replace-meal`,
      json("POST", { meal_id: mealId, new_recipe_id: newRecipeId }),
    ),

  /* ---------- Список покупок ---------- */
  getGroceryList: (planId: string) =>
    request<GroceryList>(`/api/meal-plans/${enc(planId)}/grocery-list`),
  updateGroceryItem: (
    itemId: string,
    body: { is_bought?: boolean; package_count?: number; needed_quantity?: number; price?: number },
  ) => request<GroceryItem>(`/api/grocery-items/${enc(itemId)}`, json("PATCH", body)),
  deleteGroceryItem: (itemId: string) =>
    request<void>(`/api/grocery-items/${enc(itemId)}`, { method: "DELETE" }),
  addGroceryItem: (
    planId: string,
    body: { product_name: string; needed_quantity: number; needed_unit: string; price?: number },
  ) =>
    request<GroceryItem>(`/api/meal-plans/${enc(planId)}/grocery-items`, json("POST", body)),
  groceryAlternatives: (itemId: string) =>
    request<ProductOption[]>(`/api/grocery-items/${enc(itemId)}/alternatives`),
  replaceProduct: (itemId: string, option: ProductOption) =>
    request<GroceryItem>(
      `/api/grocery-items/${enc(itemId)}/replace-product`,
      json("POST", option),
    ),
  checkAvailability: (planId: string) =>
    request<AvailabilityResult>(
      `/api/meal-plans/${enc(planId)}/check-availability`,
      { method: "POST" },
    ),

  /* ---------- Заказы ---------- */
  createOrder: (planId: string) =>
    request<Order>(`/api/meal-plans/${enc(planId)}/order`, { method: "POST" }),
  listOrders: () => request<Order[]>("/api/orders"),
  getOrder: (id: string) => request<Order>(`/api/orders/${enc(id)}`),
  confirmOrder: (id: string) =>
    request<Order>(`/api/orders/${enc(id)}/confirm`, { method: "POST" }),
  repeatOrder: (id: string) =>
    request<Order>(`/api/orders/${enc(id)}/repeat`, { method: "POST" }),
  listOrderStatuses: () => request<OrderStatus[]>("/api/order-statuses"),

  /* ---------- Уведомления ---------- */
  listNotifications: () => request<NotificationsResponse>("/api/notifications"),
  readNotification: (id: string) =>
    request<Notification>(`/api/notifications/${enc(id)}/read`, { method: "POST" }),
  readAllNotifications: () =>
    request<void>("/api/notifications/read-all", { method: "POST" }),

  /* ---------- Админка ---------- */
  admin: {
    users: () => request<User[]>("/api/admin/users"),
    updateUser: (id: string, body: { name?: string; blocked?: boolean; role?: Role }) =>
      request<User>(`/api/admin/users/${enc(id)}`, json("PATCH", body)),

    recipes: () => request<RecipeList>("/api/recipes?limit=200&sort=id"),
    createRecipe: (body: RecipeUpsert) =>
      request<Recipe>("/api/admin/recipes", json("POST", body)),
    updateRecipe: (id: string, body: RecipeUpsert) =>
      request<Recipe>(`/api/admin/recipes/${enc(id)}`, json("PUT", body)),
    publishRecipe: (id: string, published: boolean) =>
      request<Recipe>(`/api/admin/recipes/${enc(id)}/publish`, json("PATCH", { published })),
    deleteRecipe: (id: string) =>
      request<void>(`/api/admin/recipes/${enc(id)}`, { method: "DELETE" }),

    createCategory: (body: { name: string; slug?: string; sort_order?: number }) =>
      request<Category>("/api/admin/categories", json("POST", body)),
    updateCategory: (id: string, body: { name: string; slug?: string; sort_order?: number }) =>
      request<Category>(`/api/admin/categories/${enc(id)}`, json("PUT", body)),
    deleteCategory: (id: string) =>
      request<void>(`/api/admin/categories/${enc(id)}`, { method: "DELETE" }),

    products: () => request<AdminProduct[]>("/api/admin/products"),
    createIngredient: (body: { name: string; default_unit: string; category?: string }) =>
      request<AdminProduct>("/api/admin/ingredients", json("POST", body)),
    deleteIngredient: (id: string) =>
      request<void>(`/api/admin/ingredients/${enc(id)}`, { method: "DELETE" }),
    searchProducts: (q: string) =>
      request<ProductOption[]>(`/api/admin/products/search?q=${enc(q)}`),
    setMapping: (
      ingredientId: string,
      body: {
        product_xml_id: string;
        product_name: string;
        product_url?: string | null;
        package_quantity?: number | null;
        package_unit?: string | null;
        price: number;
        sold_by_weight?: boolean;
        available?: boolean;
      },
    ) => request<AdminProduct>(`/api/admin/products/${enc(ingredientId)}`, json("PUT", body)),
    removeMapping: (ingredientId: string) =>
      request<void>(`/api/admin/products/${enc(ingredientId)}`, { method: "DELETE" }),
    autoMatch: (ingredientId: string) =>
      request<AdminProduct>(`/api/admin/products/${enc(ingredientId)}/auto-match`, {
        method: "POST",
      }),
    syncProducts: () =>
      request<{ checked: number; updated: number; unavailable: number; failed: number }>(
        "/api/admin/products/sync",
        { method: "POST" },
      ),

    orders: () => request<Order[]>("/api/admin/orders"),
    setOrderStatus: (id: string, statusCode: string) =>
      request<Order>(`/api/admin/orders/${enc(id)}/status`, json("PATCH", { status_code: statusCode })),
    createStatus: (body: {
      code: string;
      title: string;
      description?: string;
      sort_order: number;
      is_final: boolean;
    }) => request<OrderStatus>("/api/admin/order-statuses", json("POST", body)),
    updateStatus: (
      code: string,
      body: { code: string; title: string; description?: string; sort_order: number; is_final: boolean },
    ) => request<OrderStatus>(`/api/admin/order-statuses/${enc(code)}`, json("PUT", body)),
    deleteStatus: (code: string) =>
      request<void>(`/api/admin/order-statuses/${enc(code)}`, { method: "DELETE" }),
  },
};
