"""Meal plan request / response contracts.

The generate response is intentionally compact: the client receives the
plan snapshot plus aggregated counters and fetches heavy details via
dedicated endpoints. This keeps mobile payloads small.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.enums import Day, Diet, Equipment, MealPlanStatus, Preference
from app.schemas.recipe import RecipeShort

MAX_PEOPLE = 12
MIN_PEOPLE = 1


class GenerateRequest(BaseModel):
    people_count: int = Field(..., ge=MIN_PEOPLE, le=MAX_PEOPLE)
    days: list[Day] = Field(..., min_length=1)
    budget: float = Field(..., gt=0)
    preferences: list[Preference] = Field(default_factory=list)
    diet: Diet = Diet.NONE
    equipment: list[Equipment] = Field(default_factory=list)
    random_seed: int | None = None

    @field_validator("days")
    @classmethod
    def days_unique(cls, v: list[Day]) -> list[Day]:
        if len(set(v)) != len(v):
            raise ValueError("days must not contain duplicates")
        return v

    @field_validator("preferences")
    @classmethod
    def preferences_unique(cls, v: list[Preference]) -> list[Preference]:
        if len(set(v)) != len(v):
            raise ValueError("preferences must not contain duplicates")
        return v

    @field_validator("equipment")
    @classmethod
    def equipment_unique(cls, v: list[Equipment]) -> list[Equipment]:
        if len(set(v)) != len(v):
            raise ValueError("equipment must not contain duplicates")
        return v


class MealPlanDayRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    day: Day
    recipe: RecipeShort


class MealPlanShort(BaseModel):
    """Compact payload returned by generate and get-plan.

    The full grocery list lives under a dedicated endpoint.
    """

    model_config = ConfigDict(from_attributes=True)

    id: int
    people_count: int
    budget: float
    estimated_cost: float
    cart_estimated_cost: float
    over_budget: bool
    status: MealPlanStatus
    created_at: datetime

    days: list[MealPlanDayRead]
    grocery_items_count: int
    unresolved_items_count: int


class ReplaceMealRequest(BaseModel):
    day: Day
    new_recipe_id: int | None = Field(
        default=None,
        description="If omitted, the backend picks the best alternative.",
    )


class RefreshPricesResponse(BaseModel):
    meal_plan_id: int
    old_estimated_total: float
    new_estimated_total: float
    price_changed: bool
    items_updated: int


class CartChunk(BaseModel):
    number: int = Field(..., ge=1)
    items_count: int = Field(..., ge=0)
    cart_url: str


class CartResponse(BaseModel):
    success: bool
    estimated_total: float = Field(..., ge=0)
    unresolved_items: int = Field(..., ge=0)
    carts: list[CartChunk]