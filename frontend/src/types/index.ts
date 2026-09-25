// Core types synchronized with backend Pydantic models

export type DietType = 'none' | 'vegetarian' | 'vegan' | 'pescatarian';

export type PreferenceTag = 'quick' | 'low_calorie' | 'family' | 'healthy' | 'high_protein' | 'budget' | 'hearty';

export type ApplianceType = 'stove' | 'oven' | 'microwave' | 'multicooker' | 'air_fryer' | 'blender';

export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export type NetworkState = 'idle' | 'loading' | 'success' | 'empty' | 'error';

export type MatchStatus = 'matched' | 'requires_review' | 'not_found';

export interface OnboardingParams {
  people_count: number;
  days: DayOfWeek[];
  budget: number;
  preferences: PreferenceTag[];
  diet: DietType;
  appliances: ApplianceType[];
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

export interface Recipe {
  id: string;
  name: string;
  image_url: string;
  cook_time_minutes: number;
  servings: number;
  nutrition?: NutritionInfo;
  ingredients: Ingredient[];
  steps: string[];
}

export interface DayMeal {
  id: string;
  day: DayOfWeek;
  meal_type: 'breakfast' | 'lunch' | 'dinner';
  recipe: Recipe;
}

export interface MealPlan {
  id: string;
  created_at: string;
  params: OnboardingParams;
  meals: DayMeal[];
  cart_estimated_cost: number;
  budget: number;
  unresolved_items_count: number;
  status: 'generating' | 'ready' | 'error';
}

export interface GroceryItem {
  id: string;
  product_name: string;
  needed_quantity: number;
  needed_unit: string;
  package_quantity: number;
  package_count: number;
  price_per_package: number;
  match_status: MatchStatus;
  is_bought: boolean;
  ingredient_id: string;
}

export interface GroceryList {
  items: GroceryItem[];
  total_cost: number;
  matched_count: number;
  review_count: number;
  not_found_count: number;
}

export interface CartLink {
  cart_url: string;
  items_count: number;
}

export interface CartResponse {
  carts: CartLink[];
  price_changed: boolean;
  unresolved_items: number;
}

export interface ReplaceMealResponse {
  plan: MealPlan;
  replaced_recipe: Recipe;
}

export interface GenerateRequest {
  people_count: number;
  days: DayOfWeek[];
  budget: number;
  preferences: PreferenceTag[];
  diet: DietType;
  appliances: ApplianceType[];
}
