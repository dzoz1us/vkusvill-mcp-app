"""Ingredient -> VkusVill product mapping and MCP search cache."""

from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class ProductMapping(Base):
    __tablename__ = "product_mappings"
    __table_args__ = (UniqueConstraint("ingredient_id", name="uq_mapping_ingredient"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    ingredient_id: Mapped[int] = mapped_column(
        ForeignKey("ingredients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    product_xml_id: Mapped[str] = mapped_column(String(100), nullable=False)
    product_name: Mapped[str] = mapped_column(String(300), nullable=False)
    product_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    package_quantity: Mapped[float | None] = mapped_column(Float, nullable=True)
    package_unit: Mapped[str | None] = mapped_column(String(20), nullable=True)

    last_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    match_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    match_status: Mapped[str] = mapped_column(String(30), nullable=False, default="matched")

    last_checked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return f"<ProductMapping ingredient={self.ingredient_id} xml={self.product_xml_id}>"


class MCPProductCache(Base):
    __tablename__ = "mcp_product_cache"

    id: Mapped[int] = mapped_column(primary_key=True)

    query: Mapped[str] = mapped_column(String(300), nullable=False, index=True)
    response_json: Mapped[str] = mapped_column(Text, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
