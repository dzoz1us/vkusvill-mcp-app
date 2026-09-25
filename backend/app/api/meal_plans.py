"""Meal plan endpoints."""

from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.database.base import get_db
from app.models import MealPlan
from app.schemas import GenerateRequest, MealPlanRead
from app.schemas.enums import ErrorCode
from app.schemas.errors import ErrorBody, ErrorResponse
from app.services.meal_plan_service import NoSuitableRecipesError, generate_plan

router = APIRouter(prefix="/api/meal-plans", tags=["meal-plans"])


def _error(
    code: ErrorCode,
    message: str,
    status_code: int,
    retryable: bool = False,
) -> JSONResponse:
    body = ErrorResponse(
        error=ErrorBody(code=code, message=message, retryable=retryable)
    )
    return JSONResponse(status_code=status_code, content=body.model_dump(mode="json"))


@router.post(
    "/generate",
    response_model=MealPlanRead,
    status_code=status.HTTP_201_CREATED,
    responses={422: {"model": ErrorResponse}},
)
def generate(request: GenerateRequest, db: Session = Depends(get_db)):
    try:
        plan = generate_plan(db, request)
    except NoSuitableRecipesError as e:
        return _error(
            code=ErrorCode.NO_SUITABLE_RECIPES,
            message=str(e),
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            retryable=False,
        )
    return plan


@router.get(
    "/{plan_id}",
    response_model=MealPlanRead,
    responses={404: {"model": ErrorResponse}},
)
def get_plan(plan_id: int, db: Session = Depends(get_db)):
    plan = db.get(MealPlan, plan_id)
    if plan is None:
        return _error(
            code=ErrorCode.NOT_FOUND,
            message=f"Meal plan {plan_id} not found",
            status_code=status.HTTP_404_NOT_FOUND,
        )
    return plan