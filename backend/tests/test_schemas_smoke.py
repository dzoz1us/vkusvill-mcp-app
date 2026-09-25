"""Smoke test for schemas: contracts must validate the reference payload."""

import pytest
from pydantic import ValidationError

from app.schemas import GenerateRequest, MealPlanShort
from datetime import datetime


def test_generate_request_valid_payload():
    """Payload from the tech spec (section 7.1)."""
    payload = {
        "people_count": 2,
        "days": ["monday", "tuesday", "wednesday"],
        "budget": 5000,
        "preferences": ["quick", "high_protein"],
        "diet": "none",
        "equipment": ["stove", "oven"],
        "random_seed": 42,
    }
    req = GenerateRequest.model_validate(payload)
    assert req.people_count == 2
    assert len(req.days) == 3
    assert req.budget == 5000
    assert req.random_seed == 42


def test_generate_request_optional_fields_default():
    payload = {
        "people_count": 1,
        "days": ["monday"],
        "budget": 1000,
    }
    req = GenerateRequest.model_validate(payload)
    assert req.preferences == []
    assert req.equipment == []
    assert req.diet.value == "none"
    assert req.random_seed is None


@pytest.mark.parametrize(
    "payload",
    [
        # people_count too small
        {"people_count": 0, "days": ["monday"], "budget": 1000},
        # people_count too large
        {"people_count": 99, "days": ["monday"], "budget": 1000},
        # no days
        {"people_count": 2, "days": [], "budget": 1000},
        # budget <= 0
        {"people_count": 2, "days": ["monday"], "budget": 0},
        # duplicate days
        {"people_count": 2, "days": ["monday", "monday"], "budget": 1000},
        # unknown diet
        {"people_count": 2, "days": ["monday"], "budget": 1000, "diet": "keto"},
        # unknown day
        {"people_count": 2, "days": ["funday"], "budget": 1000},
        # unknown equipment
        {
            "people_count": 2,
            "days": ["monday"],
            "budget": 1000,
            "equipment": ["grill"],
        },
        # duplicate preferences
        {
            "people_count": 2,
            "days": ["monday"],
            "budget": 1000,
            "preferences": ["quick", "quick"],
        },
    ],
)
def test_generate_request_invalid_payloads(payload):
    with pytest.raises(ValidationError):
        GenerateRequest.model_validate(payload)


def test_meal_plan_short_response_shape():
    """Minimal contract from tech spec section 7.2."""
    payload = {
        "id": 21,
        "people_count": 2,
        "budget": 5000,
        "estimated_cost": 4682,
        "cart_estimated_cost": 4682,
        "over_budget": False,
        "status": "generated",
        "created_at": datetime.utcnow(),
        "days": [
            {
                "day": "monday",
                "recipe": {
                    "id": 12,
                    "name": "Курица с рисом",
                    "cooking_time": 35,
                    "diet": "none",
                    "tags": ["quick", "high_protein"],
                },
            }
        ],
        "grocery_items_count": 32,
        "unresolved_items_count": 1,
    }
    resp = MealPlanShort.model_validate(payload)
    assert resp.id == 21
    assert resp.days[0].day.value == "monday"
    assert resp.days[0].recipe.name == "Курица с рисом"
    assert resp.unresolved_items_count == 1