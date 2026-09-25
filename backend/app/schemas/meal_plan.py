"""Meal plan request / response contracts.

Matches the frontend TypeScript contract in
frontend/src/types/index.ts:

- a plan contains N days, each day has breakfast + lunch + dinner
- nested `params` object mirrors the onboarding payload
- status values: generating | ready | error
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.enums import (
    Appliance,
    Day,
    Diet,
    MealPlanStatus,
    MealType,
    Preference,
)
from app.schemas.recipe import RecipeShort

MAX_PEOPLE = 12
MIN_PEOPLE = 1


class OnboardingParams(BaseModel):
    """User input captured during onboarding. Embedded in MealPlan."""

    people_count: int = Field(..., ge=MIN_PEOPLE, le=MAX_PEOPLE)
    days: list[Day] = Field(..., min_length=1)
    budget: float = Field(..., gt=0)
    preferences: list[Preference] = Field(default_factory=list)
    diet: Diet = Diet.NONE
    appliances: list[Appliance] = Field(default_factory=list)


class GenerateRequest(OnboardingParams):
    """Alias to the frontend GenerateRequest type.

    Identical to OnboardingParams — kept separate so the API can evolve
    independently if needed.
    """

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

    @field_validator("appliances")
    @classmethod
    def appliances_unique(cls, v: list[Appliance]) -> list[Appliance]:
        if len(set(v)) != len(v):
            raise ValueError("appliances must not contain duplicates")
        return v


class DayMealRead(BaseModel):
    """One meal slot inside a day."""

    model_config = ConfigDict(from_attributes=True, coerce_numbers_to_str=True)

    id: str
    day: Day
    meal_type: MealType
    recipe: RecipeShort


class MealPlanRead(BaseModel):
    """Full meal plan payload returned by generate / get-plan / replace-meal."""

    model_config = ConfigDict(from_attributes=True, coerce_numbers_to_str=True)

    id: str
    created_at: datetime
    params: OnboardingParams
    meals: list[DayMealRead]
    cart_estimated_cost: float = Field(..., ge=0)
    budget: float = Field(..., ge=0)
    unresolved_items_count: int = Field(..., ge=0)
    status: MealPlanStatus


class ReplaceMealRequest(BaseModel):
    """Replace the recipe for a given (day, meal_type) slot."""

    day: Day
    meal_type: MealType
    new_recipe_id: str | None = Field(
        default=None,
        description="If omitted, the backend picks the best alternative.",
    )


class ReplaceMealResponse(BaseModel):
    plan: MealPlanRead
    replaced_recipe: RecipeShort


class RefreshPricesResponse(BaseModel):
    plan_id: str
    cost_changed: bool
    new_cost: float = Field(..., ge=0)


class CartLink(BaseModel):
    cart_url: str
    items_count: int = Field(..., ge=0)


class CartResponse(BaseModel):
    carts: list[CartLink]
    price_changed: bool
    unresolved_items: int = Field(..., ge=0)