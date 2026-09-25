"""Recipe, its ingredients, tags and required equipment."""

from sqlalchemy import Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

from app.models.ingredient import Ingredient  # noqa: F401


class Recipe(Base):
    __tablename__ = "recipes"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False, unique=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    servings: Mapped[int] = mapped_column(Integer, nullable=False, default=2)
    cook_time_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=30)

    calories: Mapped[float | None] = mapped_column(Float, nullable=True)
    protein: Mapped[float | None] = mapped_column(Float, nullable=True)
    fat: Mapped[float | None] = mapped_column(Float, nullable=True)
    carbs: Mapped[float | None] = mapped_column(Float, nullable=True)

    diet: Mapped[str] = mapped_column(String(30), nullable=False, default="none")

    meal_type: Mapped[str | None] = mapped_column(
        String(20), nullable=True
    )  # breakfast | lunch | dinner | any

    # JSON-encoded list of step strings.
    steps: Mapped[str | None] = mapped_column(Text, nullable=True)

    ingredients: Mapped[list["RecipeIngredient"]] = relationship(
        back_populates="recipe",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    tags: Mapped[list["RecipeTag"]] = relationship(
        back_populates="recipe",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    appliances: Mapped[list["RecipeAppliance"]] = relationship(
        back_populates="recipe",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Recipe id={self.id} name={self.name!r}>"

    @property
    def nutrition(self) -> dict | None:
        """Expose flat KБЖУ columns as nested dict for Pydantic."""
        if self.calories is None:
            return None
        return {
            "calories": self.calories,
            "protein": self.protein or 0,
            "fat": self.fat or 0,
            "carbs": self.carbs or 0,
        }


class RecipeIngredient(Base):
    __tablename__ = "recipe_ingredients"
    __table_args__ = (
        UniqueConstraint("recipe_id", "ingredient_id", name="uq_recipe_ingredient"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    recipe_id: Mapped[int] = mapped_column(
        ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False, index=True
    )
    ingredient_id: Mapped[int] = mapped_column(
        ForeignKey("ingredients.id", ondelete="RESTRICT"), nullable=False, index=True
    )

    quantity: Mapped[float] = mapped_column(Float, nullable=False)
    unit: Mapped[str] = mapped_column(String(20), nullable=False)

    recipe: Mapped["Recipe"] = relationship(back_populates="ingredients")
    ingredient: Mapped["Ingredient"] = relationship()


class RecipeTag(Base):
    __tablename__ = "recipe_tags"
    __table_args__ = (UniqueConstraint("recipe_id", "tag", name="uq_recipe_tag"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    recipe_id: Mapped[int] = mapped_column(
        ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False, index=True
    )
    tag: Mapped[str] = mapped_column(String(50), nullable=False)

    recipe: Mapped["Recipe"] = relationship(back_populates="tags")


class RecipeAppliance(Base):
    """Renamed from RecipeEquipment to match frontend `appliances`."""

    __tablename__ = "recipe_appliances"
    __table_args__ = (
        UniqueConstraint("recipe_id", "appliance", name="uq_recipe_appliance"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    recipe_id: Mapped[int] = mapped_column(
        ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False, index=True
    )
    appliance: Mapped[str] = mapped_column(String(50), nullable=False)

    recipe: Mapped["Recipe"] = relationship(back_populates="appliances")