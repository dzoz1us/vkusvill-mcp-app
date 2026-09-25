"""Unit tests for GroceryService aggregation."""

import pytest

from app.schemas.enums import Unit
from app.services.grocery_service import (
    RecipeIngredientInput,
    RecipeInput,
    aggregate_ingredients,
)


def _ing(ingredient_id: int, name: str, qty: float, unit: str = "g") -> RecipeIngredientInput:
    return RecipeIngredientInput(
        ingredient_id=ingredient_id, name=name, quantity=qty, unit=unit
    )


def test_aggregate_two_recipes_shared_ingredients():
    """Recipe A: tomato 200g + chicken 300g.
    Recipe B: tomato 300g + chicken 200g.
    Both recipes for 2 servings, user has 2 people.
    Expected: tomato 500g, chicken 500g.
    """
    recipe_a = RecipeInput(
        recipe_id=1,
        base_servings=2,
        ingredients=(_ing(1, "Помидор", 200), _ing(2, "Курица", 300)),
    )
    recipe_b = RecipeInput(
        recipe_id=2,
        base_servings=2,
        ingredients=(_ing(1, "Помидор", 300), _ing(2, "Курица", 200)),
    )

    result = aggregate_ingredients([recipe_a, recipe_b], people_count=2)

    by_id = {x.ingredient_id: x for x in result}
    assert by_id[1].needed_quantity == 500
    assert by_id[1].unit == Unit.G
    assert by_id[2].needed_quantity == 500
    assert by_id[2].unit == Unit.G


def test_aggregate_scales_before_summing():
    """Both recipes for 2 servings, user has 4 people -> all doubled."""
    recipe_a = RecipeInput(
        recipe_id=1, base_servings=2, ingredients=(_ing(1, "Помидор", 200),)
    )
    recipe_b = RecipeInput(
        recipe_id=2, base_servings=2, ingredients=(_ing(1, "Помидор", 300),)
    )

    result = aggregate_ingredients([recipe_a, recipe_b], people_count=4)
    assert result[0].needed_quantity == 1000  # (200 + 300) * 2


def test_aggregate_mixed_units():
    """1 kg from one recipe + 300 g from another = 1300 g total."""
    recipe_a = RecipeInput(
        recipe_id=1,
        base_servings=2,
        ingredients=(_ing(1, "Курица", 1, unit="kg"),),
    )
    recipe_b = RecipeInput(
        recipe_id=2,
        base_servings=2,
        ingredients=(_ing(1, "Курица", 300, unit="g"),),
    )

    result = aggregate_ingredients([recipe_a, recipe_b], people_count=2)
    assert result[0].needed_quantity == 1300
    assert result[0].unit == Unit.G


def test_order_is_stable():
    """Ingredients keep first-seen order."""
    recipe = RecipeInput(
        recipe_id=1,
        base_servings=2,
        ingredients=(
            _ing(5, "A", 10),
            _ing(3, "B", 20),
            _ing(9, "C", 30),
        ),
    )
    result = aggregate_ingredients([recipe], people_count=2)
    assert [x.ingredient_id for x in result] == [5, 3, 9]


def test_no_duplicates_per_ingredient():
    """Same ingredient across 3 recipes -> single aggregated row."""
    recipe_a = RecipeInput(
        recipe_id=1, base_servings=2, ingredients=(_ing(1, "X", 100),)
    )
    recipe_b = RecipeInput(
        recipe_id=2, base_servings=2, ingredients=(_ing(1, "X", 100),)
    )
    recipe_c = RecipeInput(
        recipe_id=3, base_servings=2, ingredients=(_ing(1, "X", 100),)
    )

    result = aggregate_ingredients([recipe_a, recipe_b, recipe_c], people_count=2)
    assert len(result) == 1
    assert result[0].needed_quantity == 300


def test_people_count_must_be_positive():
    with pytest.raises(ValueError):
        aggregate_ingredients([], people_count=0)