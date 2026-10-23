"""Unit conversion and portion scaling.

The calculation core works exclusively in canonical units:
    mass   -> g
    volume -> ml
    count  -> pcs

All conversions happen BEFORE aggregation. Never sum "1 kg" + "300 g"
as strings — always convert to grams first.
"""

from __future__ import annotations

from dataclasses import dataclass

from app.schemas.enums import Unit

# Aliases that may appear in recipe data and MCP responses.
# Keys are lowercase; values are canonical Unit.
_UNIT_ALIASES: dict[str, Unit] = {
    # grams
    "g": Unit.G,
    "г": Unit.G,
    "gr": Unit.G,
    "gram": Unit.G,
    "grams": Unit.G,
    "грамм": Unit.G,
    # kilograms
    "kg": Unit.G,
    "кг": Unit.G,
    "kilogram": Unit.G,
    "kilograms": Unit.G,
    # milliliters
    "ml": Unit.ML,
    "мл": Unit.ML,
    "milliliter": Unit.ML,
    "milliliters": Unit.ML,
    # liters
    "l": Unit.ML,
    "л": Unit.ML,
    "liter": Unit.ML,
    "liters": Unit.ML,
    # pieces
    "pcs": Unit.PCS,
    "pc": Unit.PCS,
    "шт": Unit.PCS,
    "штука": Unit.PCS,
    "штук": Unit.PCS,
    "piece": Unit.PCS,
    "pieces": Unit.PCS,
}

# Multiplier to convert value in `unit` into canonical unit.
# kg -> 1000 g; l -> 1000 ml; g/ml/pcs -> 1.
_SCALE_TO_CANONICAL: dict[str, float] = {
    "g": 1.0,
    "kg": 1000.0,
    "г": 1.0,
    "кг": 1000.0,
    "ml": 1.0,
    "l": 1000.0,
    "мл": 1.0,
    "л": 1000.0,
    "pcs": 1.0,
    "шт": 1.0,
}


class UnknownUnitError(ValueError):
    """Raised when a unit string is not recognized."""

    def __init__(self, unit: str) -> None:
        super().__init__(f"Unknown unit: {unit!r}")
        self.unit = unit


@dataclass(frozen=True)
class CanonicalQuantity:
    """A quantity expressed in a canonical unit."""

    value: float
    unit: Unit

    def __str__(self) -> str:
        return f"{self.value}{self.unit.value}"


def _normalize_unit_key(unit: str) -> str:
    return unit.strip().lower()


def to_canonical(quantity: float, unit: str) -> CanonicalQuantity:
    """Convert (quantity, unit) to a canonical unit.

    Raises UnknownUnitError if the unit string cannot be recognized.
    """
    if quantity < 0:
        raise ValueError("quantity must be non-negative")

    key = _normalize_unit_key(unit)
    if key not in _UNIT_ALIASES:
        raise UnknownUnitError(unit)

    canonical_unit = _UNIT_ALIASES[key]
    factor = _SCALE_TO_CANONICAL[key]
    return CanonicalQuantity(value=quantity * factor, unit=canonical_unit)


def scale_quantity(
    recipe_quantity: float,
    recipe_base_servings: int,
    people_count: int,
    unit: str,
) -> CanonicalQuantity:
    """Scale a recipe ingredient to the requested number of servings.

    scaled = recipe_quantity / base_servings * people_count
    """
    if recipe_base_servings <= 0:
        raise ValueError("recipe_base_servings must be positive")
    if people_count <= 0:
        raise ValueError("people_count must be positive")

    canonical = to_canonical(recipe_quantity, unit)
    factor = people_count / recipe_base_servings
    return CanonicalQuantity(value=canonical.value * factor, unit=canonical.unit)


def add_canonical(a: CanonicalQuantity, b: CanonicalQuantity) -> CanonicalQuantity:
    """Add two canonical quantities. Units must match."""
    if a.unit != b.unit:
        raise ValueError(f"Cannot add {a.unit.value} and {b.unit.value}")
    return CanonicalQuantity(value=a.value + b.value, unit=a.unit)
