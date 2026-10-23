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

from sqlalchemy.orm import Session

from app.integrations.vkusvill.mcp_client import VkusVillMCPClient  # noqa: E402
from app.models import (
    GroceryItem,
    Ingredient,  # noqa: E402
    MealPlan,
    MealPlanMeal,
)
from app.schemas.enums import Unit
from app.services.pricing_service import packages_for, total_price  # noqa: E402
from app.services.quantity_service import scale_quantity, to_canonical
from app.services.vkusvill_service import match_ingredient  # noqa: E402


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
    meals = db.query(MealPlanMeal).filter_by(meal_plan_id=plan.id).all()
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
                name=(db.get(Ingredient, ri.ingredient_id).name if ri.ingredient_id else ""),
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


async def enrich_plan_prices(
    db: Session,
    plan: MealPlan,
    client: VkusVillMCPClient | None = None,
) -> int:
    """For every unresolved/unknown item in the plan, run MCP matching.

    Updates GroceryItem rows in place:
      - product_xml_id, product_name, product_url
      - package_quantity, package_unit, package_count
      - price_per_package, total_price
      - match_status

    Returns count of items updated (i.e. where we found a product).
    """
    items = db.query(GroceryItem).filter_by(meal_plan_id=plan.id).all()
    if not items:
        return 0

    updated = 0
    total = 0.0

    for item in items:
        if item.ingredient_id is None:
            # manual item — leave as is, but include its price in the total
            total += item.total_price or 0.0
            continue

        ingredient = db.get(Ingredient, item.ingredient_id)
        if ingredient is None:
            continue

        result = await match_ingredient(db, ingredient, client=client)

        item.match_status = result.status
        if result.candidate is None:
            # keep whatever package/price we had (likely None)
            continue

        item.product_xml_id = result.candidate.xml_id
        item.product_name = result.candidate.name
        item.product_url = result.candidate.url

        item.package_quantity = result.candidate.package_quantity
        item.package_unit = result.candidate.package_unit

        packages = packages_for(
            needed_quantity=item.needed_quantity,
            needed_unit=item.needed_unit,
            package_quantity=result.candidate.package_quantity,
            package_unit=result.candidate.package_unit,
        )
        item.package_count = packages

        if packages is not None and result.candidate.price is not None:
            item.price_per_package = result.candidate.price
            item.total_price = total_price(packages, result.candidate.price)
            total += item.total_price
            updated += 1
        else:
            # matched by search but not usable: incompatible units or no price.
            # Downgrade so UI never promises a product that won't reach the cart.
            item.match_status = "requires_review"
            item.package_count = None
            item.price_per_package = None
            item.total_price = None

    plan.cart_estimated_cost = round(total, 2)
    plan.unresolved_items_count = (
        db.query(GroceryItem)
        .filter_by(meal_plan_id=plan.id)
        .filter(GroceryItem.match_status != "matched")
        .count()
    )
    db.commit()
    db.refresh(plan)
    return updated
