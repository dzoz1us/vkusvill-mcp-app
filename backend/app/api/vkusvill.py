"""VkusVill-specific endpoints: refresh prices and create cart links."""

import logging

from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.database.base import get_db
from app.integrations.vkusvill.mcp_client import (
    MCPError,
    MCPTimeoutError,
    MCPUnavailableError,
    VkusVillMCPClient,
)
from app.models import GroceryItem, MealPlan
from app.schemas import CartLink, CartResponse, RefreshPricesResponse
from app.schemas.enums import ErrorCode
from app.schemas.errors import ErrorBody, ErrorResponse
from app.services.grocery_service import enrich_plan_prices

router = APIRouter(prefix="/api/meal-plans", tags=["vkusvill"])
logger = logging.getLogger(__name__)

# VkusVill share_basket limits per single link.
CART_CHUNK_SIZE = 20
# cart_link_create schema: q in 0.01..40
MAX_Q_PER_ITEM = 40


def _error(code: ErrorCode, message: str, status_code: int, retryable: bool = False):
    body = ErrorResponse(error=ErrorBody(code=code, message=message, retryable=retryable))
    return JSONResponse(status_code=status_code, content=body.model_dump(mode="json"))


@router.post(
    "/{plan_id}/refresh-prices",
    response_model=RefreshPricesResponse,
    responses={
        404: {"model": ErrorResponse},
        503: {"model": ErrorResponse},
    },
)
async def refresh_prices(plan_id: int, db: Session = Depends(get_db)):
    plan = db.get(MealPlan, plan_id)
    if plan is None:
        return _error(
            ErrorCode.NOT_FOUND,
            f"Meal plan {plan_id} not found",
            status.HTTP_404_NOT_FOUND,
        )

    old_total = plan.cart_estimated_cost or 0.0

    try:
        await enrich_plan_prices(db, plan)
    except MCPTimeoutError as e:
        return _error(
            ErrorCode.VKUSVILL_MCP_TIMEOUT,
            str(e) or "MCP request timed out",
            status.HTTP_503_SERVICE_UNAVAILABLE,
            retryable=True,
        )
    except (MCPUnavailableError, MCPError) as e:
        return _error(
            ErrorCode.VKUSVILL_MCP_UNAVAILABLE,
            str(e) or "VkusVill MCP unavailable",
            status.HTTP_503_SERVICE_UNAVAILABLE,
            retryable=True,
        )

    new_total = plan.cart_estimated_cost or 0.0
    return RefreshPricesResponse(
        plan_id=str(plan.id),
        cost_changed=abs(new_total - old_total) > 0.01,
        new_cost=new_total,
    )


@router.post(
    "/{plan_id}/vkusvill-cart",
    response_model=CartResponse,
    responses={
        404: {"model": ErrorResponse},
        503: {"model": ErrorResponse},
    },
)
async def create_vkusvill_cart(plan_id: int, db: Session = Depends(get_db)):
    plan = db.get(MealPlan, plan_id)
    if plan is None:
        return _error(
            ErrorCode.NOT_FOUND,
            f"Meal plan {plan_id} not found",
            status.HTTP_404_NOT_FOUND,
        )

    # Auto-enrich from MCP before building cart: this makes both
    # the plan page and the grocery list page behave the same.
    try:
        await enrich_plan_prices(db, plan)
    except MCPTimeoutError as e:
        return _error(
            ErrorCode.VKUSVILL_MCP_TIMEOUT,
            str(e) or "MCP timed out while refreshing prices",
            status.HTTP_503_SERVICE_UNAVAILABLE,
            retryable=True,
        )
    except (MCPUnavailableError, MCPError) as e:
        return _error(
            ErrorCode.VKUSVILL_MCP_UNAVAILABLE,
            str(e) or "VkusVill MCP unavailable",
            status.HTTP_503_SERVICE_UNAVAILABLE,
            retryable=True,
        )

    all_items = db.query(GroceryItem).filter_by(meal_plan_id=plan.id).all()

    items = [
        item
        for item in all_items
        if (
            item.match_status == "matched"
            and item.product_xml_id is not None
            and item.package_count is not None
        )
    ]

    if not items:
        return CartResponse(
            carts=[],
            price_changed=False,
            unresolved_items=len(all_items),
        )

    # build payload for MCP: [{xml_id: int, q: float}]
    payload: list[dict] = []
    for it in items:
        try:
            xml_id = int(it.product_xml_id)
        except (TypeError, ValueError):
            continue
        q = float(it.package_count or 1)
        if q < 0.01:
            q = 0.01
        if q > MAX_Q_PER_ITEM:
            q = MAX_Q_PER_ITEM
        payload.append({"xml_id": xml_id, "q": q})

    # Count every grocery item that cannot be represented in the cart
    # payload, including manual items and malformed product IDs.
    unresolved = len(all_items) - len(payload)

    # chunk by 20 (share_basket limit)
    chunks = [payload[i : i + CART_CHUNK_SIZE] for i in range(0, len(payload), CART_CHUNK_SIZE)]

    client = VkusVillMCPClient()
    carts: list[CartLink] = []
    try:
        logger.debug("Creating %d VkusVill cart chunk(s)", len(chunks))
        for chunk in chunks:
            raw = await client.cart_link_create(chunk)
            url = _extract_cart_url(raw)
            if not url:
                continue
            carts.append(CartLink(cart_url=url, items_count=len(chunk)))
    except MCPTimeoutError as e:
        return _error(
            ErrorCode.VKUSVILL_MCP_TIMEOUT,
            str(e) or "MCP timed out while creating cart",
            status.HTTP_503_SERVICE_UNAVAILABLE,
            retryable=True,
        )
    except (MCPUnavailableError, MCPError) as e:
        return _error(
            ErrorCode.VKUSVILL_MCP_UNAVAILABLE,
            str(e) or "VkusVill MCP unavailable",
            status.HTTP_503_SERVICE_UNAVAILABLE,
            retryable=True,
        )

    return CartResponse(
        carts=carts,
        price_changed=False,
        unresolved_items=unresolved,
    )


def _extract_cart_url(raw: object) -> str | None:
    """MCP cart_link_create response shape is not fully known yet.
    Accept a few plausible keys."""
    if raw is None:
        return None
    if isinstance(raw, str):
        return raw if raw.startswith("http") else None
    if isinstance(raw, dict):
        for key in ("url", "cart_url", "share_basket_url", "link"):
            val = raw.get(key)
            if isinstance(val, str) and val.startswith("http"):
                return val
        # nested { data: { url: ... } }
        data = raw.get("data")
        if isinstance(data, dict):
            return _extract_cart_url(data)
    if isinstance(raw, list) and raw:
        return _extract_cart_url(raw[0])
    return None
