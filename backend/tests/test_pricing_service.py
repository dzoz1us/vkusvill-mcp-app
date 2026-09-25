"""Tests for PricingService."""

import pytest

from app.services.pricing_service import packages_needed, total_price


class TestPackagesNeeded:
    def test_exact_multiple(self):
        assert packages_needed(900, 450) == 2

    def test_rounds_up(self):
        assert packages_needed(700, 450) == 2

    def test_single_package(self):
        assert packages_needed(100, 500) == 1

    def test_zero_needed(self):
        assert packages_needed(0, 500) == 0

    def test_zero_package_raises(self):
        with pytest.raises(ValueError):
            packages_needed(100, 0)

    def test_negative_needed_raises(self):
        with pytest.raises(ValueError):
            packages_needed(-1, 500)


class TestTotalPrice:
    def test_simple(self):
        assert total_price(2, 89.5) == 179.0

    def test_zero_packages(self):
        assert total_price(0, 89.5) == 0.0

    def test_negative_raises(self):
        with pytest.raises(ValueError):
            total_price(-1, 10)
        with pytest.raises(ValueError):
            total_price(1, -1)