"""Integration tests for grocery list building from a plan."""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models import GroceryItem, MealPlan
from app.schemas import GenerateRequest
from app.seed_runner import seed_ingredients, seed_recipes
from app.services.meal_plan_service import generate_plan


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


def test_generate_creates_grocery_items(seeded):
    plan = generate_plan(seeded, _req(days=["mon"]))
    items = seeded.query(GroceryItem).filter_by(meal_plan_id=plan.id).all()
    assert len(items) > 0
    for i in items:
        assert i.needed_quantity > 0
        assert i.needed_unit in {"g", "ml", "pcs"}
        assert i.match_status == "not_found"
        assert i.is_bought is False


def test_grocery_items_aggregated_not_per_recipe(seeded):
    """Same ingredient across meals -> single GroceryItem."""
    plan = generate_plan(seeded, _req(days=["mon", "tue", "wed", "thu"]))
    items = seeded.query(GroceryItem).filter_by(meal_plan_id=plan.id).all()
    ing_ids = [i.ingredient_id for i in items]
    assert len(ing_ids) == len(set(ing_ids)), "duplicate ingredient_ids"


def test_plan_meal_plan_id_consistency(seeded):
    plan = generate_plan(seeded, _req(days=["mon"]))
    count = seeded.query(GroceryItem).filter_by(meal_plan_id=plan.id).count()
    assert count == plan.unresolved_items_count


def test_get_grocery_list_endpoint(seeded, monkeypatch):
    # swap production db for test db
    from app.database import base as db_base

    plan = generate_plan(seeded, _req(days=["mon"]))

    def override_get_db():
        yield seeded

    app.dependency_overrides[db_base.get_db] = override_get_db
    client = TestClient(app)

    r = client.get(f"/api/meal-plans/{plan.id}/grocery-list")
    assert r.status_code == 200
    body = r.json()
    assert body["total_cost"] == 0
    assert body["not_found_count"] == body["matched_count"] + body["review_count"] + body["not_found_count"]
    assert len(body["items"]) == plan.unresolved_items_count

    app.dependency_overrides.clear()