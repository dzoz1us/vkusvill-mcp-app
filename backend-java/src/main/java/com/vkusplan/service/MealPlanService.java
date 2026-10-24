package com.vkusplan.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vkusplan.config.AppProperties;
import com.vkusplan.domain.GroceryItem;
import com.vkusplan.domain.Ingredient;
import com.vkusplan.domain.MealPlan;
import com.vkusplan.domain.MealPlanMeal;
import com.vkusplan.domain.ProductMapping;
import com.vkusplan.domain.Recipe;
import com.vkusplan.domain.RecipeAppliance;
import com.vkusplan.domain.RecipeIngredient;
import com.vkusplan.domain.RecipeTag;
import com.vkusplan.dto.GenerateRequest;
import com.vkusplan.enums.Appliance;
import com.vkusplan.enums.Day;
import com.vkusplan.enums.Diet;
import com.vkusplan.enums.ErrorCode;
import com.vkusplan.enums.MatchStatus;
import com.vkusplan.enums.MealPlanStatus;
import com.vkusplan.enums.MealType;
import com.vkusplan.enums.Preference;
import com.vkusplan.exception.ApiException;
import com.vkusplan.repository.GroceryItemRepository;
import com.vkusplan.repository.IngredientRepository;
import com.vkusplan.repository.MealPlanMealRepository;
import com.vkusplan.repository.MealPlanRepository;
import com.vkusplan.repository.RecipeRepository;
import com.vkusplan.repository.UserRepository;
import com.vkusplan.service.dto.AggregatedIngredient;
import com.vkusplan.service.dto.RecipeIngredientInput;
import com.vkusplan.service.dto.RecipeInput;

/**
 * Подбор рецептов, расстановка по дням, подгонка под бюджет, редактирование плана
 * и сборка списка покупок.
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

    /** Одно блюдо в плане при расчёте (ещё не сохранённое). */
    public record Slot(Day day, MealType mealType, Recipe recipe, Integer servings) {}

    private record FitResult(List<Slot> slots, int omitted) {}

    private final RecipeRepository recipeRepository;
    private final MealPlanRepository mealPlanRepository;
    private final MealPlanMealRepository mealPlanMealRepository;
    private final GroceryItemRepository groceryItemRepository;
    private final IngredientRepository ingredientRepository;
    private final UserRepository userRepository;
    private final GroceryService groceryService;
    private final CatalogService catalogService;
    private final AppProperties props;

    public MealPlanService(
            RecipeRepository recipeRepository,
            MealPlanRepository mealPlanRepository,
            MealPlanMealRepository mealPlanMealRepository,
            GroceryItemRepository groceryItemRepository,
            IngredientRepository ingredientRepository,
            UserRepository userRepository,
            GroceryService groceryService,
            CatalogService catalogService,
            AppProperties props
    ) {
        this.recipeRepository = recipeRepository;
        this.mealPlanRepository = mealPlanRepository;
        this.mealPlanMealRepository = mealPlanMealRepository;
        this.groceryItemRepository = groceryItemRepository;
        this.ingredientRepository = ingredientRepository;
        this.userRepository = userRepository;
        this.groceryService = groceryService;
        this.catalogService = catalogService;
        this.props = props;
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
            if (Boolean.FALSE.equals(r.getPublished())) {
                continue;
            }
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

    /** Оставляет только рецепты, у которых все ингредиенты найдены во ВкусВилл и есть в наличии. */
    public List<Recipe> availableForPlans(List<Recipe> recipes) {
        if (!props.isStrictCatalog()) {
            return recipes;
        }
        Map<Integer, ProductMapping> mappings = catalogService.mappingsByIngredientId();
        return recipes.stream()
                .filter(r -> catalogService.isRecipePurchasable(r, mappings))
                .toList();
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

    public List<Recipe> selectRecipes(List<Recipe> candidates, GenerateRequest request) {
        return selectFromPools(buildPools(candidates, request), request.getDays().size());
    }

    private Map<MealType, List<Recipe>> buildPools(List<Recipe> candidates, GenerateRequest request) {
        long seed = request.getRandomSeed() == null ? 0L : request.getRandomSeed();
        Random rng = new Random(seed);

        Map<MealType, List<Recipe>> pools = new EnumMap<>(MealType.class);
        for (MealType mt : MEAL_TYPE_ORDER) {
            pools.put(mt, buildPoolFor(mt, candidates, request, rng));
        }
        return pools;
    }

    private List<Recipe> selectFromPools(Map<MealType, List<Recipe>> pools, int dayCount) {
        Map<MealType, Integer> idx = new EnumMap<>(MealType.class);
        for (MealType mt : MEAL_TYPE_ORDER) {
            idx.put(mt, 0);
        }

        List<Recipe> selected = new ArrayList<>();
        for (int day = 0; day < dayCount; day++) {
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
    // Cost estimation & budget fitting
    // ------------------------------------------------------------------

    /** Стоимость корзины для набора блюд (с учётом объединения одинаковых товаров и упаковок). */
    public double estimateCost(List<Slot> slots, int people) {
        if (slots.isEmpty()) {
            return 0.0;
        }
        Map<Integer, ProductMapping> mappings = catalogService.mappingsByIngredientId();
        List<RecipeInput> inputs = new ArrayList<>(slots.size());
        List<Integer> servings = new ArrayList<>(slots.size());
        for (Slot s : slots) {
            inputs.add(toRecipeInput(s.recipe()));
            servings.add(s.servings() != null ? s.servings() : people);
        }
        double total = 0.0;
        for (AggregatedIngredient a : groceryService.aggregateIngredients(inputs, servings)) {
            ProductMapping m = a.ingredientId() == null ? null : mappings.get(a.ingredientId());
            total += catalogService.purchase(m, a.neededQuantity(), a.unit().getValue())
                    .map(CatalogService.Purchase::totalPrice)
                    .orElse(0.0);
        }
        return CatalogService.round2(total);
    }

    private FitResult fitToBudget(
            List<Slot> input,
            Map<MealType, List<Recipe>> pools,
            int people,
            double budget
    ) {
        List<Slot> slots = new ArrayList<>(input);
        int omitted = 0;
        double cost = cheapen(slots, pools, people, budget);

        // не влезает — убираем самый дорогой приём пищи и снова ищем более дешёвые замены
        while (cost > budget && slots.size() > 1) {
            int dropIndex = 0;
            double dropCost = Double.MAX_VALUE;
            for (int i = 0; i < slots.size(); i++) {
                List<Slot> trial = new ArrayList<>(slots);
                trial.remove(i);
                double c = estimateCost(trial, people);
                if (c < dropCost) {
                    dropCost = c;
                    dropIndex = i;
                }
            }
            slots.remove(dropIndex);
            omitted++;
            cost = cheapen(slots, pools, people, budget);
        }

        // остался один приём пищи: берём самый дешёвый рецепт из всех подходящих
        if (cost > budget) {
            Slot only = slots.get(0);
            Recipe cheapest = only.recipe();
            double best = cost;
            for (List<Recipe> pool : pools.values()) {
                for (Recipe r : pool) {
                    double c = estimateCost(List.of(new Slot(only.day(), only.mealType(), r, only.servings())), people);
                    if (c < best) {
                        best = c;
                        cheapest = r;
                    }
                }
            }
            slots.set(0, new Slot(only.day(), only.mealType(), cheapest, only.servings()));
            cost = best;
        }

        if (cost > budget) {
            throw new ApiException(
                    ErrorCode.BUDGET_TOO_LOW,
                    HttpStatus.UNPROCESSABLE_ENTITY,
                    "Бюджет слишком мал: самый дешёвый обед на " + people + " чел. обойдётся минимум в " + money(cost)
            );
        }
        return new FitResult(slots, omitted);
    }

    /** Жадно заменяет блюда на более дешёвые аналоги того же приёма пищи; возвращает итоговую стоимость. */
    private double cheapen(List<Slot> slots, Map<MealType, List<Recipe>> pools, int people, double budget) {
        double cost = estimateCost(slots, people);
        for (int guard = 0; guard < 200 && cost > budget; guard++) {
            int bestIndex = -1;
            Recipe bestRecipe = null;
            double bestCost = cost;
            for (int i = 0; i < slots.size(); i++) {
                Slot s = slots.get(i);
                for (Recipe alt : pools.get(s.mealType())) {
                    if (alt.getId().equals(s.recipe().getId())) {
                        continue;
                    }
                    List<Slot> trial = new ArrayList<>(slots);
                    trial.set(i, new Slot(s.day(), s.mealType(), alt, s.servings()));
                    double c = estimateCost(trial, people);
                    if (c < bestCost - 0.01) {
                        bestCost = c;
                        bestIndex = i;
                        bestRecipe = alt;
                    }
                }
            }
            if (bestRecipe == null) {
                break;
            }
            Slot s = slots.get(bestIndex);
            slots.set(bestIndex, new Slot(s.day(), s.mealType(), bestRecipe, s.servings()));
            cost = bestCost;
        }
        return cost;
    }

    private static String money(double v) {
        return Math.round(v) + " ₽";
    }

    private void assertWithinBudget(MealPlan plan, double newCost) {
        double budget = plan.getBudget() == null ? 0.0 : plan.getBudget();
        if (budget > 0 && newCost > budget + 0.5) {
            throw new ApiException(
                    ErrorCode.BUDGET_EXCEEDED,
                    HttpStatus.UNPROCESSABLE_ENTITY,
                    "Корзина будет стоить " + money(newCost) + " — это больше бюджета " + money(budget)
            );
        }
    }

    // ------------------------------------------------------------------
    // Generation
    // ------------------------------------------------------------------

    @Transactional
    public MealPlan generatePlan(GenerateRequest request) {
        return generatePlan(request, null);
    }

    @Transactional
    public MealPlan generatePlan(GenerateRequest request, Integer userId) {
        List<Recipe> all = recipeRepository.findAll();
        List<Recipe> candidates = availableForPlans(filterCandidates(all, request));
        if (candidates.isEmpty()) {
            throw new NoSuitableRecipesException(
                    "No recipes match the selected diet and appliances."
            );
        }

        Map<MealType, List<Recipe>> pools = buildPools(candidates, request);
        List<Recipe> selected = selectFromPools(pools, request.getDays().size());

        List<Slot> slots = new ArrayList<>();
        int idx = 0;
        for (Day day : request.getDays()) {
            for (MealType mt : MEAL_TYPE_ORDER) {
                slots.add(new Slot(day, mt, selected.get(idx++), null));
            }
        }

        double budget = request.getBudget() == null ? 0.0 : request.getBudget();
        int omitted = 0;
        if (budget > 0) {
            FitResult fit = fitToBudget(slots, pools, request.getPeopleCount(), budget);
            slots = fit.slots();
            omitted = fit.omitted();
        }

        MealPlan plan = MealPlan.builder()
                .user(userId == null ? null : userRepository.findById(userId).orElse(null))
                .peopleCount(request.getPeopleCount())
                .budget(budget)
                .daysJson(toJson(request.getDays()))
                .preferencesJson(toJson(request.getPreferences()))
                .appliancesJson(toJson(request.getAppliances()))
                .diet(request.getDiet().getValue())
                .cartEstimatedCost(0.0)
                .unresolvedItemsCount(0)
                .omittedMeals(omitted)
                .saved(false)
                .status(MealPlanStatus.READY.getValue())
                .randomSeed(request.getRandomSeed())
                .createdAt(Instant.now())
                .build();

        plan = mealPlanRepository.save(plan);

        for (Slot s : slots) {
            plan.getMeals().add(MealPlanMeal.builder()
                    .mealPlan(plan)
                    .day(s.day().getValue())
                    .mealType(s.mealType().getValue())
                    .recipe(s.recipe())
                    .sortIndex(0)
                    .build());
        }
        plan = mealPlanRepository.saveAndFlush(plan);

        buildGroceryItems(plan);
        return mealPlanRepository.save(plan);
    }

    /** Ручное создание плана: пользователь сам выбирает рецепты и порции. */
    @Transactional
    public MealPlan createManualPlan(
            Integer userId,
            String title,
            int peopleCount,
            Double budgetOrNull,
            List<Slot> slots
    ) {
        double budget = budgetOrNull == null ? 0.0 : budgetOrNull;
        if (budget != 0.0 && budget < 500) {
            throw ApiException.badRequest("Минимальный бюджет — 500 ₽");
        }
        Map<Integer, ProductMapping> mappings = catalogService.mappingsByIngredientId();
        for (Slot s : slots) {
            requireAvailable(s.recipe(), mappings);
        }
        double cost = estimateCost(slots, peopleCount);
        if (budget > 0 && cost > budget + 0.5) {
            throw new ApiException(
                    ErrorCode.BUDGET_EXCEEDED,
                    HttpStatus.UNPROCESSABLE_ENTITY,
                    "Корзина будет стоить " + money(cost) + " — это больше бюджета " + money(budget)
            );
        }

        Set<Day> days = new LinkedHashSet<>();
        for (Slot s : slots) {
            days.add(s.day());
        }

        MealPlan plan = mealPlanRepository.save(MealPlan.builder()
                .user(userRepository.findById(userId).orElseThrow())
                .title(title)
                .peopleCount(peopleCount)
                .budget(budget)
                .daysJson(toJson(new ArrayList<>(days)))
                .preferencesJson("[]")
                .appliancesJson(toJson(List.of(Appliance.values())))
                .diet(Diet.NONE.getValue())
                .cartEstimatedCost(0.0)
                .unresolvedItemsCount(0)
                .omittedMeals(0)
                .saved(true)
                .status(MealPlanStatus.READY.getValue())
                .createdAt(Instant.now())
                .build());

        int order = 0;
        for (Slot s : slots) {
            plan.getMeals().add(MealPlanMeal.builder()
                    .mealPlan(plan)
                    .day(s.day().getValue())
                    .mealType(s.mealType().getValue())
                    .recipe(s.recipe())
                    .servings(s.servings())
                    .sortIndex(order++)
                    .build());
        }
        plan = mealPlanRepository.saveAndFlush(plan);
        buildGroceryItems(plan);
        return mealPlanRepository.save(plan);
    }

    private void requireAvailable(Recipe recipe, Map<Integer, ProductMapping> mappings) {
        if (Boolean.FALSE.equals(recipe.getPublished())) {
            throw ApiException.badRequest("Рецепт «" + recipe.getName() + "» скрыт из каталога");
        }
        if (props.isStrictCatalog() && !catalogService.isRecipePurchasable(recipe, mappings)) {
            throw new ApiException(
                    ErrorCode.VALIDATION_ERROR,
                    HttpStatus.UNPROCESSABLE_ENTITY,
                    "Для рецепта «" + recipe.getName() + "» не все продукты есть во ВкусВилл"
            );
        }
    }

    // ------------------------------------------------------------------
    // Grocery list
    // ------------------------------------------------------------------

    /**
     * Пересобирает список покупок плана: объединяет одинаковые продукты, считает упаковки и цены.
     * Ручные позиции и отметки «куплено» сохраняются.
     */
    @Transactional
    public List<GroceryItem> buildGroceryItems(MealPlan plan) {
        List<GroceryItem> previous = groceryItemRepository.findByMealPlanId(plan.getId());
        Map<Integer, Boolean> bought = new HashMap<>();
        for (GroceryItem g : previous) {
            if (!Boolean.TRUE.equals(g.getIsManual()) && g.getIngredient() != null) {
                bought.put(g.getIngredient().getId(), Boolean.TRUE.equals(g.getIsBought()));
            }
        }
        groceryItemRepository.deleteGeneratedByMealPlanId(plan.getId());

        List<MealPlanMeal> meals = mealPlanMealRepository.findByMealPlanId(plan.getId());
        List<GroceryItem> created = new ArrayList<>();

        if (!meals.isEmpty()) {
            List<RecipeInput> recipeInputs = new ArrayList<>(meals.size());
            List<Integer> servings = new ArrayList<>(meals.size());
            for (MealPlanMeal meal : meals) {
                recipeInputs.add(toRecipeInput(meal.getRecipe()));
                servings.add(effectiveServings(meal, plan));
            }

            Map<Integer, ProductMapping> mappings = catalogService.mappingsByIngredientId();
            for (AggregatedIngredient agg : groceryService.aggregateIngredients(recipeInputs, servings)) {
                Ingredient ingredient = ingredientRepository.findById(agg.ingredientId()).orElse(null);
                ProductMapping mapping = mappings.get(agg.ingredientId());

                GroceryItem item = GroceryItem.builder()
                        .mealPlan(plan)
                        .ingredient(ingredient)
                        .productName(agg.name())
                        .neededQuantity(agg.neededQuantity())
                        .neededUnit(agg.unit().getValue())
                        .matchStatus(MatchStatus.NOT_FOUND.getValue())
                        .isBought(bought.getOrDefault(agg.ingredientId(), false))
                        .isManual(false)
                        .soldByWeight(false)
                        .build();

                catalogService.purchase(mapping, agg.neededQuantity(), agg.unit().getValue())
                        .ifPresent(p -> applyPurchase(item, mapping, p));

                created.add(groceryItemRepository.save(item));
            }
        }

        recomputeTotals(plan);
        return created;
    }

    /** Заполняет позицию списка покупок данными о товаре и расчётом упаковок. */
    public void applyPurchase(GroceryItem item, ProductMapping mapping, CatalogService.Purchase p) {
        item.setProductXmlId(mapping.getProductXmlId());
        item.setProductName(mapping.getProductName());
        item.setProductUrl(mapping.getProductUrl());
        item.setPackageQuantity(p.packageQuantity());
        item.setPackageUnit(p.packageUnit());
        item.setPackageCount(p.packageCount());
        item.setPricePerPackage(p.pricePerPackage());
        item.setTotalPrice(p.totalPrice());
        item.setSoldByWeight(p.soldByWeight());
        item.setMatchStatus(MatchStatus.MATCHED.getValue());
    }

    /** Итоговая стоимость и число нерешённых позиций. */
    @Transactional
    public void recomputeTotals(MealPlan plan) {
        double total = 0.0;
        int unresolved = 0;
        for (GroceryItem g : groceryItemRepository.findByMealPlanId(plan.getId())) {
            if (g.getTotalPrice() != null) {
                total += g.getTotalPrice();
            }
            if (!Boolean.TRUE.equals(g.getIsManual())
                    && !MatchStatus.MATCHED.getValue().equals(g.getMatchStatus())) {
                unresolved++;
            }
        }
        plan.setCartEstimatedCost(CatalogService.round2(total));
        plan.setUnresolvedItemsCount(unresolved);
        mealPlanRepository.save(plan);
    }

    private int effectiveServings(MealPlanMeal meal, MealPlan plan) {
        return meal.getServings() != null && meal.getServings() > 0
                ? meal.getServings()
                : plan.getPeopleCount();
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
    // Ownership & queries
    // ------------------------------------------------------------------

    @Transactional(readOnly = true)
    public MealPlan getOwned(Integer planId, Integer userId) {
        MealPlan plan = mealPlanRepository.findById(planId)
                .orElseThrow(() -> new MealNotFoundException("Meal plan " + planId + " not found"));
        if (userId != null && (plan.getUser() == null || !plan.getUser().getId().equals(userId))) {
            throw new MealNotFoundException("Meal plan " + planId + " not found");
        }
        return plan;
    }

    @Transactional(readOnly = true)
    public List<MealPlan> listPlans(Integer userId) {
        return mealPlanRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional
    public MealPlan updatePlan(Integer planId, Integer userId, String title, Boolean saved) {
        MealPlan plan = getOwned(planId, userId);
        if (title != null) {
            plan.setTitle(title.isBlank() ? null : title.trim());
        }
        if (saved != null) {
            plan.setSaved(saved);
        }
        return mealPlanRepository.save(plan);
    }

    @Transactional
    public void deletePlan(Integer planId, Integer userId) {
        MealPlan plan = getOwned(planId, userId);
        mealPlanRepository.delete(plan);
    }

    // ------------------------------------------------------------------
    // Editing the plan: add / remove / servings / replace
    // ------------------------------------------------------------------

    private List<Slot> slotsOf(MealPlan plan) {
        List<Slot> slots = new ArrayList<>();
        for (MealPlanMeal m : mealPlanMealRepository.findByMealPlanId(plan.getId())) {
            slots.add(new Slot(Day.fromValue(m.getDay()), MealType.fromValue(m.getMealType()),
                    m.getRecipe(), m.getServings()));
        }
        return slots;
    }

    @Transactional
    public MealPlan addMeal(
            Integer planId,
            Integer userId,
            Day day,
            MealType mealType,
            Integer recipeId,
            Integer servings
    ) {
        MealPlan plan = getOwned(planId, userId);
        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new MealNotFoundException("Recipe " + recipeId + " not found"));
        requireAvailable(recipe, catalogService.mappingsByIngredientId());

        List<Slot> slots = slotsOf(plan);
        slots.add(new Slot(day, mealType, recipe, servings));
        assertWithinBudget(plan, estimateCost(slots, plan.getPeopleCount()));

        int nextIndex = slots.size();
        plan.getMeals().add(MealPlanMeal.builder()
                .mealPlan(plan)
                .day(day.getValue())
                .mealType(mealType.getValue())
                .recipe(recipe)
                .servings(servings)
                .sortIndex(nextIndex)
                .build());

        List<String> days = parseJsonStringArray(plan.getDaysJson());
        if (!days.contains(day.getValue())) {
            List<Day> updated = new ArrayList<>();
            for (String d : days) {
                updated.add(Day.fromValue(d));
            }
            updated.add(day);
            plan.setDaysJson(toJson(updated));
        }
        plan = mealPlanRepository.saveAndFlush(plan);
        buildGroceryItems(plan);
        return mealPlanRepository.save(plan);
    }

    @Transactional
    public MealPlan removeMeal(Integer planId, Integer userId, Integer mealId) {
        MealPlan plan = getOwned(planId, userId);
        MealPlanMeal meal = requireMeal(plan, mealId);
        plan.getMeals().removeIf(m -> m.getId().equals(meal.getId()));
        plan = mealPlanRepository.saveAndFlush(plan);
        buildGroceryItems(plan);
        return mealPlanRepository.save(plan);
    }

    @Transactional
    public MealPlan updateMealServings(Integer planId, Integer userId, Integer mealId, Integer servings) {
        MealPlan plan = getOwned(planId, userId);
        MealPlanMeal meal = requireMeal(plan, mealId);
        if (servings == null || servings < 1 || servings > 12) {
            throw ApiException.badRequest("Порций должно быть от 1 до 12");
        }

        List<Slot> slots = new ArrayList<>();
        for (MealPlanMeal m : mealPlanMealRepository.findByMealPlanId(plan.getId())) {
            Integer s = m.getId().equals(meal.getId()) ? servings : m.getServings();
            slots.add(new Slot(Day.fromValue(m.getDay()), MealType.fromValue(m.getMealType()), m.getRecipe(), s));
        }
        assertWithinBudget(plan, estimateCost(slots, plan.getPeopleCount()));

        meal.setServings(servings);
        mealPlanMealRepository.saveAndFlush(meal);
        buildGroceryItems(plan);
        return mealPlanRepository.save(plan);
    }

    private MealPlanMeal requireMeal(MealPlan plan, Integer mealId) {
        MealPlanMeal meal = mealPlanMealRepository.findById(mealId)
                .orElseThrow(() -> new MealNotFoundException("Meal " + mealId + " not found"));
        if (!meal.getMealPlan().getId().equals(plan.getId())) {
            throw new MealNotFoundException(
                    "Meal " + mealId + " does not belong to plan " + plan.getId()
            );
        }
        return meal;
    }

    // ------------------------------------------------------------------
    // replace_meal
    // ------------------------------------------------------------------

    @Transactional
    public MealPlan replaceMeal(Integer planId, Integer mealId, Integer newRecipeId) {
        return replaceMeal(planId, null, mealId, newRecipeId);
    }

    @Transactional
    public MealPlan replaceMeal(Integer planId, Integer userId, Integer mealId, Integer newRecipeId) {
        MealPlan plan = getOwned(planId, userId);
        MealPlanMeal meal = requireMeal(plan, mealId);

        Integer oldRecipeId = meal.getRecipe().getId();

        GenerateRequest request = requestFromPlan(plan);
        List<Recipe> all = recipeRepository.findAll();
        List<Recipe> candidates = availableForPlans(filterCandidates(all, request));
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
            assertWithinBudget(plan, costWith(plan, meal.getId(), chosen));
        } else {
            String targetMealType = meal.getMealType();
            List<Recipe> ranked = alternatives.stream()
                    .filter(r -> targetMealType.equals(r.getMealType())
                            || "any".equals(r.getMealType())
                            || r.getMealType() == null)
                    .sorted(Comparator.comparingInt(
                            (Recipe r) -> -scoreRecipe(r, request.getPreferences())
                    ))
                    .toList();
            if (ranked.isEmpty()) {
                ranked = alternatives;
            }
            double budget = plan.getBudget() == null ? 0.0 : plan.getBudget();
            chosen = null;
            for (Recipe r : ranked) {
                if (budget <= 0 || costWith(plan, meal.getId(), r) <= budget + 0.5) {
                    chosen = r;
                    break;
                }
            }
            if (chosen == null) {
                throw new ApiException(
                        ErrorCode.BUDGET_EXCEEDED,
                        HttpStatus.UNPROCESSABLE_ENTITY,
                        "Подходящей замены в рамках бюджета " + money(budget) + " нет"
                );
            }
        }

        meal.setRecipe(chosen);
        mealPlanMealRepository.saveAndFlush(meal);

        buildGroceryItems(plan);
        return mealPlanRepository.save(plan);
    }

    private double costWith(MealPlan plan, Integer mealId, Recipe replacement) {
        List<Slot> slots = new ArrayList<>();
        for (MealPlanMeal m : mealPlanMealRepository.findByMealPlanId(plan.getId())) {
            Recipe r = m.getId().equals(mealId) ? replacement : m.getRecipe();
            slots.add(new Slot(Day.fromValue(m.getDay()), MealType.fromValue(m.getMealType()), r, m.getServings()));
        }
        return estimateCost(slots, plan.getPeopleCount());
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
