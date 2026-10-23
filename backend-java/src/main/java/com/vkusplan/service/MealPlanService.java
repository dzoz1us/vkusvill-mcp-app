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

import com.vkusplan.domain.GroceryItem;
import com.vkusplan.domain.Ingredient;
import com.vkusplan.domain.MealPlan;
import com.vkusplan.domain.MealPlanMeal;
import com.vkusplan.domain.Recipe;
import com.vkusplan.domain.RecipeAppliance;
import com.vkusplan.domain.RecipeIngredient;
import com.vkusplan.domain.RecipeTag;
import com.vkusplan.dto.GenerateRequest;
import com.vkusplan.enums.Appliance;
import com.vkusplan.enums.Day;
import com.vkusplan.enums.Diet;
import com.vkusplan.enums.MatchStatus;
import com.vkusplan.enums.MealPlanStatus;
import com.vkusplan.enums.MealType;
import com.vkusplan.enums.Preference;
import com.vkusplan.repository.GroceryItemRepository;
import com.vkusplan.repository.IngredientRepository;
import com.vkusplan.repository.MealPlanMealRepository;
import com.vkusplan.repository.MealPlanRepository;
import com.vkusplan.repository.RecipeRepository;
import com.vkusplan.service.dto.AggregatedIngredient;
import com.vkusplan.service.dto.RecipeIngredientInput;
import com.vkusplan.service.dto.RecipeInput;

/**
 * Recipe filtering, scoring, slot assignment, plan persistence and
 * grocery item creation.
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
    private final GroceryItemRepository groceryItemRepository;
    private final IngredientRepository ingredientRepository;
    private final GroceryService groceryService;

    public MealPlanService(
            RecipeRepository recipeRepository,
            MealPlanRepository mealPlanRepository,
            MealPlanMealRepository mealPlanMealRepository,
            GroceryItemRepository groceryItemRepository,
            IngredientRepository ingredientRepository,
            GroceryService groceryService
    ) {
        this.recipeRepository = recipeRepository;
        this.mealPlanRepository = mealPlanRepository;
        this.mealPlanMealRepository = mealPlanMealRepository;
        this.groceryItemRepository = groceryItemRepository;
        this.ingredientRepository = ingredientRepository;
        this.groceryService = groceryService;
    }

    // ------------------------------------------------------------------
    // Filtering & scoring
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

        List<MealPlanMeal> savedMeals = new ArrayList<>();
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
                savedMeals.add(mealPlanMealRepository.save(meal));
            }
        }
        plan.setMeals(savedMeals);

        List<GroceryItem> items = buildGroceryItems(plan);
        plan.setUnresolvedItemsCount(items.size());
        plan.setCartEstimatedCost(0.0);

        return mealPlanRepository.save(plan);
    }

    @Transactional
    public List<GroceryItem> buildGroceryItems(MealPlan plan) {
        groceryItemRepository.deleteByMealPlanId(plan.getId());

        List<MealPlanMeal> meals = mealPlanMealRepository.findByMealPlanId(plan.getId());
        if (meals.isEmpty()) {
            return List.of();
        }

        List<RecipeInput> recipeInputs = new ArrayList<>(meals.size());
        for (MealPlanMeal meal : meals) {
            recipeInputs.add(toRecipeInput(meal.getRecipe()));
        }

        List<AggregatedIngredient> aggregated = groceryService.aggregateIngredients(
                recipeInputs, plan.getPeopleCount()
        );

        List<GroceryItem> created = new ArrayList<>(aggregated.size());
        for (AggregatedIngredient agg : aggregated) {
            Ingredient ingredient = ingredientRepository
                    .findById(agg.ingredientId())
                    .orElse(null);

            GroceryItem item = GroceryItem.builder()
                    .mealPlan(plan)
                    .ingredient(ingredient)
                    .productName(agg.name())
                    .neededQuantity(agg.neededQuantity())
                    .neededUnit(agg.unit().getValue())
                    .matchStatus(MatchStatus.NOT_FOUND.getValue())
                    .isBought(false)
                    .isManual(false)
                    .build();

            created.add(groceryItemRepository.save(item));
        }
        return created;
    }

    private RecipeInput toRecipeInput(Recipe recipe) {
        List<RecipeIngredientInput> ings = new ArrayList<>(recipe.getIngredients().size());
        for (RecipeIngredient ri : recipe.getIngredients()) {
            Ingredient ing = ri.getIngredient();
            ings.add(new RecipeIngredientInput(
                    ing != null ? ing.getId() : null,
                    ing != null ? ing.getName() : "",
                    ri.getQuantity(),
                    ri.getUnit()
            ));
        }
        return new RecipeInput(recipe.getId(), recipe.getServings(), ings);
    }

    // ------------------------------------------------------------------
    // replace_meal
    // ------------------------------------------------------------------

    @Transactional
    public MealPlan replaceMeal(
            Integer planId,
            Integer mealId,
            Integer newRecipeId
    ) {
        MealPlan plan = mealPlanRepository.findById(planId)
                .orElseThrow(() -> new MealNotFoundException(
                        "Meal plan " + planId + " not found"
                ));

        MealPlanMeal meal = mealPlanMealRepository.findById(mealId)
                .orElseThrow(() -> new MealNotFoundException(
                        "Meal " + mealId + " not found"
                ));

        if (!meal.getMealPlan().getId().equals(plan.getId())) {
            throw new MealNotFoundException(
                    "Meal " + mealId + " does not belong to plan " + planId
            );
        }

        Integer oldRecipeId = meal.getRecipe().getId();

        GenerateRequest request = requestFromPlan(plan);
        List<Recipe> all = recipeRepository.findAll();
        List<Recipe> candidates = filterCandidates(all, request);
        List<Recipe> alternatives = candidates.stream()
                .filter(r -> !r.getId().equals(oldRecipeId))
                .toList();

        if (alternatives.isEmpty()) {
            throw new NoAlternativeRecipeException(
                    "No alternative recipe matches the plan's diet and appliances."
            );
        }

        Recipe chosen;
        if (newRecipeId != null) {
            chosen = alternatives.stream()
                    .filter(r -> r.getId().equals(newRecipeId))
                    .findFirst()
                    .orElseThrow(() -> new NoAlternativeRecipeException(
                            "Recipe " + newRecipeId + " is not a valid alternative."
                    ));
        } else {
            String targetMealType = meal.getMealType();
            chosen = alternatives.stream()
                    .filter(r -> targetMealType.equals(r.getMealType())
                            || "any".equals(r.getMealType())
                            || r.getMealType() == null)
                    .max(Comparator.comparingInt(
                            r -> scoreRecipe(r, request.getPreferences())
                    ))
                    .orElse(alternatives.get(0));
        }

        meal.setRecipe(chosen);
        mealPlanMealRepository.save(meal);

        List<GroceryItem> items = buildGroceryItems(plan);
        plan.setUnresolvedItemsCount(items.size());
        plan.setCartEstimatedCost(0.0);

        return mealPlanRepository.save(plan);
    }

    private GenerateRequest requestFromPlan(MealPlan plan) {
        return GenerateRequest.builder()
                .peopleCount(plan.getPeopleCount())
                .days(parseDays(plan.getDaysJson()))
                .budget(plan.getBudget())
                .preferences(parsePreferences(plan.getPreferencesJson()))
                .diet(Diet.fromValue(plan.getDiet()))
                .appliances(parseAppliances(plan.getAppliancesJson()))
                .randomSeed(plan.getRandomSeed())
                .build();
    }

    private List<Day> parseDays(String json) {
        List<Day> result = new ArrayList<>();
        for (String s : parseJsonStringArray(json)) {
            result.add(Day.fromValue(s));
        }
        return result;
    }

    private List<Preference> parsePreferences(String json) {
        List<Preference> result = new ArrayList<>();
        for (String s : parseJsonStringArray(json)) {
            result.add(Preference.fromValue(s));
        }
        return result;
    }

    private List<Appliance> parseAppliances(String json) {
        List<Appliance> result = new ArrayList<>();
        for (String s : parseJsonStringArray(json)) {
            result.add(Appliance.fromValue(s));
        }
        return result;
    }

    private List<String> parseJsonStringArray(String json) {
        if (json == null || json.isBlank() || "[]".equals(json.trim())) {
            return List.of();
        }
        String body = json.trim();
        if (body.startsWith("[")) body = body.substring(1);
        if (body.endsWith("]")) body = body.substring(0, body.length() - 1);

        List<String> result = new ArrayList<>();
        for (String part : body.split(",")) {
            String s = part.trim();
            if (s.startsWith("\"") && s.endsWith("\"")) {
                s = s.substring(1, s.length() - 1);
            }
            if (!s.isBlank()) {
                result.add(s);
            }
        }
        return result;
    }

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