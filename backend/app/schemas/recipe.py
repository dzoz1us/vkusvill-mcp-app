"""Recipe and ingredient schemas.

Kept intentionally lean for mobile clients: list endpoints return a
compact `RecipeShort`, detail endpoints return `RecipeDetail`.
"""

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.enums import Diet, Equipment


class IngredientBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    normalized_name: str
    default_unit: str
    category: str | None = None


class RecipeIngredientRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    ingredient_id: int
    name: str
    quantity: float
    unit: str


class RecipeShort(BaseModel):
    """Compact representation for lists and meal plan cards."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    image_url: str | None = None
    cooking_time: int = Field(..., ge=0)
    calories: float | None = None
    diet: Diet
    tags: list[str] = Field(default_factory=list)


class RecipeDetail(RecipeShort):
    """Full representation for the recipe page."""

    description: str | None = None
    base_servings: int = Field(..., ge=1)
    protein: float | None = None
    fat: float | None = None
    carbs: float | None = None
    equipment: list[Equipment] = Field(default_factory=list)
    ingredients: list[RecipeIngredientRead] = Field(default_factory=list)
    instructions: str | None = None


class RecipeListResponse(BaseModel):
    items: list[RecipeShort]
    total: int
    limit: int
    offset: int