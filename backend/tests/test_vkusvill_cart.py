"""Regression tests for VkusVill cart payload eligibility."""

import pytest
from fastapi.testclient import TestClient

from app.api import vkusvill
from app.database.base import get_db
from app.main import app
from app.models import GroceryItem, MealPlan


@pytest.mark.asyncio
async def test_cart_counts_items_that_cannot_be_added(db_session, monkeypatch):
    plan = MealPlan(
        people_count=1,
        budget=1000,
        days_json='["mon"]',
        preferences_json="[]",
        appliances_json="[]",
        diet="none",
        cart_estimated_cost=100,
        unresolved_items_count=0,
        status="ready",
    )
    db_session.add(plan)
    db_session.flush()
    db_session.add_all(
        [
            GroceryItem(
                meal_plan_id=plan.id,
                product_name="Молоко",
                needed_quantity=1,
                needed_unit="l",
                product_xml_id="123",
                package_count=1,
                match_status="matched",
            ),
            GroceryItem(
                meal_plan_id=plan.id,
                product_name="Своя позиция",
                needed_quantity=1,
                needed_unit="шт",
                match_status="matched",
                is_manual=True,
            ),
        ]
    )
    db_session.commit()

    async def no_enrichment(db, loaded_plan):
        return 0

    class FakeClient:
        async def cart_link_create(self, products):
            assert products == [{"xml_id": 123, "q": 1.0}]
            return {"url": "https://example.test/cart"}

    monkeypatch.setattr(vkusvill, "enrich_plan_prices", no_enrichment)
    monkeypatch.setattr(vkusvill, "VkusVillMCPClient", FakeClient)

    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    try:
        response = TestClient(app).post(f"/api/meal-plans/{plan.id}/vkusvill-cart")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["unresolved_items"] == 1
    assert response.json()["carts"][0]["items_count"] == 1
