"""Package count and price calculation.

Pure functions, no DB. The MCP layer will feed real product data into
these later; until then, packages are not computed and remain null.

Key rule: packages are calculated AFTER aggregation. Never per recipe.
"""

from __future__ import annotations

import math


def packages_needed(needed_quantity: float, package_quantity: float) -> int:
    """How many packages to buy.

    packages = ceil(needed / package_qty)

    700 g needed, package 450 g -> 2 packages.
    """
    if package_quantity <= 0:
        raise ValueError("package_quantity must be positive")
    if needed_quantity < 0:
        raise ValueError("needed_quantity must be non-negative")
    return math.ceil(needed_quantity / package_quantity)


def total_price(packages: int, price_per_package: float) -> float:
    """Total cost of N packages."""
    if packages < 0:
        raise ValueError("packages must be non-negative")
    if price_per_package < 0:
        raise ValueError("price_per_package must be non-negative")
    return round(packages * price_per_package, 2)


# ---------------------------------------------------------------------------
# Unit compatibility for the package calculation.
#
# In the recipe world we work with g / ml / pcs.
# VkusVill reports package weight in g (or kg converted to g) even for
# liquids like milk. For kitchen purposes g and ml are treated as
# interchangeable — density ~1. That is a documented MVP simplification.
# ---------------------------------------------------------------------------

_COMPATIBLE_UNITS = {
    frozenset({"g", "ml"}),
    frozenset({"g"}),
    frozenset({"ml"}),
    frozenset({"pcs"}),
}


def units_compatible(a: str, b: str) -> bool:
    """True if needed_unit and package_unit can be compared directly."""
    return frozenset({a, b}) in _COMPATIBLE_UNITS


def packages_for(
    needed_quantity: float,
    needed_unit: str,
    package_quantity: float | None,
    package_unit: str | None,
) -> int | None:
    """Number of packages to buy, or None if data is insufficient
    or units are not compatible."""
    if package_quantity is None or package_unit is None:
        return None
    if not units_compatible(needed_unit, package_unit):
        return None
    # if needed in ml and package in g (or vice versa) — still treat as same
    return packages_needed(needed_quantity, package_quantity)
