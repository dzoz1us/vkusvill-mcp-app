"""Public re-exports for convenience.

Import from `app.schemas` in API layer, not from individual modules,
so future refactors of file layout do not leak into business code.
"""

from app.schemas.enums import (
    Day,
    Diet,
    Equipment,
    ErrorCode,
    MatchStatus,
    MealPlanStatus,
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
    CartChunk,
    CartResponse,
    GenerateRequest,
    MealPlanDayRead,
    MealPlanShort,
    RefreshPricesResponse,
    ReplaceMealRequest,
)
from app.schemas.recipe import (
    IngredientBase,
    RecipeDetail,
    RecipeIngredientRead,
    RecipeListResponse,
    RecipeShort,
)

__all__ = [
    # enums
    "Day",
    "Diet",
    "Equipment",
    "ErrorCode",
    "MatchStatus",
    "MealPlanStatus",
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
    "CartChunk",
    "CartResponse",
    "GenerateRequest",
    "MealPlanDayRead",
    "MealPlanShort",
    "RefreshPricesResponse",
    "ReplaceMealRequest",
    # recipe
    "IngredientBase",
    "RecipeDetail",
    "RecipeIngredientRead",
    "RecipeListResponse",
    "RecipeShort",
]