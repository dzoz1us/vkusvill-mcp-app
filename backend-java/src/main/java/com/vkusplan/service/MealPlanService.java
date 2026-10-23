package com.vkusplan.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vkusplan.domain.MealPlan;
import com.vkusplan.domain.MealPlanMeal;
import com.vkusplan.domain.Recipe;
import com.vkusplan.domain.RecipeAppliance;
import com.vkusplan.domain.RecipeTag;
import com.vkusplan.dto.GenerateRequest;
import com.vkusplan.enums.Appliance;
import com.vkusplan.enums.Day;
import com.vkusplan.enums.Diet;
import com.vkusplan.enums.MealPlanStatus;
import com.vkusplan.enums.MealType;
import com.vkusplan.enums.Preference;
import com.vkusplan.repository.MealPlanMealRepository;
import com.vkusplan.repository.MealPlanRepository;
import com.vkusplan.repository.RecipeRepository;

/**
 * Recipe filtering, scoring, slot assignment and plan persistence.
 *
 * Grocery items are built separately (see GroceryService).
 */
@Service
public class MealPlanService {

    public static final int MEALS_PER_DAY = 3;

    public static final List<MealType> MEAL_TYPE_ORDER = List.of(
            MealType.BREAKFAST,
            MealType.LUNCH,
            MealType.DINNER
    );

    private static final Map<Diet, Set<String>> DIET_COMPATIBILITY = Map.of(
            Diet.NONE, Set.of("none", "vegetarian", "vegan", "pescatarian"),
            Diet.VEGETARIAN, Set.of("vegetarian", "vegan"),
            Diet.VEGAN, Set.of("vegan"),
            Diet.PESCATARIAN, Set.of("pescatarian", "vegetarian", "vegan")
    );

    private final RecipeRepository recipeRepository;
    private final MealPlanRepository mealPlanRepository;
    private final MealPlanMealRepository mealPlanMealRepository;

    public MealPlanService(
            RecipeRepository recipeRepository,
            MealPlanRepository mealPlanRepository,
            MealPlanMealRepository mealPlanMealRepository
    ) {
        this.recipeRepository = recipeRepository;
        this.mealPlanRepository = mealPlanRepository;
        this.mealPlanMealRepository = mealPlanMealRepository;
    }

    // ------------------------------------------------------------------
    // Filtering & scoring (pure logic, no persistence)
    // ------------------------------------------------------------------

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

    public List<Recipe> selectRecipes(
            List<Recipe> candidates,
            GenerateRequest request
    ) {
        long seed = request.getRandomSeed() == null ? 0L : request.getRandomSeed();
        Random rng = new Random(seed);

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
                    i = 0;
                }
                selected.add(pool.get(i));
                idx.put(mt, i + 1);
            }
        }
        return selected;
    }

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
            pool.addAll(candidates);
        }
        if (pool.isEmpty()) {
            throw new NoSuitableRecipesException(
                    "No recipes available for slot " + mealType.getValue()
            );
        }

        List<Recipe> shuffled = new ArrayList<>(pool);
        Collections.shuffle(shuffled, rng);
        shuffled.sort(
                Comparator.comparingInt(
                        (Recipe r) -> -scoreRecipe(r, request.getPreferences())
                )
        );
        return shuffled;
    }

    // ------------------------------------------------------------------
    // Persistence
    // ------------------------------------------------------------------

    /**
     * Generate a complete meal plan and persist it.
     *
     * Side effects:
     *   - creates MealPlan
     *   - creates MealPlanMeal for each (day, meal_type)
     */
    @Transactional
    public MealPlan generatePlan(GenerateRequest request) {
        List<Recipe> all = recipeRepository.findAll();
        List<Recipe> candidates = filterCandidates(all, request);
        if (candidates.isEmpty()) {
            throw new NoSuitableRecipesException(
                    "No recipes match the selected diet and appliances."
            );
        }

        List<Recipe> selected = selectRecipes(candidates, request);

        MealPlan plan = MealPlan.builder()
                .peopleCount(request.getPeopleCount())
                .budget(request.getBudget())
                .daysJson(toJson(request.getDays()))
                .preferencesJson(toJson(request.getPreferences()))
                .appliancesJson(toJson(request.getAppliances()))
                .diet(request.getDiet().getValue())
                .cartEstimatedCost(0.0)
                .unresolvedItemsCount(0)
                .status(MealPlanStatus.READY.getValue())
                .randomSeed(request.getRandomSeed())
                .createdAt(Instant.now())
                .build();

        plan = mealPlanRepository.save(plan);

        int idx = 0;
        for (Day day : request.getDays()) {
            for (MealType mt : MEAL_TYPE_ORDER) {
                Recipe recipe = selected.get(idx++);
                MealPlanMeal meal = MealPlanMeal.builder()
                        .mealPlan(plan)
                        .day(day.getValue())
                        .mealType(mt.getValue())
                        .recipe(recipe)
                        .build();
                mealPlanMealRepository.save(meal);
                plan.getMeals().add(meal);
            }
        }

        return mealPlanRepository.save(plan);
    }

    // ------------------------------------------------------------------
    // Serialization helpers
    // ------------------------------------------------------------------

    /**
     * Serialize a list of enums with {@code getValue()} into a JSON array.
     * We don't pull Jackson here to keep this method free of context.
     */
    private String toJson(List<?> values) {
        if (values == null || values.isEmpty()) {
            return "[]";
        }
        StringBuilder sb = new StringBuilder("[");
        boolean first = true;
        for (Object v : values) {
            if (!first) {
                sb.append(",");
            }
            first = false;
            sb.append("\"").append(extractValue(v)).append("\"");
        }
        sb.append("]");
        return sb.toString();
    }

    private String extractValue(Object v) {
        if (v instanceof Day d) return d.getValue();
        if (v instanceof Preference p) return p.getValue();
        if (v instanceof Appliance a) return a.getValue();
        return v.toString();
    }
}