"""Recipe endpoints: list and detail."""

from __future__ import annotations

import json

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.database.base import get_db
from app.models import Recipe
from app.schemas import RecipeDetail, RecipeListResponse, RecipeShort
from app.schemas.enums import ErrorCode
from app.schemas.errors import ErrorBody, ErrorResponse

router = APIRouter(prefix="/api/recipes", tags=["recipes"])


def _error(code: ErrorCode, message: str, status_code: int) -> JSONResponse:
    body = ErrorResponse(
        error=ErrorBody(code=code, message=message, retryable=False)
    )
    return JSONResponse(status_code=status_code, content=body.model_dump(mode="json"))


def _to_short(recipe: Recipe) -> RecipeShort:
    return RecipeShort(
        id=str(recipe.id),
        name=recipe.name,
        image_url=recipe.image_url,
        cook_time_minutes=recipe.cook_time_minutes,
        servings=recipe.servings,
        nutrition=recipe.nutrition,
        diet=recipe.diet,
        meal_type=recipe.meal_type,
    )


def _to_detail(recipe: Recipe) -> RecipeDetail:
    try:
        steps = json.loads(recipe.steps) if recipe.steps else []
    except (TypeError, json.JSONDecodeError):
        steps = []

    return RecipeDetail(
        id=str(recipe.id),
        name=recipe.name,
        image_url=recipe.image_url,
        cook_time_minutes=recipe.cook_time_minutes,
        servings=recipe.servings,
        nutrition=recipe.nutrition,
        diet=recipe.diet,
        appliances=[a.appliance for a in recipe.appliances],
        ingredients=[
            {
                "id": str(ri.ingredient_id),
                "name": ri.ingredient.name if ri.ingredient else "",
                "quantity": ri.quantity,
                "unit": ri.unit,
            }
            for ri in recipe.ingredients
        ],
        steps=steps,
    )


@router.get("", response_model=RecipeListResponse)
def list_recipes(
    db: Session = Depends(get_db),
    diet: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    q = db.query(Recipe)
    if diet:
        q = q.filter(Recipe.diet == diet)

    total = q.count()
    recipes = q.order_by(Recipe.id).offset(offset).limit(limit).all()

    return RecipeListResponse(
        items=[_to_short(r) for r in recipes],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/{recipe_id}",
    response_model=RecipeDetail,
    responses={404: {"model": ErrorResponse}},
)
def get_recipe(recipe_id: int, db: Session = Depends(get_db)):
    recipe = db.get(Recipe, recipe_id)
    if recipe is None:
        return _error(
            ErrorCode.NOT_FOUND,
            f"Recipe {recipe_id} not found",
            status.HTTP_404_NOT_FOUND,
        )
    return _to_detail(recipe)