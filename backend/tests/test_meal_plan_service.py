"""Tests for MealPlanService."""

import pytest

from app.models import Recipe
from app.schemas import GenerateRequest
from app.seed_runner import seed_ingredients, seed_recipes
from app.services.meal_plan_service import (
    MEALS_PER_DAY,
    NoSuitableRecipesError,
    generate_plan,
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
    }
    defaults.update(kwargs)
    return GenerateRequest.model_validate(defaults)


def test_generate_creates_three_meals_per_day(seeded):
    plan = generate_plan(seeded, _req(days=["mon", "tue", "wed"]))
    assert len(plan.meals) == 3 * MEALS_PER_DAY
    per_day = {}
    for m in plan.meals:
        per_day.setdefault(m.day, set()).add(m.meal_type)
    assert per_day["mon"] == {"breakfast", "lunch", "dinner"}
    assert per_day["tue"] == {"breakfast", "lunch", "dinner"}
    assert per_day["wed"] == {"breakfast", "lunch", "dinner"}


def test_vegetarian_excludes_meat_recipes(seeded):
    plan = generate_plan(
        seeded,
        _req(days=["mon", "tue", "wed", "thu"], diet="vegetarian"),
    )
    recipe_ids = {m.recipe_id for m in plan.meals}
    for rid in recipe_ids:
        recipe = seeded.get(Recipe, rid)
        assert recipe.diet in {"vegetarian", "vegan"}


def test_appliances_filter(seeded):
    """No oven available -> recipes requiring oven must be excluded."""
    plan = generate_plan(
        seeded,
        _req(
            days=["mon", "tue", "wed", "thu"],
            appliances=["stove", "blender"],
        ),
    )
    for m in plan.meals:
        recipe = seeded.get(Recipe, m.recipe_id)
        required = {app.appliance for app in recipe.appliances}
        assert "oven" not in required


def test_no_suitable_recipes_raises(seeded):
    with pytest.raises(NoSuitableRecipesError):
        generate_plan(
            seeded,
            _req(days=["mon"], appliances=[]),  # no appliances at all
        )


def test_random_seed_is_reproducible(seeded):
    a = generate_plan(seeded, _req(days=["mon", "tue"], random_seed=42))
    b = generate_plan(seeded, _req(days=["mon", "tue"], random_seed=42))

    slots_a = sorted((m.day, m.meal_type, m.recipe_id) for m in a.meals)
    slots_b = sorted((m.day, m.meal_type, m.recipe_id) for m in b.meals)
    assert slots_a == slots_b


def test_different_seed_can_produce_different_plan(seeded):
    a = generate_plan(seeded, _req(days=["mon", "tue"], random_seed=1))
    b = generate_plan(seeded, _req(days=["mon", "tue"], random_seed=999))
    slots_a = [(m.day, m.meal_type, m.recipe_id) for m in a.meals]
    slots_b = [(m.day, m.meal_type, m.recipe_id) for m in b.meals]
    # With 25+ recipes and 6 slots, different seeds will practically always differ.
    assert slots_a != slots_b


def test_breakfast_slot_uses_breakfast_recipes(seeded):
    """Recipes assigned to breakfast must have meal_type breakfast or any."""
    plan = generate_plan(seeded, _req(days=["mon", "tue", "wed"]))
    for meal in plan.meals:
        if meal.meal_type == "breakfast":
            recipe = seeded.get(Recipe, meal.recipe_id)
            assert recipe.meal_type in (
                None,
                "any",
                "breakfast",
            ), f"breakfast slot got recipe {recipe.name!r} with meal_type={recipe.meal_type!r}"


def test_dinner_slot_uses_dinner_recipes(seeded):
    plan = generate_plan(seeded, _req(days=["mon", "tue", "wed"]))
    for meal in plan.meals:
        if meal.meal_type == "dinner":
            recipe = seeded.get(Recipe, meal.recipe_id)
            assert recipe.meal_type in (None, "any", "dinner")
