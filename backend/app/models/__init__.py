"""Re-export all ORM models so `from app import models` registers them."""

from app.models.grocery import GroceryItem
from app.models.ingredient import Ingredient
from app.models.meal_plan import MealPlan, MealPlanDay
from app.models.product import MCPProductCache, ProductMapping
from app.models.recipe import Recipe, RecipeEquipment, RecipeIngredient, RecipeTag

__all__ = [
    "GroceryItem",
    "Ingredient",
    "MealPlan",
    "MealPlanDay",
    "MCPProductCache",
    "ProductMapping",
    "Recipe",
    "RecipeEquipment",
    "RecipeIngredient",
    "RecipeTag",
]