"""Tests for the replace-meal flow."""

import pytest

from app.models import GroceryItem, MealPlanMeal, Recipe
from app.schemas import GenerateRequest
from app.seed_runner import seed_ingredients, seed_recipes
from app.services.meal_plan_service import (
    MealNotFoundError,
    NoAlternativeRecipeError,
    generate_plan,
    replace_meal,
)


@pytest.fixture()
def seeded(db_session):
    ingredients = seed_ingredients(db_session)
    seed_recipes(db_session, ingredients)
    return db_session


def _req(**kwargs) -> GenerateRequest:
    defaults = {
        "people_count": 2,
        "days": ["mon", "tue"],
        "budget": 5000,
        "preferences": [],
        "diet": "none",
        "appliances": ["stove", "oven", "blender"],
        "random_seed": 42,
    }
    defaults.update(kwargs)
    return GenerateRequest.model_validate(defaults)


@pytest.mark.asyncio
async def test_replace_meal_changes_recipe_and_rebuilds_grocery(seeded):
    plan = generate_plan(seeded, _req(days=["mon"]))
    meal = plan.meals[0]
    old_recipe_id = meal.recipe_id

    _, new_recipe = await replace_meal(seeded, plan, meal_id=meal.id)

    assert new_recipe.id != old_recipe_id
    assert new_recipe.meal_type in (None, "any", meal.meal_type)

    # plan still has all meals
    meals = seeded.query(MealPlanMeal).filter_by(meal_plan_id=plan.id).all()
    assert len(meals) == 3

    # grocery items rebuilt for the new set of meals
    new_items = seeded.query(GroceryItem).filter_by(meal_plan_id=plan.id).all()
    assert len(new_items) > 0
    # every item must belong to this plan
    assert all(i.meal_plan_id == plan.id for i in new_items)
    # no orphaned items in the whole table
    total = seeded.query(GroceryItem).count()
    assert total == len(new_items)


@pytest.mark.asyncio
async def test_replace_meal_with_explicit_recipe(seeded):
    plan = generate_plan(seeded, _req(days=["mon"]))
    meal = plan.meals[0]
    other = (
        seeded.query(Recipe)
        .filter(Recipe.id != meal.recipe_id)
        .filter(Recipe.meal_type.in_((meal.meal_type, "any")))
        .first()
    )
    assert other is not None

    _, chosen = await replace_meal(seeded, plan, meal_id=meal.id, new_recipe_id=other.id)
    assert chosen.id == other.id


@pytest.mark.asyncio
async def test_replace_meal_rejects_recipe_for_another_slot(seeded):
    plan = generate_plan(seeded, _req(days=["mon"]))
    breakfast = next(meal for meal in plan.meals if meal.meal_type == "breakfast")
    dinner = seeded.query(Recipe).filter(Recipe.meal_type == "dinner").first()
    assert dinner is not None

    with pytest.raises(NoAlternativeRecipeError):
        await replace_meal(
            seeded,
            plan,
            meal_id=breakfast.id,
            new_recipe_id=dinner.id,
        )


@pytest.mark.asyncio
async def test_replace_meal_meal_not_in_plan(seeded):
    plan = generate_plan(seeded, _req(days=["mon"]))
    with pytest.raises(MealNotFoundError):
        await replace_meal(seeded, plan, meal_id=999999)


@pytest.mark.asyncio
async def test_replace_meal_no_alternative(seeded):
    """If the only matching recipe is the current one, we must raise."""
    plan = generate_plan(
        seeded,
        _req(days=["mon"], diet="vegan", appliances=["stove", "oven", "blender"]),
    )
    meal = plan.meals[0]

    # Force all other recipes to a non-compatible diet temporarily
    others = seeded.query(Recipe).filter(Recipe.id != meal.recipe_id).all()
    for r in others:
        r.diet = "none"
    seeded.flush()

    with pytest.raises(NoAlternativeRecipeError):
        await replace_meal(seeded, plan, meal_id=meal.id)
