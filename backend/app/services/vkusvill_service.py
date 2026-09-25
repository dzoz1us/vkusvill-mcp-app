"""VkusVill service layer: search, match, cache."""

from __future__ import annotations

import json
import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.database.config import get_settings
from app.integrations.vkusvill.mapper import (
    normalize_ingredient_query,
    pick_best_candidate,
)
from app.integrations.vkusvill.mcp_client import (
    MCPError,
    VkusVillMCPClient,
)
from app.integrations.vkusvill.schemas import MatchResult, ProductCandidate
from app.models import Ingredient, MCPProductCache, ProductMapping

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Parsing
# ---------------------------------------------------------------------------

_WEIGHT_TO_CANONICAL = {
    "кг": ("g", 1000.0),
    "kg": ("g", 1000.0),
    "г": ("g", 1.0),
    "g": ("g", 1.0),
    "л": ("ml", 1000.0),
    "l": ("ml", 1000.0),
    "мл": ("ml", 1.0),
    "ml": ("ml", 1.0),
    "шт": ("pcs", 1.0),
    "pcs": ("pcs", 1.0),
}


def _candidate_from_dict(raw: object) -> ProductCandidate | None:
    """Parse one MCP product dict into a ProductCandidate.

    Handles the shape we saw from the live MCP:
        {
          "id": 17525,
          "xml_id": 17525,
          "name": "Молоко 3,2% ...",
          "price": {"current": 104, "currency": "RUB", ...},
          "weight": {"value": 0.9, "unit": "кг"},
          "unit": "шт",
          "url": "https://..."
        }
    """
    if not isinstance(raw, dict):
        return None

    product_id = raw.get("id")
    xml_id = raw.get("xml_id") or product_id
    name = raw.get("name")
    if not xml_id or not name:
        return None

    # price may be a dict {current, currency, ...} or a plain number
    price_raw = raw.get("price")
    price: float | None = None
    if isinstance(price_raw, dict):
        current = price_raw.get("current")
        if current is not None:
            try:
                price = float(current)
            except (TypeError, ValueError):
                price = None
    elif isinstance(price_raw, (int, float)):
        price = float(price_raw)

    # weight -> canonical quantity/unit
    package_quantity: float | None = None
    package_unit: str | None = None
    weight_raw = raw.get("weight")
    if isinstance(weight_raw, dict):
        w_val = weight_raw.get("value")
        w_unit = weight_raw.get("unit")
        if w_val is not None and isinstance(w_unit, str):
            key = w_unit.strip().lower()
            if key in _WEIGHT_TO_CANONICAL:
                canon_unit, multiplier = _WEIGHT_TO_CANONICAL[key]
                try:
                    package_quantity = float(w_val) * multiplier
                    package_unit = canon_unit
                except (TypeError, ValueError):
                    pass
    elif isinstance(weight_raw, (int, float)):
        # assume kilograms
        package_quantity = float(weight_raw) * 1000.0
        package_unit = "g"

    # fallback: if sold by "шт" and no weight info, treat as 1 pcs
    if package_quantity is None and raw.get("unit") == "шт":
        package_quantity = 1.0
        package_unit = "pcs"

    return ProductCandidate(
        product_id=int(product_id) if product_id is not None else None,
        xml_id=str(xml_id),
        name=str(name),
        price=price,
        package_quantity=package_quantity,
        package_unit=package_unit,
        url=raw.get("url") if isinstance(raw.get("url"), str) else None,
    )


def _extract_products(raw: object) -> list[ProductCandidate]:
    """Extract product list from the shape MCP returns.

    Actual shape:
        {"ok": true, "data": {"meta": {...}, "items": [...]}}
    Older heuristic shapes (products/results/lists) are also accepted
    so tests with mocks don't have to reproduce the exact envelope.
    """
    if raw is None:
        return []

    if isinstance(raw, list):
        items = raw
    elif isinstance(raw, dict):
        # unwrap {ok, data}
        inner = raw.get("data") if "data" in raw else raw
        if not isinstance(inner, dict):
            return []
        items = inner.get("items") or inner.get("products") or inner.get("results") or []
    else:
        return []

    candidates: list[ProductCandidate] = []
    for item in items:
        c = _candidate_from_dict(item)
        if c is not None:
            candidates.append(c)
    return candidates


# ---------------------------------------------------------------------------
# Cache
# ---------------------------------------------------------------------------

def _cache_get(db: Session, query: str) -> list[ProductCandidate] | None:
    now = datetime.now(timezone.utc)
    row = (
        db.query(MCPProductCache)
        .filter(MCPProductCache.query == query)
        .order_by(MCPProductCache.created_at.desc())
        .first()
    )
    if row is None:
        return None
    expires = row.expires_at
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if expires < now:
        return None
    try:
        payload = json.loads(row.response_json)
    except json.JSONDecodeError:
        return None
    return [ProductCandidate(**p) for p in payload]


def _cache_put(
    db: Session,
    query: str,
    candidates: list[ProductCandidate],
) -> None:
    settings = get_settings()
    ttl = timedelta(seconds=settings.product_search_cache_ttl_seconds)
    now = datetime.now(timezone.utc)
    row = MCPProductCache(
        query=query,
        response_json=json.dumps([c.model_dump() for c in candidates]),
        created_at=now,
        expires_at=now + ttl,
    )
    db.add(row)
    db.flush()


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def search_products(
    db: Session,
    query: str,
    client: VkusVillMCPClient | None = None,
    use_cache: bool = True,
) -> list[ProductCandidate]:
    if use_cache:
        cached = _cache_get(db, query)
        if cached is not None:
            return cached

    settings = get_settings()
    if not settings.enable_live_mcp:
        return []

    client = client or VkusVillMCPClient()
    try:
        raw = await client.products_search(query)
    except MCPError as e:
        logger.warning("MCP search failed for %r: %s", query, e)
        return []

    candidates = _extract_products(raw)
    if use_cache and candidates:
        _cache_put(db, query, candidates)
    return candidates


async def match_ingredient(
    db: Session,
    ingredient: Ingredient,
    client: VkusVillMCPClient | None = None,
) -> MatchResult:
    query = normalize_ingredient_query(ingredient.name)
    candidates = await search_products(db, query, client=client)
    best, status, score = pick_best_candidate(ingredient.name, candidates)

    if best is not None and status == "matched":
        existing = (
            db.query(ProductMapping)
            .filter_by(ingredient_id=ingredient.id)
            .one_or_none()
        )
        if existing is None:
            existing = ProductMapping(ingredient_id=ingredient.id)
            db.add(existing)
        existing.product_xml_id = best.xml_id
        existing.product_name = best.name
        existing.product_url = best.url
        existing.package_quantity = best.package_quantity
        existing.package_unit = best.package_unit
        existing.last_price = best.price
        existing.match_score = score
        existing.match_status = status
        existing.last_checked_at = datetime.now(timezone.utc)
        db.flush()

        logger.info(
        "MATCH ingredient=%r query=%r status=%s score=%.2f candidate=%r",
        ingredient.name, query, status, score,
        best.name if best else None,
    )
        
    return MatchResult(
        ingredient_id=ingredient.id,
        ingredient_name=ingredient.name,
        status=status,
        candidate=best if status != "not_found" else None,
        score=score,
    )