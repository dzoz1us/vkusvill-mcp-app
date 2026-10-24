// Типы синхронизированы с Java-бэкендом (JSON в snake_case).

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

export type Role = "CLIENT" | "ADMIN";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  blocked: boolean;
  created_at: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface OnboardingParams {
  people_count: number;
  days: DayOfWeek[];
  budget: number;
  preferences: PreferenceTag[];
  diet: DietType;
  appliances: ApplianceType[];
}

export type GenerateRequest = OnboardingParams;

export interface NutritionInfo {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  available?: boolean;
}

export interface RecipeShort {
  id: string;
  name: string;
  image_url: string | null;
  cook_time_minutes: number;
  servings: number;
  nutrition: NutritionInfo | null;
  diet: DietType;
  description?: string | null;
  meal_type?: string | null;
  categories?: Category[];
  tags?: string[];
  is_favorite?: boolean;
  purchasable?: boolean | null;
  published?: boolean;
}

export interface Recipe extends RecipeShort {
  appliances: ApplianceType[];
  ingredients: Ingredient[];
  steps: string[];
}

export interface RecipeList {
  items: RecipeShort[];
  total: number;
  limit: number;
  offset: number;
}

export interface RecipeFilter {
  q?: string;
  diet?: string;
  meal_type?: string;
  category?: string;
  max_time?: number;
  ingredient?: string[];
  favorite?: boolean;
  sort?: "name" | "time" | "calories";
  limit?: number;
  offset?: number;
}

export interface DayMeal {
  id: string;
  day: DayOfWeek;
  meal_type: MealType;
  recipe: RecipeShort;
  servings?: number | null;
}

export interface MealPlan {
  id: string;
  title?: string | null;
  saved?: boolean;
  created_at: number | string;
  params: OnboardingParams;
  meals: DayMeal[];
  cart_estimated_cost: number;
  budget: number;
  unresolved_items_count: number;
  omitted_meals?: number;
  status: string;
}

export interface PlanSummary {
  id: string;
  title: string | null;
  saved: boolean;
  created_at: number;
  people_count: number;
  budget: number;
  cart_estimated_cost: number;
  meals_count: number;
  days: DayOfWeek[];
}

export interface GroceryItem {
  id: string;
  ingredient_id: string | null;
  product_name: string;
  needed_quantity: number;
  needed_unit: string;
  product_url?: string | null;
  product_xml_id?: string | null;
  package_quantity: number | null;
  package_unit: string | null;
  package_count: number | null;
  price_per_package: number | null;
  total_price: number | null;
  match_status: MatchStatus;
  is_bought: boolean;
  is_manual?: boolean;
  sold_by_weight?: boolean;
  cart_quantity?: number | null;
}

export interface GroceryList {
  items: GroceryItem[];
  total_cost: number;
  matched_count: number;
  review_count: number;
  not_found_count: number;
}

export interface ProductOption {
  xml_id: string;
  name: string;
  url: string | null;
  price: number | null;
  package_quantity: number | null;
  package_unit: string | null;
  sold_by_weight: boolean;
}

export interface AvailabilityResult {
  checked: number;
  price_changed: number;
  replaced: number;
  unavailable: number;
  unchecked: number;
  cart_estimated_cost: number;
  unresolved_items: number;
}

export interface OrderItem {
  product_xml_id: string;
  product_name: string;
  product_url: string | null;
  package_count: number;
  cart_quantity: number;
  sold_by_weight: boolean;
  price_per_package: number | null;
  total_price: number | null;
}

export interface Order {
  id: string;
  plan_id: string | null;
  plan_title: string | null;
  status_code: string;
  status_title: string;
  status_description: string | null;
  status_final: boolean;
  cart_url: string | null;
  items_count: number;
  total_cost: number;
  repeated_from_id: string | null;
  created_at: number;
  updated_at: number;
  user_id?: string;
  user_email?: string;
  items: OrderItem[];
}

export interface OrderStatus {
  code: string;
  title: string;
  description: string | null;
  sort_order: number;
  is_final: boolean;
}

export interface Notification {
  id: string;
  order_id: string | null;
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: number;
}

export interface NotificationsResponse {
  items: Notification[];
  unread: number;
}

export interface ReplaceMealResponse {
  plan: MealPlan;
  replaced_recipe: RecipeShort;
}

/* ---------- Админка ---------- */

export interface AdminProduct {
  ingredient_id: string;
  ingredient_name: string;
  ingredient_category: string | null;
  default_unit: string;
  mapped: boolean;
  product_xml_id: string | null;
  product_name: string | null;
  product_url: string | null;
  package_quantity: number | null;
  package_unit: string | null;
  price: number | null;
  sold_by_weight: boolean | null;
  piece_weight_g: number | null;
  available: boolean | null;
}

export interface RecipeUpsert {
  name: string;
  description: string;
  meal_type: string;
  servings: number;
  cook_time_minutes: number;
  calories: number | null;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
  diet: DietType;
  tags: string[];
  appliances: ApplianceType[];
  category_ids: number[];
  published: boolean;
  steps: string[];
  ingredients: { ingredient_id: number; quantity: number; unit: string }[];
}
