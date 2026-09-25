"""Smoke test: models can be created and queried."""

from app.models import Ingredient, Recipe, RecipeIngredient, RecipeTag


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
        base_servings=2,
        cooking_time=30,
        diet="none",
    )
    recipe.ingredients.append(
        RecipeIngredient(ingredient_id=ing.id, quantity=300, unit="g")
    )
    recipe.tags.append(RecipeTag(tag="quick"))
    db_session.add(recipe)
    db_session.commit()

    loaded = db_session.query(Recipe).filter_by(name="Курица с рисом").one()
    assert loaded.base_servings == 2
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
    assert raised, "duplicate normalized_name must be rejected"