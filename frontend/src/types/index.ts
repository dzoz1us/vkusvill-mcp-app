// Core types synchronized with backend Pydantic models.

export type DietType = "none" | "vegetarian" | "vegan" | "pescatarian";

export type PreferenceTag =
  | "quick"
  | "low_calorie"
  | "family"
  | "healthy"
  | "high_protein"
  | "budget"
  | "hearty";

export type ApplianceType =
  "stove" | "oven" | "microwave" | "multicooker" | "air_fryer" | "blender";

export type DayOfWeek = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type MealType = "breakfast" | "lunch" | "dinner";

export type NetworkState = "idle" | "loading" | "success" | "empty" | "error";

export type MatchStatus = "matched" | "requires_review" | "not_found";

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

// Compact recipe — what comes back inside MealPlan and replace-meal.
export interface RecipeShort {
  id: string;
  name: string;
  image_url: string | null;
  cook_time_minutes: number;
  servings: number;
  nutrition: NutritionInfo | null;
  diet: DietType;
}

// Full recipe — fetched separately via GET /api/recipes/{id}.
export interface Recipe extends RecipeShort {
  appliances: ApplianceType[];
  ingredients: Ingredient[];
  steps: string[];
}

export interface DayMeal {
  id: string;
  day: DayOfWeek;
  meal_type: MealType;
  recipe: RecipeShort;
}

export interface MealPlan {
  id: string;
  created_at: string;
  params: OnboardingParams;
  meals: DayMeal[];
  cart_estimated_cost: number;
  budget: number;
  unresolved_items_count: number;
  status: "generating" | "ready" | "error";
}

export interface GroceryItem {
  id: string;
  product_name: string;
  needed_quantity: number;
  needed_unit: string;
  package_quantity: number | null;
  package_unit: string | null;
  package_count: number | null;
  total_price: number | null;
  price_per_package: number | null;
  match_status: MatchStatus;
  is_bought: boolean;
  ingredient_id: string | null;
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
  replaced_recipe: RecipeShort;
}

export interface GenerateRequest {
  people_count: number;
  days: DayOfWeek[];
  budget: number;
  preferences: PreferenceTag[];
  diet: DietType;
  appliances: ApplianceType[];
}
