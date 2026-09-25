"""Aggregate ingredients across multiple recipes.

The key rule: identical ingredients are summed ONCE across all
recipes, in canonical units. Packages are then calculated per
aggregated ingredient (see PricingService).

This module knows nothing about the database or MCP. It operates on
plain input structures so it can be unit-tested in isolation.
"""

from __future__ import annotations

from collections import OrderedDict
from dataclasses import dataclass

from app.schemas.enums import Unit
from app.services.quantity_service import scale_quantity


@dataclass(frozen=True)
class RecipeIngredientInput:
    """One ingredient as it appears in one recipe."""

    ingredient_id: int
    name: str
    quantity: float
    unit: str


@dataclass(frozen=True)
class RecipeInput:
    """A recipe passed into aggregation.

    `base_servings` is the recipe's own serving count; scaling to the
    user's `people_count` happens inside aggregate_ingredients.
    """

    recipe_id: int
    base_servings: int
    ingredients: tuple[RecipeIngredientInput, ...]


@dataclass(frozen=True)
class AggregatedIngredient:
    """Result of aggregation, per ingredient_id."""

    ingredient_id: int
    name: str
    needed_quantity: float
    unit: Unit

    def __str__(self) -> str:
        return f"{self.name}: {self.needed_quantity}{self.unit.value}"


def aggregate_ingredients(
    recipes: list[RecipeInput],
    people_count: int,
) -> list[AggregatedIngredient]:
    """Scale + sum ingredients across all recipes.

    Order of output is stable: first-seen order of ingredient_id.
    """
    if people_count <= 0:
        raise ValueError("people_count must be positive")

    totals: OrderedDict[int, dict] = OrderedDict()

    for recipe in recipes:
        for ing in recipe.ingredients:
            scaled = scale_quantity(
                recipe_quantity=ing.quantity,
                recipe_base_servings=recipe.base_servings,
                people_count=people_count,
                unit=ing.unit,
            )

            if ing.ingredient_id not in totals:
                totals[ing.ingredient_id] = {
                    "name": ing.name,
                    "value": scaled.value,
                    "unit": scaled.unit,
                }
            else:
                entry = totals[ing.ingredient_id]
                # Theoretically could mix g and ml if data is dirty;
                # surface this loudly instead of silently dropping.
                if entry["unit"] != scaled.unit:
                    raise ValueError(
                        f"Ingredient {ing.ingredient_id} mixed units: "
                        f"{entry['unit'].value} vs {scaled.unit.value}"
                    )
                entry["value"] += scaled.value

    return [
        AggregatedIngredient(
            ingredient_id=ingredient_id,
            name=data["name"],
            needed_quantity=round(data["value"], 3),
            unit=data["unit"],
        )
        for ingredient_id, data in totals.items()
    ]