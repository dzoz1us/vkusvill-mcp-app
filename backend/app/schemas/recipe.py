"""Recipe and ingredient schemas.

Field names match the frontend TypeScript contract in
frontend/src/types/index.ts.
"""

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.enums import Appliance, Diet


class NutritionInfo(BaseModel):
    calories: float
    protein: float
    fat: float
    carbs: float


class IngredientRead(BaseModel):
    """Ingredient as it appears inside a recipe."""

    model_config = ConfigDict(from_attributes=True, coerce_numbers_to_str=True)

    id: str
    name: str
    quantity: float
    unit: str


class RecipeShort(BaseModel):
    """Compact representation for lists and meal plan cards."""

    model_config = ConfigDict(from_attributes=True, coerce_numbers_to_str=True)

    id: str
    name: str
    image_url: str | None = None
    cook_time_minutes: int = Field(..., ge=0)
    servings: int = Field(..., ge=1)
    nutrition: NutritionInfo | None = None
    diet: Diet


class RecipeDetail(RecipeShort):
    """Full representation for the recipe page."""

    appliances: list[Appliance] = Field(default_factory=list)
    ingredients: list[IngredientRead] = Field(default_factory=list)
    steps: list[str] = Field(default_factory=list)


class RecipeListResponse(BaseModel):
    items: list[RecipeShort]
    total: int
    limit: int
    offset: int