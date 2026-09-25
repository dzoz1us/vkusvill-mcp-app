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