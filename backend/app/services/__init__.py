"""Calculation services.

Business logic lives here, not in FastAPI routes or React components.
"""
from app.services.meal_plan_service import (
    MEALS_PER_DAY,
    MEAL_TYPE_ORDER,
    NoSuitableRecipesError,
    generate_plan,
)

from app.services.grocery_service import (
    AggregatedIngredient,
    RecipeIngredientInput,
    RecipeInput,
    aggregate_ingredients,
)
from app.services.quantity_service import (
    CanonicalQuantity,
    UnknownUnitError,
    add_canonical,
    scale_quantity,
    to_canonical,
)

__all__ = [
    "AggregatedIngredient",
    "CanonicalQuantity",
    "RecipeIngredientInput",
    "RecipeInput",
    "UnknownUnitError",
    "add_canonical",
    "aggregate_ingredients",
    "scale_quantity",
    "to_canonical",
    "MEALS_PER_DAY",
    "MEAL_TYPE_ORDER",
    "NoSuitableRecipesError",
    "generate_plan",
]