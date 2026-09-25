"""Internal DTOs for the VkusVill MCP integration."""

from __future__ import annotations

from pydantic import BaseModel, Field


class ProductCandidate(BaseModel):
    """A normalized product from MCP search."""

    # MCP "id" — used for product_details endpoint
    product_id: int | None = None

    # MCP "xml_id" — used for cart_link_create
    xml_id: str

    name: str
    price: float | None = None  # RUB per package

    # net weight/volume per package, in canonical unit
    package_quantity: float | None = None
    package_unit: str | None = None  # g | ml | pcs

    url: str | None = None

    # filled by scorer
    match_score: float = Field(default=0.0)


class MatchResult(BaseModel):
    """Result of matching an ingredient to a VkusVill product."""

    ingredient_id: int | None
    ingredient_name: str
    status: str  # matched | requires_review | not_found
    candidate: ProductCandidate | None = None
    score: float = 0.0