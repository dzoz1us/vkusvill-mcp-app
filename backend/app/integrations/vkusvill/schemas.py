"""Internal DTOs for the VkusVill MCP integration."""

from __future__ import annotations

from pydantic import BaseModel, Field


class ProductCandidate(BaseModel):
    """A raw candidate returned by MCP product search."""

    xml_id: str
    name: str
    price: float | None = None
    package_quantity: float | None = None
    package_unit: str | None = None
    url: str | None = None

    # filled by scorer, not by MCP
    match_score: float = Field(default=0.0)


class MatchResult(BaseModel):
    """Result of matching an ingredient to a VkusVill product."""

    ingredient_id: int | None
    ingredient_name: str
    status: str  # matched | requires_review | not_found
    candidate: ProductCandidate | None = None
    score: float = 0.0