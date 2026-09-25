"""Smoke test for /api/recipes endpoints."""

import pytest
from fastapi.testclient import TestClient

from app.database.base import get_db
from app.main import app
from app.seed_runner import seed_ingredients, seed_recipes


@pytest.fixture()
def seeded(db_session):
    ingredients = seed_ingredients(db_session)
    seed_recipes(db_session, ingredients)
    return db_session


@pytest.fixture()
def client(seeded):
    def override_get_db():
        yield seeded

    app.dependency_overrides[get_db] = override_get_db
    c = TestClient(app)
    yield c
    app.dependency_overrides.clear()


def test_list_recipes(client):
    r = client.get("/api/recipes?limit=5")
    assert r.status_code == 200
    data = r.json()
    assert data["total"] >= 20
    assert len(data["items"]) == 5
    assert "cook_time_minutes" in data["items"][0]
    assert "diet" in data["items"][0]


def test_recipe_detail(client):
    r = client.get("/api/recipes?limit=1")
    rid = r.json()["items"][0]["id"]

    r2 = client.get(f"/api/recipes/{rid}")
    assert r2.status_code == 200
    detail = r2.json()
    assert detail["id"] == rid
    assert isinstance(detail["ingredients"], list)
    assert isinstance(detail["steps"], list)
    assert isinstance(detail["appliances"], list)


def test_recipe_not_found(client):
    r = client.get("/api/recipes/999999")
    assert r.status_code == 404
    assert r.json()["error"]["code"] == "NOT_FOUND"
