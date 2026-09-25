"""Tests for the idempotent seeder."""

from app.models import Ingredient, Recipe, RecipeIngredient
from app.seed_runner import seed_ingredients, seed_recipes


def test_seed_creates_expected_recipes(db_session):
    ingredients = seed_ingredients(db_session)
    count = seed_recipes(db_session, ingredients)

    assert len(ingredients) >= 25
    assert count >= 20


def test_seed_idempotent(db_session):
    """Running the seeder twice must not create duplicates."""
    ingredients = seed_ingredients(db_session)
    seed_recipes(db_session, ingredients)
    first_count = db_session.query(Recipe).count()
    first_ing_count = db_session.query(Ingredient).count()

    # run again
    ingredients2 = seed_ingredients(db_session)
    seed_recipes(db_session, ingredients2)
    second_count = db_session.query(Recipe).count()
    second_ing_count = db_session.query(Ingredient).count()

    assert first_count == second_count
    assert first_ing_count == second_ing_count


def test_shared_ingredients_across_recipes(db_session):
    """Some ingredients must appear in multiple recipes so aggregation
    is testable end to end."""
    ingredients = seed_ingredients(db_session)
    seed_recipes(db_session, ingredients)

    chicken = (
        db_session.query(Ingredient)
        .filter_by(normalized_name="куриное филе")
        .one()
    )
    usage = (
        db_session.query(RecipeIngredient)
        .filter_by(ingredient_id=chicken.id)
        .count()
    )
    assert usage >= 3, "chicken must appear in at least 3 recipes"


def test_recipe_fields_populated(db_session):
    ingredients = seed_ingredients(db_session)
    seed_recipes(db_session, ingredients)

    recipe = (
        db_session.query(Recipe)
        .filter_by(name="Овсянка с ягодами и мёдом")
        .one()
    )
    assert recipe.cook_time_minutes == 10
    assert recipe.servings == 2
    assert recipe.diet == "vegetarian"
    assert len(recipe.ingredients) == 4
    assert len(recipe.tags) >= 1
    assert recipe.steps is not None