package com.vkusplan.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;

import org.springframework.stereotype.Service;

import com.vkusplan.domain.Recipe;
import com.vkusplan.domain.RecipeAppliance;
import com.vkusplan.domain.RecipeTag;
import com.vkusplan.dto.GenerateRequest;
import com.vkusplan.enums.Appliance;
import com.vkusplan.enums.Diet;
import com.vkusplan.enums.MealType;
import com.vkusplan.enums.Preference;
import com.vkusplan.service.dto.ScoredRecipe;

/**
 * Recipe filtering, scoring and slot assignment.
 *
 * This step contains only pure logic — no database, no persistence.
 * Persistence and MCP enrichment will be added later.
 */
@Service
public class MealPlanService {

    public static final int MEALS_PER_DAY = 3;

    public static final List<MealType> MEAL_TYPE_ORDER = List.of(
            MealType.BREAKFAST,
            MealType.LUNCH,
            MealType.DINNER
    );

    /**
     * Which recipe.diet values are allowed for a given user diet selection.
     */
    private static final Map<Diet, Set<String>> DIET_COMPATIBILITY = Map.of(
            Diet.NONE, Set.of("none", "vegetarian", "vegan", "pescatarian"),
            Diet.VEGETARIAN, Set.of("vegetarian", "vegan"),
            Diet.VEGAN, Set.of("vegan"),
            Diet.PESCATARIAN, Set.of("pescatarian", "vegetarian", "vegan")
    );

    /**
     * Filter candidates by diet and available appliances.
     */
    public List<Recipe> filterCandidates(List<Recipe> recipes, GenerateRequest request) {
        Set<String> allowedDiets = DIET_COMPATIBILITY.get(request.getDiet());
        Set<String> userAppliances = new HashSet<>();
        for (Appliance a : request.getAppliances()) {
            userAppliances.add(a.getValue());
        }

        List<Recipe> result = new ArrayList<>();
        for (Recipe r : recipes) {
            if (!allowedDiets.contains(r.getDiet())) {
                continue;
            }
            Set<String> required = new HashSet<>();
            for (RecipeAppliance app : r.getAppliances()) {
                required.add(app.getAppliance());
            }
            if (userAppliances.containsAll(required)) {
                result.add(r);
            }
        }
        return result;
    }

    /**
     * Score by preference tags. +3 for each matching tag.
     */
    public int scoreRecipe(Recipe recipe, List<Preference> preferences) {
        Set<String> tags = new HashSet<>();
        for (RecipeTag t : recipe.getTags()) {
            tags.add(t.getTag());
        }
        int score = 0;
        for (Preference p : preferences) {
            if (tags.contains(p.getValue())) {
                score += 3;
            }
        }
        return score;
    }

    /**
     * Assign recipes to (day, meal_type) slots.
     *
     * For each meal type we build a pool: first meal-specific recipes,
     * then universal ("any" or null). We cycle through each pool if we
     * run out of recipes.
     *
     * Resulting list contains one recipe per slot, in order:
     * day1/breakfast, day1/lunch, day1/dinner, day2/breakfast, ...
     */
    public List<Recipe> selectRecipes(
            List<Recipe> candidates,
            GenerateRequest request
    ) {
        Random rng = new Random(
                request.getRandomSeed() == null ? 0L : request.getRandomSeed()
        );

        Map<MealType, List<Recipe>> pools = new EnumMap<>(MealType.class);
        for (MealType mt : MEAL_TYPE_ORDER) {
            pools.put(mt, buildPoolFor(mt, candidates, request, rng));
        }

        Map<MealType, Integer> idx = new EnumMap<>(MealType.class);
        for (MealType mt : MEAL_TYPE_ORDER) {
            idx.put(mt, 0);
        }

        List<Recipe> selected = new ArrayList<>();
        for (int day = 0; day < request.getDays().size(); day++) {
            for (MealType mt : MEAL_TYPE_ORDER) {
                List<Recipe> pool = pools.get(mt);
                int i = idx.get(mt);
                if (i >= pool.size()) {
                    i = 0; // cycle
                }
                selected.add(pool.get(i));
                idx.put(mt, i + 1);
            }
        }
        return selected;
    }

    /**
     * Build candidate pool for a single meal type.
     */
    private List<Recipe> buildPoolFor(
            MealType mealType,
            List<Recipe> candidates,
            GenerateRequest request,
            Random rng
    ) {
        List<Recipe> specific = new ArrayList<>();
        List<Recipe> universal = new ArrayList<>();
        for (Recipe r : candidates) {
            String mt = r.getMealType();
            if (mealType.getValue().equals(mt)) {
                specific.add(r);
            } else if (mt == null || "any".equals(mt)) {
                universal.add(r);
            }
        }

        List<Recipe> pool = new ArrayList<>(specific.size() + universal.size());
        pool.addAll(specific);
        pool.addAll(universal);

        if (pool.isEmpty()) {
            // Fallback: if no recipes match this slot at all, allow any candidate
            pool.addAll(candidates);
        }

        if (pool.isEmpty()) {
            throw new NoSuitableRecipesException(
                    "No recipes available for slot " + mealType.getValue()
            );
        }

        // Deterministic shuffle, then stable sort by score (desc).
        List<ScoredRecipe> scored = new ArrayList<>(pool.size());
        for (Recipe r : pool) {
            scored.add(new ScoredRecipe(r, scoreRecipe(r, request.getPreferences())));
        }
        // Shuffle using a seed derived from rng, then stable-sort by score.
        scored.sort((a, b) -> Integer.compare(b.score(), a.score()));

        // After scoring sort, apply a deterministic shuffle within equal scores
        // by using a secondary random key. To keep it simple: shuffle first
        // using rng, then stable-sort by score.
        // We already sorted by score — so shuffle must come before.
        // Do the shuffle first:
        return applyDeterministicShuffle(pool, request, rng);
    }

    /**
     * Deterministic shuffle + stable sort by score.
     */
    private List<Recipe> applyDeterministicShuffle(
            List<Recipe> pool,
            GenerateRequest request,
            Random rng
    ) {
        List<Recipe> shuffled = new ArrayList<>(pool);
        java.util.Collections.shuffle(shuffled, rng);
        shuffled.sort(
                Comparator.comparingInt(
                        (Recipe r) -> -scoreRecipe(r, request.getPreferences())
                )
        );
        return shuffled;
    }
}