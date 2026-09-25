"""Grocery list endpoints."""

from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.database.base import get_db
from app.models import GroceryItem, MealPlan
from app.schemas import (
    GroceryItemRead,
    GroceryItemUpdate,
    GroceryListResponse,
    ManualGroceryItemCreate,
)
from app.schemas.enums import ErrorCode
from app.schemas.errors import ErrorBody, ErrorResponse

router = APIRouter(tags=["grocery"])


def _error(code: ErrorCode, message: str, status_code: int) -> JSONResponse:
    body = ErrorResponse(
        error=ErrorBody(code=code, message=message, retryable=False)
    )
    return JSONResponse(status_code=status_code, content=body.model_dump(mode="json"))


@router.get(
    "/api/meal-plans/{plan_id}/grocery-list",
    response_model=GroceryListResponse,
    responses={404: {"model": ErrorResponse}},
)
def get_grocery_list(plan_id: int, db: Session = Depends(get_db)):
    plan = db.get(MealPlan, plan_id)
    if plan is None:
        return _error(
            ErrorCode.NOT_FOUND,
            f"Meal plan {plan_id} not found",
            status.HTTP_404_NOT_FOUND,
        )

    items = (
        db.query(GroceryItem)
        .filter_by(meal_plan_id=plan_id)
        .order_by(GroceryItem.id)
        .all()
    )

    matched = sum(1 for i in items if i.match_status == "matched")
    review = sum(1 for i in items if i.match_status == "requires_review")
    not_found = sum(1 for i in items if i.match_status == "not_found")
    total_cost = round(
        sum(i.total_price or 0 for i in items),
        2,
    )

    return GroceryListResponse(
        items=[GroceryItemRead.model_validate(i) for i in items],
        total_cost=total_cost,
        matched_count=matched,
        review_count=review,
        not_found_count=not_found,
    )


@router.patch(
    "/api/grocery-items/{item_id}",
    response_model=GroceryItemRead,
    responses={404: {"model": ErrorResponse}},
)
def update_grocery_item(
    item_id: int,
    payload: GroceryItemUpdate,
    db: Session = Depends(get_db),
):
    item = db.get(GroceryItem, item_id)
    if item is None:
        return _error(
            ErrorCode.NOT_FOUND,
            f"Grocery item {item_id} not found",
            status.HTTP_404_NOT_FOUND,
        )

    if payload.is_bought is not None:
        item.is_bought = payload.is_bought

    db.commit()
    db.refresh(item)
    return item


@router.post(
    "/api/meal-plans/{plan_id}/grocery-items",
    response_model=GroceryItemRead,
    status_code=status.HTTP_201_CREATED,
    responses={404: {"model": ErrorResponse}},
)
def add_manual_item(
    plan_id: int,
    payload: ManualGroceryItemCreate,
    db: Session = Depends(get_db),
):
    plan = db.get(MealPlan, plan_id)
    if plan is None:
        return _error(
            ErrorCode.NOT_FOUND,
            f"Meal plan {plan_id} not found",
            status.HTTP_404_NOT_FOUND,
        )

    item = GroceryItem(
        meal_plan_id=plan_id,
        ingredient_id=None,
        product_name=payload.product_name,
        needed_quantity=payload.needed_quantity,
        needed_unit=payload.needed_unit,
        price_per_package=payload.price,
        total_price=payload.price,
        package_quantity=None,
        package_count=None,
        match_status="matched",
        is_bought=False,
        is_manual=True,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item