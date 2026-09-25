"""Domain enums shared across the whole backend.

Values intentionally match the strings used by the frontend
TypeScript types. See frontend/src/types/index.ts.

Do not rename existing members without coordinating with the frontend —
this would be a breaking change for the mobile client.
"""

from enum import Enum


class Day(str, Enum):
    MON = "mon"
    TUE = "tue"
    WED = "wed"
    THU = "thu"
    FRI = "fri"
    SAT = "sat"
    SUN = "sun"


class MealType(str, Enum):
    BREAKFAST = "breakfast"
    LUNCH = "lunch"
    DINNER = "dinner"


class Diet(str, Enum):
    NONE = "none"
    VEGETARIAN = "vegetarian"
    VEGAN = "vegan"
    PESCATARIAN = "pescatarian"


class Appliance(str, Enum):
    """Kitchen appliances a recipe may require."""

    STOVE = "stove"
    OVEN = "oven"
    MICROWAVE = "microwave"
    MULTICOOKER = "multicooker"
    AIR_FRYER = "air_fryer"
    BLENDER = "blender"


class Preference(str, Enum):
    QUICK = "quick"
    LOW_CALORIE = "low_calorie"
    FAMILY = "family"
    HEALTHY = "healthy"
    HIGH_PROTEIN = "high_protein"
    BUDGET = "budget"
    HEARTY = "hearty"


class Unit(str, Enum):
    """Canonical units used by the calculation core.

    mass   -> g
    volume -> ml
    count  -> pcs
    """

    G = "g"
    ML = "ml"
    PCS = "pcs"


class MatchStatus(str, Enum):
    MATCHED = "matched"
    REQUIRES_REVIEW = "requires_review"
    NOT_FOUND = "not_found"


class MealPlanStatus(str, Enum):
    GENERATING = "generating"
    READY = "ready"
    ERROR = "error"


class ErrorCode(str, Enum):
    VALIDATION_ERROR = "VALIDATION_ERROR"
    NOT_FOUND = "NOT_FOUND"
    INTERNAL_ERROR = "INTERNAL_ERROR"
    VKUSVILL_MCP_UNAVAILABLE = "VKUSVILL_MCP_UNAVAILABLE"
    VKUSVILL_MCP_TIMEOUT = "VKUSVILL_MCP_TIMEOUT"
    VKUSVILL_MCP_BAD_RESPONSE = "VKUSVILL_MCP_BAD_RESPONSE"
    BUDGET_TOO_LOW = "BUDGET_TOO_LOW"
    NO_SUITABLE_RECIPES = "NO_SUITABLE_RECIPES"