"""Unit tests for QuantityService."""

import pytest

from app.schemas.enums import Unit
from app.services.quantity_service import (
    UnknownUnitError,
    add_canonical,
    scale_quantity,
    to_canonical,
)


class TestToCanonical:
    def test_grams_stay_grams(self):
        q = to_canonical(300, "g")
        assert q.value == 300
        assert q.unit == Unit.G

    def test_kilograms_to_grams(self):
        q = to_canonical(1, "kg")
        assert q.value == 1000
        assert q.unit == Unit.G

    def test_half_kilogram(self):
        q = to_canonical(0.5, "kg")
        assert q.value == 500

    def test_liters_to_milliliters(self):
        q = to_canonical(0.5, "l")
        assert q.value == 500
        assert q.unit == Unit.ML

    def test_pieces(self):
        q = to_canonical(3, "pcs")
        assert q.value == 3
        assert q.unit == Unit.PCS

    def test_russian_aliases(self):
        assert to_canonical(1, "кг").value == 1000
        assert to_canonical(500, "мл").value == 500
        assert to_canonical(2, "шт").value == 2

    def test_case_insensitive(self):
        assert to_canonical(1, "KG").value == 1000

    def test_unknown_unit_raises(self):
        with pytest.raises(UnknownUnitError):
            to_canonical(1, "buckets")

    def test_negative_quantity_raises(self):
        with pytest.raises(ValueError):
            to_canonical(-1, "g")


class TestAddCanonical:
    def test_add_same_unit(self):
        a = to_canonical(1000, "g")
        b = to_canonical(300, "g")
        result = add_canonical(a, b)
        assert result.value == 1300
        assert result.unit == Unit.G

    def test_add_1kg_plus_300g(self):
        a = to_canonical(1, "kg")
        b = to_canonical(300, "g")
        assert add_canonical(a, b).value == 1300

    def test_add_mismatched_units_raises(self):
        a = to_canonical(100, "g")
        b = to_canonical(100, "ml")
        with pytest.raises(ValueError):
            add_canonical(a, b)


class TestScaleQuantity:
    def test_scale_2_to_4_doubles(self):
        q = scale_quantity(200, recipe_base_servings=2, people_count=4, unit="g")
        assert q.value == 400

    def test_scale_3_to_2(self):
        q = scale_quantity(300, recipe_base_servings=3, people_count=2, unit="g")
        assert q.value == pytest.approx(200)

    def test_scale_kilograms(self):
        # 1 kg for 2 people -> 2 kg for 4 people -> 2000 g
        q = scale_quantity(1, recipe_base_servings=2, people_count=4, unit="kg")
        assert q.value == 2000
        assert q.unit == Unit.G

    def test_invalid_base_servings(self):
        with pytest.raises(ValueError):
            scale_quantity(100, recipe_base_servings=0, people_count=2, unit="g")

    def test_invalid_people_count(self):
        with pytest.raises(ValueError):
            scale_quantity(100, recipe_base_servings=2, people_count=0, unit="g")