// API base URL configuration
// Set VITE_API_BASE_URL in .env file for production
// Example: VITE_API_BASE_URL=https://api.example.com

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const API_ENDPOINTS = {
  generateMealPlan: `${API_BASE_URL}/meal-plans/generate`,
  getMealPlan: (id: string) => `${API_BASE_URL}/meal-plans/${id}`,
  getRecipe: (id: string) => `${API_BASE_URL}/recipes/${id}`,
  replaceMeal: (id: string) => `${API_BASE_URL}/meal-plans/${id}/replace-meal`,
  getGroceryList: (id: string) => `${API_BASE_URL}/meal-plans/${id}/grocery-list`,
  updateGroceryItem: (id: string) => `${API_BASE_URL}/grocery-items/${id}`,
  createVkusvillCart: (id: string) => `${API_BASE_URL}/meal-plans/${id}/vkusvill-cart`,
  refreshPrices: (id: string) => `${API_BASE_URL}/meal-plans/${id}/refresh-prices`,
} as const;
