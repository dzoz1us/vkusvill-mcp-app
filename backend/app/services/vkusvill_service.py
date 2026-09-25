"""VkusVill service layer: search, match, cache.

Sits between the MCP client (low-level) and the grocery builder (high-level).
Tests use a mock transport or monkeypatch, so this module works without
internet.
"""

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
    MCPBadResponseError,
    MCPError,
    MCPTimeoutError,
    MCPUnavailableError,
    VkusVillMCPClient,
)
from app.integrations.vkusvill.schemas import MatchResult, ProductCandidate
from app.models import Ingredient, MCPProductCache, ProductMapping

logger = logging.getLogger(__name__)


def _candidate_from_dict(raw: dict) -> ProductCandidate | None:
    """Best-effort parsing of an MCP product dict.

    MCP responses are experimental; different fields may be missing.
    We accept several naming conventions to avoid being brittle.
    """
    xml_id = (
        raw.get("xml_id")
        or raw.get("xmlId")
        or raw.get("id")
        or raw.get("product_id")
    )
    name = raw.get("name") or raw.get("title")
    if not xml_id or not name:
        return None

    price = raw.get("price")
    package_quantity = (
        raw.get("package_quantity")
        or raw.get("weight")
        or raw.get("volume")
    )
    package_unit = (
        raw.get("package_unit")
        or raw.get("unit")
    )
    url = raw.get("url") or raw.get("link")

    def _as_float(v):
        try:
            return float(v) if v is not None else None
        except (TypeError, ValueError):
            return None

    return ProductCandidate(
        xml_id=str(xml_id),
        name=str(name),
        price=_as_float(price),
        package_quantity=_as_float(package_quantity),
        package_unit=str(package_unit) if package_unit else None,
        url=str(url) if url else None,
    )


def _extract_products(raw: object) -> list[ProductCandidate]:
    """Extract product list from any MCP response shape we've seen."""
    if raw is None:
        return []
    if isinstance(raw, list):
        items = raw
    elif isinstance(raw, dict):
        items = (
            raw.get("products")
            or raw.get("items")
            or raw.get("results")
            or []
        )
    else:
        return []

    candidates: list[ProductCandidate] = []
    for item in items:
        if not isinstance(item, dict):
            continue
        c = _candidate_from_dict(item)
        if c is not None:
            candidates.append(c)
    return candidates


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
    # sqlite stores naive datetimes; normalize
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


async def search_products(
    db: Session,
    query: str,
    client: VkusVillMCPClient | None = None,
    use_cache: bool = True,
) -> list[ProductCandidate]:
    """Search VkusVill for products matching `query`.

    Uses MCPProductCache; on any MCP failure returns [] and does not raise,
    so callers can decide whether to degrade gracefully.
    """
    if use_cache:
        cached = _cache_get(db, query)
        if cached is not None:
            return cached

    client = client or VkusVillMCPClient()
    settings = get_settings()
    if not settings.enable_live_mcp:
        # live MCP disabled (tests, offline dev): return empty, don't cache
        return []

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
    """Look up the best VkusVill product for an ingredient.

    Returns a MatchResult. Never raises on MCP failure; the caller sees
    status="not_found".
    """
    query = normalize_ingredient_query(ingredient.name)
    candidates = await search_products(db, query, client=client)
    best, status, score = pick_best_candidate(ingredient.name, candidates)

    # Persist mapping only on confident match
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

    return MatchResult(
        ingredient_id=ingredient.id,
        ingredient_name=ingredient.name,
        status=status,
        candidate=best if status != "not_found" else None,
        score=score,
    )