"""Aggregated grocery items with real VkusVill product data."""

from sqlalchemy import Boolean, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class GroceryItem(Base):
    __tablename__ = "grocery_items"

    id: Mapped[int] = mapped_column(primary_key=True)

    meal_plan_id: Mapped[int] = mapped_column(
        ForeignKey("meal_plans.id", ondelete="CASCADE"), nullable=False, index=True
    )
    ingredient_id: Mapped[int | None] = mapped_column(
        ForeignKey("ingredients.id", ondelete="SET NULL"), nullable=True, index=True
    )

    # what was actually needed after aggregation
    product_name: Mapped[str] = mapped_column(String(200), nullable=False)
    needed_quantity: Mapped[float] = mapped_column(Float, nullable=False)
    needed_unit: Mapped[str] = mapped_column(String(20), nullable=False)

    # matched vkusvill product, may be missing
    product_xml_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    product_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # packaging
    package_quantity: Mapped[float | None] = mapped_column(Float, nullable=True)
    package_unit: Mapped[str | None] = mapped_column(String(20), nullable=True)
    package_count: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # price
    price_per_package: Mapped[float | None] = mapped_column(Float, nullable=True)
    total_price: Mapped[float | None] = mapped_column(Float, nullable=True)

    match_status: Mapped[str] = mapped_column(String(30), nullable=False, default="not_found")
    is_bought: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_manual: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    def __repr__(self) -> str:
        return f"<GroceryItem id={self.id} name={self.product_name!r}>"
