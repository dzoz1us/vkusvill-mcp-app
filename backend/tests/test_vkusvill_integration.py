"""Integration test for MCP-driven price enrichment."""

import httpx
import pytest

from app.integrations.vkusvill.mcp_client import VkusVillMCPClient
from app.models import GroceryItem
from app.schemas import GenerateRequest
from app.seed_runner import seed_ingredients, seed_recipes
from app.services.grocery_service import enrich_plan_prices
from app.services.meal_plan_service import generate_plan


def _mock_search_response() -> httpx.Response:
    return httpx.Response(
        200,
        json={
            "jsonrpc": "2.0",
            "id": 1,
            "result": {
                "content": [
                    {
                        "type": "text",
                        "text": (
                            '{"ok":true,"data":{"items":['
                            '{"id":1,"xml_id":1,"name":"Куриное филе",'
                            '"price":{"current":250,"currency":"RUB"},'
                            '"weight":{"value":0.5,"unit":"кг"},'
                            '"unit":"шт","url":"https://vkusvill.ru/goods/1/"},'
                            '{"id":2,"xml_id":2,"name":"Куриное филе охлаждённое",'
                            '"price":{"current":270,"currency":"RUB"},'
                            '"weight":{"value":0.6,"unit":"кг"},'
                            '"unit":"шт","url":"https://vkusvill.ru/goods/2/"}'
                            "]}}"
                        ),
                    }
                ]
            },
        },
    )


@pytest.fixture()
def seeded(db_session):
    ingredients = seed_ingredients(db_session)
    seed_recipes(db_session, ingredients)
    return db_session


@pytest.mark.asyncio
async def test_enrich_plan_prices_with_mock_mcp(seeded, monkeypatch):
    # force live MCP path
    from app.database import config as cfg

    settings = cfg.get_settings()
    monkeypatch.setattr(settings, "enable_live_mcp", True)

    # replace real transport with mock
    def handler(request: httpx.Request) -> httpx.Response:
        return _mock_search_response()

    transport = httpx.MockTransport(handler)
    client = VkusVillMCPClient(transport=transport)

    plan = generate_plan(
        seeded,
        GenerateRequest.model_validate(
            {
                "people_count": 2,
                "days": ["mon"],
                "budget": 5000,
                "preferences": [],
                "diet": "none",
                "appliances": ["stove", "oven", "blender"],
                "random_seed": 42,
            }
        ),
    )

    await enrich_plan_prices(seeded, plan, client=client)

    items = seeded.query(GroceryItem).filter_by(meal_plan_id=plan.id).all()
    matched = [i for i in items if i.match_status == "matched"]
    assert len(matched) >= 1

    # milk/chicken examples come with mock — all items are chicken-like
    for it in matched:
        assert it.product_xml_id is not None
        assert it.package_quantity is not None
        assert it.package_count is not None
        assert it.price_per_package is not None
        assert it.total_price is not None

    assert plan.cart_estimated_cost > 0
