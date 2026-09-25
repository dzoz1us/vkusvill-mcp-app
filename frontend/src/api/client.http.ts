/**
 * Real HTTP client for the VkusPlan backend.
 *
 * Endpoints:
 *   POST   /api/meal-plans/generate
 *   GET    /api/meal-plans/{id}
 *   GET    /api/recipes/{id}
 *   POST   /api/meal-plans/{id}/replace-meal
 *   GET    /api/meal-plans/{id}/grocery-list
 *   PATCH  /api/grocery-items/{id}
 *   POST   /api/meal-plans/{id}/vkusvill-cart
 *   POST   /api/meal-plans/{id}/refresh-prices
 */

import type {
  CartResponse,
  GenerateRequest,
  GroceryList,
  MealPlan,
  Recipe,
  ReplaceMealResponse,
} from '../types';

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

/**
 * Error thrown for any non-2xx response from the backend.
 * Matches backend's ErrorResponse envelope: { error: { code, message, retryable } }.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string | undefined;
  readonly retryable: boolean;

  constructor(status: number, code: string | undefined, message: string, retryable: boolean) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.retryable = retryable;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${API_URL}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
    ...init,
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
      // non-JSON error body, keep defaults
    }
    throw new ApiError(res.status, code, message, retryable);
  }

  // 204 No Content support
  if (res.status === 204) return undefined as T;

  return (await res.json()) as T;
}

export const api = {
  generateMealPlan(req: GenerateRequest): Promise<MealPlan> {
    return request<MealPlan>('/api/meal-plans/generate', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },

  getMealPlan(id: string): Promise<MealPlan> {
    return request<MealPlan>(`/api/meal-plans/${encodeURIComponent(id)}`);
  },

  getRecipe(id: string): Promise<Recipe> {
    return request<Recipe>(`/api/recipes/${encodeURIComponent(id)}`);
  },

  replaceMeal(planId: string, dayMealId: string): Promise<ReplaceMealResponse> {
    // The backend identifies the slot by MealPlanMeal.id.
    return request<ReplaceMealResponse>(
      `/api/meal-plans/${encodeURIComponent(planId)}/replace-meal`,
      {
        method: 'POST',
        body: JSON.stringify({ meal_id: dayMealId }),
      },
    );
  },

  getGroceryList(planId: string): Promise<GroceryList> {
    return request<GroceryList>(
      `/api/meal-plans/${encodeURIComponent(planId)}/grocery-list`,
    );
  },

  updateGroceryItem(itemId: string, isBought: boolean): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(
      `/api/grocery-items/${encodeURIComponent(itemId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ is_bought: isBought }),
      },
    );
  },

  createVkusvillCart(planId: string): Promise<CartResponse> {
    return request<CartResponse>(
      `/api/meal-plans/${encodeURIComponent(planId)}/vkusvill-cart`,
      { method: 'POST' },
    );
  },

  refreshPrices(planId: string): Promise<{ cost_changed: boolean; new_cost: number }> {
    return request<{ cost_changed: boolean; new_cost: number }>(
      `/api/meal-plans/${encodeURIComponent(planId)}/refresh-prices`,
      { method: 'POST' },
    );
  },
};