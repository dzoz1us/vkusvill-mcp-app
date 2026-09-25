"""User meal plan: N days, one recipe per day."""

from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class MealPlan(Base):
    __tablename__ = "meal_plans"

    id: Mapped[int] = mapped_column(primary_key=True)

    people_count: Mapped[int] = mapped_column(Integer, nullable=False)
    budget: Mapped[float] = mapped_column(Float, nullable=False)

    estimated_cost: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    cart_estimated_cost: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    over_budget: Mapped[bool] = mapped_column(default=False, nullable=False)

    status: Mapped[str] = mapped_column(String(30), nullable=False, default="generated")
    random_seed: Mapped[int | None] = mapped_column(Integer, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    days: Mapped[list["MealPlanDay"]] = relationship(
        back_populates="meal_plan",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="MealPlanDay.id",
    )

    def __repr__(self) -> str:
        return f"<MealPlan id={self.id} days={len(self.days)}>"


class MealPlanDay(Base):
    __tablename__ = "meal_plan_days"
    __table_args__ = (
        UniqueConstraint("meal_plan_id", "day", name="uq_plan_day"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    meal_plan_id: Mapped[int] = mapped_column(
        ForeignKey("meal_plans.id", ondelete="CASCADE"), nullable=False, index=True
    )
    day: Mapped[str] = mapped_column(String(20), nullable=False)
    recipe_id: Mapped[int] = mapped_column(
        ForeignKey("recipes.id", ondelete="RESTRICT"), nullable=False, index=True
    )

    meal_plan: Mapped["MealPlan"] = relationship(back_populates="days")

    def __repr__(self) -> str:
        return f"<MealPlanDay plan={self.meal_plan_id} day={self.day}>"