"""Idempotent seeder for ingredients and recipes.

Run from backend/:
    python -m app.seed_runner

Running it twice must not create duplicates.
"""

from __future__ import annotations

import json
from pathlib import Path

from sqlalchemy.orm import Session

from app.database.base import SessionLocal
from app.models import (
    Ingredient,
    Recipe,
    RecipeAppliance,
    RecipeIngredient,
    RecipeTag,
)

# JSON data lives in the app/seed/ package next to this file.
SEED_DIR = Path(__file__).parent / "seed"


def load_json(filename: str) -> list[dict]:
    path = SEED_DIR / filename
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def seed_ingredients(db: Session) -> dict[str, Ingredient]:
    """Create or update ingredients keyed by normalized_name."""
    data = load_json("ingredients.json")
    by_norm: dict[str, Ingredient] = {}

    for item in data:
        norm = item["normalized_name"]
        existing = (
            db.query(Ingredient).filter_by(normalized_name=norm).one_or_none()
        )
        if existing is None:
            existing = Ingredient(
                name=item["name"],
                normalized_name=norm,
                default_unit=item["default_unit"],
                category=item.get("category"),
            )
            db.add(existing)
        else:
            existing.name = item["name"]
            existing.default_unit = item["default_unit"]
            existing.category = item.get("category")
        by_norm[norm] = existing

    db.flush()
    return by_norm


def seed_recipes(db: Session, ingredients: dict[str, Ingredient]) -> int:
    """Create or update recipes. Returns number of recipes in DB afterwards."""
    data = load_json("recipes.json")

    for item in data:
        recipe = db.query(Recipe).filter_by(name=item["name"]).one_or_none()
        if recipe is None:
            recipe = Recipe(name=item["name"])
            db.add(recipe)
            db.flush()

        recipe.description = item.get("description")
        recipe.image_url = item.get("image_url")
        recipe.servings = item.get("servings", 2)
        recipe.cook_time_minutes = item.get("cook_time_minutes", 30)
        recipe.calories = item.get("calories")
        recipe.protein = item.get("protein")
        recipe.fat = item.get("fat")
        recipe.carbs = item.get("carbs")
        recipe.diet = item.get("diet", "none")
        recipe.meal_type = item.get("meal_type")
        recipe.steps = json.dumps(item.get("steps", []), ensure_ascii=False)

        # reset relationships so re-runs are idempotent
        recipe.ingredients.clear()
        recipe.tags.clear()
        recipe.appliances.clear()
        db.flush()

        for ing_data in item.get("ingredients", []):
            norm = ing_data["normalized_name"]
            ing = ingredients.get(norm)
            if ing is None:
                raise ValueError(
                    f"Unknown ingredient {norm!r} referenced in recipe "
                    f"{item['name']!r}. Add it to ingredients.json first."
                )
            recipe.ingredients.append(
                RecipeIngredient(
                    ingredient_id=ing.id,
                    quantity=float(ing_data["quantity"]),
                    unit=ing_data["unit"],
                )
            )

        for tag in item.get("tags", []):
            recipe.tags.append(RecipeTag(tag=tag))

        for appliance in item.get("appliances", []):
            recipe.appliances.append(RecipeAppliance(appliance=appliance))

    db.commit()
    return db.query(Recipe).count()


def run() -> None:
    """Full seed routine. Safe to call repeatedly."""
    db = SessionLocal()
    try:
        ingredients = seed_ingredients(db)
        recipes_count = seed_recipes(db, ingredients)
        print(
            f"Seeded {len(ingredients)} ingredients, "
            f"{recipes_count} recipes total."
        )
    finally:
        db.close()


if __name__ == "__main__":
    run()