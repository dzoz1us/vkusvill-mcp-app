"""Meal plan generation.

MVP scope:
- filter recipes by diet and available appliances
- score by preference tags
- deterministic shuffle with random_seed
- assign three meals per day (breakfast / lunch / dinner)
- persist MealPlan + MealPlanMeal

Real costs and VkusVill product matching are added later.
"""

from __future__ import annotations

import json
import random
from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.models import MealPlan, MealPlanMeal, Recipe
from app.schemas import GenerateRequest
from app.schemas.enums import Diet, MealType, Preference

MEALS_PER_DAY = 3
MEAL_TYPE_ORDER: list[MealType] = [
    MealType.BREAKFAST,
    MealType.LUNCH,
    MealType.DINNER,
]

# Which recipe.diet values are allowed for a given user diet selection.
_DIET_COMPATIBILITY: dict[Diet, set[str]] = {
    Diet.NONE: {"none", "vegetarian", "vegan", "pescatarian"},
    Diet.VEGETARIAN: {"vegetarian", "vegan"},
    Diet.VEGAN: {"vegan"},
    Diet.PESCATARIAN: {"pescatarian", "vegetarian", "vegan"},
}


class NoSuitableRecipesError(Exception):
    """Raised when filters leave no candidates."""


@dataclass(frozen=True)
class ScoredRecipe:
    recipe: Recipe
    score: int


def _filter_candidates(db: Session, request: GenerateRequest) -> list[Recipe]:
    allowed_diets = _DIET_COMPATIBILITY[request.diet]
    user_appliances = {a.value for a in request.appliances}

    recipes = db.query(Recipe).filter(Recipe.diet.in_(allowed_diets)).all()

    result: list[Recipe] = []
    for r in recipes:
        required = {app.appliance for app in r.appliances}
        if required.issubset(user_appliances):
            result.append(r)
    return result


def _score(recipe: Recipe, preferences: list[Preference]) -> int:
    tag_set = {t.tag for t in recipe.tags}
    return sum(3 for p in preferences if p.value in tag_set)


def _select_recipes(
    candidates: list[Recipe],
    request: GenerateRequest,
) -> list[Recipe]:
    """Sort by score desc, break ties by id, then shuffle deterministically.

    If there are fewer recipes than needed slots, the pool is cycled.
    """
    scored = [
        ScoredRecipe(recipe=r, score=_score(r, request.preferences))
        for r in candidates
    ]
    scored.sort(key=lambda x: (-x.score, x.recipe.id))

    pool = [s.recipe for s in scored]
    rng = random.Random(request.random_seed)
    rng.shuffle(pool)

    slots_needed = len(request.days) * MEALS_PER_DAY
    if not pool:
        return []
    if len(pool) < slots_needed:
        return [pool[i % len(pool)] for i in range(slots_needed)]
    return pool[:slots_needed]


def generate_plan(db: Session, request: GenerateRequest) -> MealPlan:
    candidates = _filter_candidates(db, request)
    if not candidates:
        raise NoSuitableRecipesError(
            "No recipes match the selected diet and appliances."
        )

    selected = _select_recipes(candidates, request)

    plan = MealPlan(
        people_count=request.people_count,
        budget=request.budget,
        days_json=json.dumps([d.value for d in request.days]),
        preferences_json=json.dumps([p.value for p in request.preferences]),
        appliances_json=json.dumps([a.value for a in request.appliances]),
        diet=request.diet.value,
        cart_estimated_cost=0.0,
        unresolved_items_count=0,
        status="ready",
        random_seed=request.random_seed,
    )
    db.add(plan)
    db.flush()

    idx = 0
    for day in request.days:
        for meal_type in MEAL_TYPE_ORDER:
            recipe = selected[idx]
            idx += 1
            db.add(
                MealPlanMeal(
                    meal_plan_id=plan.id,
                    day=day.value,
                    meal_type=meal_type.value,
                    recipe_id=recipe.id,
                )
            )

    db.commit()
    db.refresh(plan)
    return plan