"""Smoke tests for schemas: contracts must validate the reference payload."""

from datetime import datetime, timezone

import pytest
from pydantic import ValidationError

from app.schemas import GenerateRequest, MealPlanRead


def test_generate_request_valid_payload():
    payload = {
        "people_count": 2,
        "days": ["mon", "tue", "wed"],
        "budget": 5000,
        "preferences": ["quick", "high_protein"],
        "diet": "none",
        "appliances": ["stove", "oven"],
        "random_seed": 42,
    }
    req = GenerateRequest.model_validate(payload)
    assert req.people_count == 2
    assert len(req.days) == 3
    assert req.budget == 5000
    assert req.random_seed == 42


def test_generate_request_optional_fields_default():
    payload = {"people_count": 1, "days": ["mon"], "budget": 1000}
    req = GenerateRequest.model_validate(payload)
    assert req.preferences == []
    assert req.appliances == []
    assert req.diet.value == "none"
    assert req.random_seed is None


@pytest.mark.parametrize(
    "payload",
    [
        {"people_count": 0, "days": ["mon"], "budget": 1000},
        {"people_count": 99, "days": ["mon"], "budget": 1000},
        {"people_count": 2, "days": [], "budget": 1000},
        {"people_count": 2, "days": ["mon"], "budget": 0},
        {"people_count": 2, "days": ["mon", "mon"], "budget": 1000},
        {"people_count": 2, "days": ["mon"], "budget": 1000, "diet": "keto"},
        {"people_count": 2, "days": ["funday"], "budget": 1000},
        {"people_count": 2, "days": ["mon"], "budget": 1000, "appliances": ["grill"]},
        {
            "people_count": 2,
            "days": ["mon"],
            "budget": 1000,
            "preferences": ["quick", "quick"],
        },
    ],
)
def test_generate_request_invalid_payloads(payload):
    with pytest.raises(ValidationError):
        GenerateRequest.model_validate(payload)


def test_meal_plan_response_shape():
    """Matches frontend/src/types/index.ts MealPlan."""
    payload = {
        "id": "21",
        "created_at": datetime.now(timezone.utc),
        "params": {
            "people_count": 2,
            "days": ["mon", "tue"],
            "budget": 5000,
            "preferences": ["quick"],
            "diet": "none",
            "appliances": ["stove"],
        },
        "meals": [
            {
                "id": "1",
                "day": "mon",
                "meal_type": "breakfast",
                "recipe": {
                    "id": "12",
                    "name": "Овсянка",
                    "cook_time_minutes": 10,
                    "servings": 2,
                    "diet": "none",
                },
            },
            {
                "id": "2",
                "day": "mon",
                "meal_type": "lunch",
                "recipe": {
                    "id": "13",
                    "name": "Курица с рисом",
                    "cook_time_minutes": 35,
                    "servings": 2,
                    "diet": "none",
                },
            },
        ],
        "cart_estimated_cost": 4682,
        "budget": 5000,
        "unresolved_items_count": 1,
        "status": "ready",
    }
    resp = MealPlanRead.model_validate(payload)
    assert resp.id == "21"
    assert len(resp.meals) == 2
    assert resp.meals[0].day.value == "mon"
    assert resp.meals[0].meal_type.value == "breakfast"
    assert resp.status.value == "ready"


def test_coerce_int_id_to_str():
    """ORM id is int; API must expose it as string for the frontend."""
    payload = {
        "id": 42,  # int on purpose
        "created_at": datetime.now(timezone.utc),
        "params": {
            "people_count": 1,
            "days": ["mon"],
            "budget": 1000,
            "preferences": [],
            "diet": "none",
            "appliances": [],
        },
        "meals": [],
        "cart_estimated_cost": 0,
        "budget": 1000,
        "unresolved_items_count": 0,
        "status": "generating",
    }
    resp = MealPlanRead.model_validate(payload)
    assert resp.id == "42"
    assert isinstance(resp.id, str)