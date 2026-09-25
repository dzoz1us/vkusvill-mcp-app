"""User meal plan: N days, three meals per day (breakfast/lunch/dinner)."""

from datetime import datetime

from sqlalchemy import (
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

from app.models.recipe import Recipe


class MealPlan(Base):
    __tablename__ = "meal_plans"

    id: Mapped[int] = mapped_column(primary_key=True)

    people_count: Mapped[int] = mapped_column(Integer, nullable=False)
    budget: Mapped[float] = mapped_column(Float, nullable=False)

    # onboarding snapshot — stored as JSON text for simplicity
    days_json: Mapped[str] = mapped_column(Text, nullable=False)
    preferences_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    appliances_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    diet: Mapped[str] = mapped_column(String(30), nullable=False, default="none")

    cart_estimated_cost: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    unresolved_items_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    status: Mapped[str] = mapped_column(String(30), nullable=False, default="ready")
    random_seed: Mapped[int | None] = mapped_column(Integer, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    meals: Mapped[list["MealPlanMeal"]] = relationship(
        back_populates="meal_plan",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="MealPlanMeal.id",
    )

    @property
    def params(self) -> dict:
        """Bundle onboarding fields into a nested dict for Pydantic."""
        import json

        return {
            "people_count": self.people_count,
            "days": json.loads(self.days_json),
            "budget": self.budget,
            "preferences": json.loads(self.preferences_json),
            "diet": self.diet,
            "appliances": json.loads(self.appliances_json),
        }

    def __repr__(self) -> str:
        return f"<MealPlan id={self.id} meals={len(self.meals)}>"


class MealPlanMeal(Base):
    """One meal slot inside a plan: (day, meal_type) -> recipe_id."""

    __tablename__ = "meal_plan_meals"
    __table_args__ = (
        UniqueConstraint("meal_plan_id", "day", "meal_type", name="uq_plan_meal_slot"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    meal_plan_id: Mapped[int] = mapped_column(
        ForeignKey("meal_plans.id", ondelete="CASCADE"), nullable=False, index=True
    )
    day: Mapped[str] = mapped_column(String(10), nullable=False)
    meal_type: Mapped[str] = mapped_column(String(20), nullable=False)
    recipe_id: Mapped[int] = mapped_column(
        ForeignKey("recipes.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    recipe: Mapped["Recipe"] = relationship(lazy="joined")

    meal_plan: Mapped["MealPlan"] = relationship(back_populates="meals")

    def __repr__(self) -> str:
        return (
            f"<MealPlanMeal plan={self.meal_plan_id} "
            f"{self.day}/{self.meal_type}>"
        )