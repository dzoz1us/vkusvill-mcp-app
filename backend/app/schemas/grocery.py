"""Grocery list schemas."""

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.enums import MatchStatus


class GroceryItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True, coerce_numbers_to_str=True)

    id: str
    ingredient_id: str | None = None

    product_name: str
    needed_quantity: float
    needed_unit: str

    product_url: str | None = None
    product_xml_id: str | None = None

    package_quantity: float | None = None
    package_unit: str | None = None
    package_count: int | None = Field(default=None, ge=0)
    price_per_package: float | None = Field(default=None, ge=0)
    total_price: float | None = Field(default=None, ge=0)

    match_status: MatchStatus
    is_bought: bool = False
    is_manual: bool = False


class GroceryListResponse(BaseModel):
    items: list[GroceryItemRead]
    total_cost: float = Field(..., ge=0)
    matched_count: int = Field(..., ge=0)
    review_count: int = Field(..., ge=0)
    not_found_count: int = Field(..., ge=0)


class GroceryItemUpdate(BaseModel):
    """Only safe fields can be patched from the client."""

    is_bought: bool | None = None


class ManualGroceryItemCreate(BaseModel):
    """Add a custom product that is not tied to an ingredient."""

    product_name: str = Field(..., min_length=1, max_length=200)
    needed_quantity: float = Field(..., gt=0)
    needed_unit: str = Field(..., min_length=1, max_length=20)
    price: float | None = Field(default=None, ge=0)