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

from sqlalchemy.orm import Session
from app.models import GroceryItem, MealPlan, MealPlanMeal
from app.services.quantity_service import to_canonical



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

def _recipe_input_from_orm(recipe) -> RecipeInput:
    """Convert an ORM Recipe into the plain RecipeInput used by aggregation."""
    ingredients = tuple(
        RecipeIngredientInput(
            ingredient_id=ri.ingredient_id,
            name=ri.recipe and ri.ingredient.name or "",
            quantity=ri.quantity,
            unit=ri.unit,
        )
        for ri in recipe.ingredients
    )
    return RecipeInput(
        recipe_id=recipe.id,
        base_servings=recipe.servings,
        ingredients=ingredients,
    )


def build_grocery_items(db: Session, plan: MealPlan) -> list[GroceryItem]:
    """(Re)build GroceryItems for a plan.

    Idempotent: deletes existing items for the plan and inserts fresh ones.
    Called from MealPlanService.generate_plan and later from replace-meal.
    """
    # wipe existing items for this plan
    db.query(GroceryItem).filter_by(meal_plan_id=plan.id).delete()
    db.flush()

    # collect recipes of the plan
    meals = (
        db.query(MealPlanMeal).filter_by(meal_plan_id=plan.id).all()
    )
    if not meals:
        return []

    recipe_inputs: list[RecipeInput] = []
    for meal in meals:
        recipe = meal.recipe
        # name of the ingredient is on ri.ingredient; join via Ingredient
        from app.models import Ingredient

        ri_tuple = tuple(
            RecipeIngredientInput(
                ingredient_id=ri.ingredient_id,
                name=(
                    db.get(Ingredient, ri.ingredient_id).name
                    if ri.ingredient_id
                    else ""
                ),
                quantity=ri.quantity,
                unit=ri.unit,
            )
            for ri in recipe.ingredients
        )
        recipe_inputs.append(
            RecipeInput(
                recipe_id=recipe.id,
                base_servings=recipe.servings,
                ingredients=ri_tuple,
            )
        )

    aggregated = aggregate_ingredients(recipe_inputs, plan.people_count)

    created: list[GroceryItem] = []
    for agg in aggregated:
        canonical = to_canonical(agg.needed_quantity, agg.unit.value)
        item = GroceryItem(
            meal_plan_id=plan.id,
            ingredient_id=agg.ingredient_id,
            product_name=agg.name,
            needed_quantity=canonical.value,
            needed_unit=canonical.unit.value,
            match_status="not_found",
            is_bought=False,
            is_manual=False,
        )
        db.add(item)
        created.append(item)

    db.flush()
    return created