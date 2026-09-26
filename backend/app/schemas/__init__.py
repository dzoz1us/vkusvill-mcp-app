"""Public re-exports for convenience.

Import from `app.schemas` in API layer, not from individual modules,
so future refactors of file layout do not leak into business code.
"""

from app.schemas.enums import (
    Appliance,
    Day,
    Diet,
    ErrorCode,
    MatchStatus,
    MealPlanStatus,
    MealType,
    Preference,
    Unit,
)
from app.schemas.errors import ErrorBody, ErrorResponse
from app.schemas.grocery import (
    GroceryItemRead,
    GroceryItemUpdate,
    GroceryListResponse,
    ManualGroceryItemCreate,
)
from app.schemas.meal_plan import (
    CartLink,
    CartResponse,
    DayMealRead,
    GenerateRequest,
    MealPlanRead,
    OnboardingParams,
    RefreshPricesResponse,
    ReplaceMealRequest,
    ReplaceMealResponse,
)
from app.schemas.recipe import (
    IngredientRead,
    NutritionInfo,
    RecipeDetail,
    RecipeListResponse,
    RecipeShort,
)

__all__ = [
    # enums
    "Appliance",
    "Day",
    "Diet",
    "ErrorCode",
    "MatchStatus",
    "MealPlanStatus",
    "MealType",
    "Preference",
    "Unit",
    # errors
    "ErrorBody",
    "ErrorResponse",
    # grocery
    "GroceryItemRead",
    "GroceryItemUpdate",
    "GroceryListResponse",
    "ManualGroceryItemCreate",
    # meal plan
    "CartLink",
    "CartResponse",
    "DayMealRead",
    "GenerateRequest",
    "MealPlanRead",
    "OnboardingParams",
    "RefreshPricesResponse",
    "ReplaceMealRequest",
    "ReplaceMealResponse",
    # recipe
    "IngredientRead",
    "NutritionInfo",
    "RecipeDetail",
    "RecipeListResponse",
    "RecipeShort",
]
