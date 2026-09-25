"""Normalization and relevance scoring for VkusVill product search.

Two responsibilities:

1. Turn a user-facing ingredient name (possibly with adjectives) into a
   short search query MCP will understand.
2. Given the raw search candidates and the ingredient, compute a match
   score and decide whether the candidate is usable.
"""

from __future__ import annotations

import re

from app.integrations.vkusvill.schemas import ProductCandidate

# Words we strip when building the search query.
_NOISE_TOKENS = {
    "свежий",
    "свежая",
    "свежее",
    "свежие",
    "замороженный",
    "замороженная",
    "замороженное",
    "замороженные",
    "без",
    "кожи",
    "кожей",
    "нарезка",
    "нарезанный",
    "нарезанная",
    "очищенный",
    "очищенная",
    "крупный",
    "крупная",
    "мелкий",
    "мелкая",
    "средний",
    "средняя",
}

# Words that indicate the candidate is not food at all.
_NON_FOOD_TOKENS = {
    "мыло",
    "шампунь",
    "порошок",
    "салфетки",
    "пакет",
    "пакеты",
    "губка",
    "тряпка",
    "стиральный",
    "чистящее",
    "бытовой",
    "бытовая",
}

# Words that indicate a conflicting product category.
_CONFLICT_TOKENS = {
    "сухарики",
    "чипсы",
    "печенье",
    "конфеты",
    "газировка",
    "лимонад",
    "кетчуп",
    "майонез",
}


def _tokens(text: str) -> set[str]:
    return set(re.findall(r"[а-яёa-z0-9]+", text.lower()))


def normalize_ingredient_query(name: str) -> str:
    """Trim adjectives and noise tokens from an ingredient name.

    Examples
    --------
    "филе куриной грудки без кожи" -> "филе куриной грудки"
    "помидоры черри свежие"        -> "помидоры черри"
    "лук репчатый крупный"          -> "лук репчатый"
    """
    tokens = name.lower().split()
    filtered = [t for t in tokens if t not in _NOISE_TOKENS]
    query = " ".join(filtered).strip()
    return query or name.lower()


def score_candidate(
    candidate: ProductCandidate,
    ingredient_name: str,
) -> float:
    """Heuristic relevance score.

    Range roughly [-15, +10]. Higher is better. Positive means "plausible".
    """
    ing_tokens = _tokens(ingredient_name)
    cand_tokens = _tokens(candidate.name)

    if not ing_tokens or not cand_tokens:
        return -5.0

    score = 0.0

    # exact / near-exact token overlap
    overlap = ing_tokens & cand_tokens
    if overlap == ing_tokens:
        score += 5.0
    elif overlap:
        score += 2.0 * len(overlap) / max(len(ing_tokens), 1)

    # dish-type conflict?
    if cand_tokens & _CONFLICT_TOKENS and not (ing_tokens & _CONFLICT_TOKENS):
        score -= 5.0

    # non-food?
    if cand_tokens & _NON_FOOD_TOKENS:
        score -= 10.0

    # packaging makes it usable for the package calculation
    if candidate.package_quantity and candidate.package_quantity > 0:
        score += 1.0

    return score


MATCH_THRESHOLD = 3.0
REVIEW_THRESHOLD = 1.0


def pick_best_candidate(
    ingredient_name: str,
    candidates: list[ProductCandidate],
) -> tuple[ProductCandidate | None, str, float]:
    """Return (best_candidate, status, score).

    status: matched | requires_review | not_found
    """
    if not candidates:
        return None, "not_found", 0.0

    scored = [(c, score_candidate(c, ingredient_name)) for c in candidates]
    scored.sort(key=lambda x: x[1], reverse=True)

    best, best_score = scored[0]
    best.match_score = best_score

    if best_score >= MATCH_THRESHOLD:
        return best, "matched", best_score
    if best_score >= REVIEW_THRESHOLD:
        return best, "requires_review", best_score
    return None, "not_found", best_score