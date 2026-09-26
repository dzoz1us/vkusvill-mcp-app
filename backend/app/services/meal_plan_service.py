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
import logging
import random
from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.integrations.vkusvill.mcp_client import MCPError, VkusVillMCPClient
from app.models import MealPlan, MealPlanMeal, Recipe
from app.schemas import GenerateRequest
from app.schemas.enums import Appliance, Day, Diet, MealType, Preference

MEALS_PER_DAY = 3
MEAL_TYPE_ORDER: list[MealType] = [
    MealType.BREAKFAST,
    MealType.LUNCH,
    MealType.DINNER,
]

logger = logging.getLogger(__name__)

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
    """For each (day, meal_type) slot, pick the best-scored recipe that
    matches the slot type (or is universal "any"). Deterministic with seed.
    """
    rng = random.Random(request.random_seed)

    def pool_for(meal_type: MealType) -> list[Recipe]:
        specific = [r for r in candidates if r.meal_type == meal_type.value]
        universal = [r for r in candidates if r.meal_type in (None, "any")]
        # Prefer recipes designed for this slot, then universal recipes.
        pool = specific + universal
        if not pool:
            raise NoSuitableRecipesError(
                f"No recipes match the {meal_type.value} slot and selected filters."
            )
        rng.shuffle(pool)
        pool.sort(key=lambda r: -_score(r, request.preferences))
        return pool

    pools = {mt: pool_for(mt) for mt in MEAL_TYPE_ORDER}
    idx = dict.fromkeys(MEAL_TYPE_ORDER, 0)

    selected: list[Recipe] = []
    for _day in request.days:
        for meal_type in MEAL_TYPE_ORDER:
            pool = pools[meal_type]
            if idx[meal_type] >= len(pool):
                idx[meal_type] = 0  # cycle if we run out
            selected.append(pool[idx[meal_type]])
            idx[meal_type] += 1
    return selected


def generate_plan(db: Session, request: GenerateRequest) -> MealPlan:
    candidates = _filter_candidates(db, request)
    if not candidates:
        raise NoSuitableRecipesError("No recipes match the selected diet and appliances.")

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

    db.flush()

    # build grocery list from all meals of this plan
    from app.services.grocery_service import build_grocery_items

    items = build_grocery_items(db, plan)
    plan.unresolved_items_count = sum(1 for it in items if it.match_status != "matched")
    plan.cart_estimated_cost = 0.0  # real cost arrives with MCP

    db.commit()
    db.refresh(plan)
    return plan


class MealNotFoundError(Exception):
    """Raised when the requested meal slot does not belong to the plan."""


class NoAlternativeRecipeError(Exception):
    """Raised when no valid substitute recipe can be found."""


def _request_from_plan(plan: MealPlan) -> GenerateRequest:
    """Reconstruct a GenerateRequest from stored plan parameters."""
    return GenerateRequest(
        people_count=plan.people_count,
        days=[Day(d) for d in json.loads(plan.days_json)],
        budget=plan.budget,
        preferences=[Preference(p) for p in json.loads(plan.preferences_json)],
        diet=Diet(plan.diet),
        appliances=[Appliance(a) for a in json.loads(plan.appliances_json)],
        random_seed=plan.random_seed,
    )


async def replace_meal(
    db: Session,
    plan: MealPlan,
    meal_id: int,
    new_recipe_id: int | None = None,
    client: VkusVillMCPClient | None = None,
) -> tuple[MealPlan, Recipe]:
    """Replace one meal's recipe, rebuild grocery list, refresh prices.

    Transactional on the DB side: meal update + grocery rebuild either
    both succeed or both roll back. MCP enrichment is best-effort — if
    it fails, the plan is still saved and can be refreshed later.
    """
    meal = db.get(MealPlanMeal, meal_id)
    if meal is None or meal.meal_plan_id != plan.id:
        raise MealNotFoundError(f"Meal {meal_id} not found in plan {plan.id}")

    old_recipe_id = meal.recipe_id
    request = _request_from_plan(plan)

    candidates = _filter_candidates(db, request)
    candidates = [
        r
        for r in candidates
        if r.id != old_recipe_id and r.meal_type in (meal.meal_type, None, "any")
    ]
    if not candidates:
        raise NoAlternativeRecipeError(
            "No alternative recipe matches the plan's diet and appliances."
        )

    # Pick the alternative.
    if new_recipe_id is not None:
        chosen = next((r for r in candidates if r.id == new_recipe_id), None)
        if chosen is None:
            raise NoAlternativeRecipeError(
                f"Recipe {new_recipe_id} is not a valid alternative for this plan."
            )
    else:
        scored = sorted(
            candidates,
            key=lambda r: (-_score(r, request.preferences), r.id),
        )
        chosen = scored[0]

    # ---- Phase 1: transactional DB update --------------------------------
    try:
        meal.recipe_id = chosen.id
        db.flush()

        from app.services.grocery_service import build_grocery_items

        items = build_grocery_items(db, plan)
        plan.unresolved_items_count = sum(1 for it in items if it.match_status != "matched")
        plan.cart_estimated_cost = 0.0
        db.commit()
        db.refresh(plan)
        db.refresh(chosen)
    except Exception:
        db.rollback()
        raise

    # ---- Phase 2: best-effort MCP enrichment -----------------------------
    try:
        from app.services.grocery_service import enrich_plan_prices

        await enrich_plan_prices(db, plan, client=client)
    except MCPError as e:
        logger.warning(
            "MCP enrichment failed after replace_meal (plan %s): %s",
            plan.id,
            e,
        )

    return plan, chosen
