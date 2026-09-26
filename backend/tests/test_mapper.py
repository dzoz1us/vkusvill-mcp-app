"""Tests for the MCP mapper: normalization and scoring."""

from app.integrations.vkusvill.mapper import (
    normalize_ingredient_query,
    pick_best_candidate,
    score_candidate,
)
from app.integrations.vkusvill.schemas import ProductCandidate


class TestNormalize:
    def test_strips_skin_modifier(self):
        assert normalize_ingredient_query("филе куриной грудки без кожи") == "филе куриной грудки"

    def test_strips_fresh(self):
        assert normalize_ingredient_query("помидоры черри свежие") == "помидоры черри"

    def test_keeps_core_when_short(self):
        assert normalize_ingredient_query("молоко") == "молоко"

    def test_all_noise_falls_back(self):
        # if everything is stripped we return lowercase original
        assert normalize_ingredient_query("свежий") == "свежий"


class TestScore:
    def test_exact_match_scores_high(self):
        c = ProductCandidate(xml_id="1", name="куриное филе", price=100)
        assert score_candidate(c, "куриное филе") >= 5

    def test_non_food_penalized(self):
        c = ProductCandidate(xml_id="2", name="мыло жидкое", price=50)
        assert score_candidate(c, "молоко") <= -10

    def test_conflicting_category_penalized(self):
        c = ProductCandidate(xml_id="3", name="чипсы куриные", price=100)
        # ingredient is "курица" but candidate has conflict token "чипсы"
        score = score_candidate(c, "курица")
        assert score < 0

    def test_packaging_bonus(self):
        c1 = ProductCandidate(xml_id="4", name="молоко", price=100)
        c2 = ProductCandidate(xml_id="5", name="молоко", price=100, package_quantity=1.0)
        assert score_candidate(c2, "молоко") > score_candidate(c1, "молоко")


class TestPickBest:
    def test_empty_returns_not_found(self):
        best, status, score = pick_best_candidate("молоко", [])
        assert best is None
        assert status == "not_found"
        assert score == 0.0

    def test_picks_highest(self):
        candidates = [
            ProductCandidate(xml_id="1", name="мыло", price=50),
            ProductCandidate(xml_id="2", name="молоко 3.2%", price=99),
        ]
        best, status, _ = pick_best_candidate("молоко", candidates)
        assert best is not None
        assert best.xml_id == "2"
        assert status == "matched"

    def test_weak_match_review(self):
        candidates = [
            ProductCandidate(xml_id="1", name="напиток", price=50),
        ]
        _, status, _ = pick_best_candidate("молоко", candidates)
        assert status in {"requires_review", "not_found"}
