package com.vkusplan.mcp;

import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Normalization and relevance scoring for VkusVill product search.
 *
 * Pure functions. No DB, no HTTP. Everything here is unit-testable
 * with plain inputs.
 */
public final class Matcher {

    private Matcher() {}

    public static final double MATCH_THRESHOLD = 0.5;
    public static final double REVIEW_THRESHOLD = -3.0;

    private static final Set<String> NOISE_TOKENS = Set.of(
            "свежий", "свежая", "свежее", "свежие",
            "замороженный", "замороженная", "замороженное", "замороженные",
            "без", "кожи", "кожей",
            "нарезка", "нарезанный", "нарезанная",
            "очищенный", "очищенная",
            "крупный", "крупная", "мелкий", "мелкая", "средний", "средняя"
    );

    private static final Set<String> NON_FOOD = Set.of(
            "мыло", "шампунь", "порошок", "салфетки", "пакет", "пакеты",
            "губка", "тряпка", "стиральный", "чистящее", "бытовой", "бытовая"
    );

    private static final Set<String> CONFLICT = Set.of(
            "сухарики", "чипсы", "печенье", "конфеты", "газировка",
            "лимонад", "кетчуп", "майонез"
    );

    private static final Pattern TOKEN = Pattern.compile("[а-яa-z0-9]+");

    /** "филе куриной грудки без кожи" -> "филе куриной грудки" */
    public static String normalizeIngredientQuery(String name) {
        if (name == null) return "";
        String normalized = name.toLowerCase().replace("ё", "е");
        StringBuilder sb = new StringBuilder();
        for (String t : normalized.split("\\s+")) {
            if (t.isBlank() || NOISE_TOKENS.contains(t)) continue;
            if (sb.length() > 0) sb.append(' ');
            sb.append(t);
        }
        String result = sb.toString().trim();
        return result.isEmpty() ? normalized : result;
    }

    /** "мёд" -> {"мед"}, "Куриное филе" -> {"куриное", "филе"} */
    static Set<String> tokens(String text) {
        if (text == null) return Set.of();
        String normalized = text.toLowerCase().replace("ё", "е");
        return Arrays.stream(TOKEN.matcher(normalized).results()
                        .map(m -> m.group())
                        .toArray(String[]::new))
                .collect(Collectors.toSet());
    }

    public static double scoreCandidate(ProductCandidate c, String ingredientName) {
        Set<String> ing = tokens(ingredientName);
        Set<String> cand = tokens(c.getName());
        if (ing.isEmpty() || cand.isEmpty()) return -5.0;

        double score = 0.0;

        long overlap = ing.stream().filter(cand::contains).count();
        if (overlap == ing.size()) {
            score += 5.0;
        } else if (overlap > 0) {
            score += 2.0 * overlap / Math.max(ing.size(), 1);
        }

        if (cand.stream().anyMatch(CONFLICT::contains)
                && ing.stream().noneMatch(CONFLICT::contains)) {
            score -= 5.0;
        }
        if (cand.stream().anyMatch(NON_FOOD::contains)) {
            score -= 10.0;
        }

        if (c.getPackageQuantity() != null && c.getPackageQuantity() > 0) {
            score += 1.0;
        }

        return score;
    }

    public static MatchResult pickBestCandidate(
            String ingredientName,
            List<ProductCandidate> candidates
    ) {
        if (candidates == null || candidates.isEmpty()) {
            return new MatchResult("not_found", null, 0.0);
        }

        ProductCandidate best = null;
        double bestScore = Double.NEGATIVE_INFINITY;
        for (ProductCandidate c : candidates) {
            double s = scoreCandidate(c, ingredientName);
            if (s > bestScore) {
                bestScore = s;
                best = c;
            }
        }

        if (best != null) {
            best.setMatchScore(bestScore);
        }

        String status;
        if (bestScore >= MATCH_THRESHOLD) status = "matched";
        else if (bestScore >= REVIEW_THRESHOLD) status = "requires_review";
        else status = "not_found";

        return new MatchResult(status, best, bestScore);
    }

    public static class MatchResult {
        public final String status;
        public final ProductCandidate candidate;
        public final double score;

        public MatchResult(String status, ProductCandidate candidate, double score) {
            this.status = status;
            this.candidate = candidate;
            this.score = score;
        }
    }
}