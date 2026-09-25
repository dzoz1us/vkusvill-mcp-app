"""Smoke tests for ORM models."""

from app.models import Ingredient, MealPlan, MealPlanMeal, Recipe, RecipeIngredient, RecipeTag


def test_create_and_read_recipe(db_session):
    ing = Ingredient(
        name="Куриное филе",
        normalized_name="куриное филе",
        default_unit="g",
        category="meat",
    )
    db_session.add(ing)
    db_session.flush()

    recipe = Recipe(
        name="Курица с рисом",
        description="Простое блюдо",
        servings=2,
        cook_time_minutes=30,
        diet="none",
    )
    recipe.ingredients.append(
        RecipeIngredient(ingredient_id=ing.id, quantity=300, unit="g")
    )
    recipe.tags.append(RecipeTag(tag="quick"))
    db_session.add(recipe)
    db_session.commit()

    loaded = db_session.query(Recipe).filter_by(name="Курица с рисом").one()
    assert loaded.servings == 2
    assert loaded.cook_time_minutes == 30
    assert len(loaded.ingredients) == 1
    assert loaded.ingredients[0].quantity == 300
    assert loaded.tags[0].tag == "quick"


def test_ingredient_normalized_name_is_unique(db_session):
    from sqlalchemy.exc import IntegrityError

    db_session.add(
        Ingredient(name="A", normalized_name="dup", default_unit="g", category=None)
    )
    db_session.commit()

    db_session.add(
        Ingredient(name="B", normalized_name="dup", default_unit="g", category=None)
    )
    try:
        db_session.commit()
        raised = False
    except IntegrityError:
        raised = True
    assert raised


def test_meal_plan_three_meals_per_day(db_session):
    recipe = Recipe(name="R", servings=2, cook_time_minutes=20, diet="none")
    db_session.add(recipe)
    db_session.flush()

    plan = MealPlan(
        people_count=2,
        budget=5000,
        days_json='["mon"]',
        preferences_json="[]",
        appliances_json="[]",
        diet="none",
        status="ready",
    )
    db_session.add(plan)
    db_session.flush()

    for meal_type in ("breakfast", "lunch", "dinner"):
        db_session.add(
            MealPlanMeal(
                meal_plan_id=plan.id,
                day="mon",
                meal_type=meal_type,
                recipe_id=recipe.id,
            )
        )
    db_session.commit()

    loaded = db_session.query(MealPlan).one()
    assert len(loaded.meals) == 3
    assert {m.meal_type for m in loaded.meals} == {"breakfast", "lunch", "dinner"}