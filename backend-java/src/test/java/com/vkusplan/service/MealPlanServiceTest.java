package com.vkusplan.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
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
import com.vkusplan.enums.Preference;
import com.vkusplan.repository.GroceryItemRepository;
import com.vkusplan.repository.IngredientRepository;
import com.vkusplan.repository.MealPlanMealRepository;
import com.vkusplan.repository.MealPlanRepository;
import com.vkusplan.repository.RecipeRepository;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class MealPlanServiceTest {

    @Autowired MealPlanService service;
    @Autowired RecipeRepository recipeRepository;
    @Autowired IngredientRepository ingredientRepository;
    @Autowired MealPlanRepository mealPlanRepository;
    @Autowired MealPlanMealRepository mealPlanMealRepository;
    @Autowired GroceryItemRepository groceryItemRepository;

    private Ingredient chicken;
    private Ingredient tomato;

    @BeforeEach
    void setUp() {
        groceryItemRepository.deleteAll();
        mealPlanMealRepository.deleteAll();
        mealPlanRepository.deleteAll();
        recipeRepository.deleteAll();
        ingredientRepository.deleteAll();

        chicken = ingredientRepository.save(
                Ingredient.builder()
                        .name("Куриное филе")
                        .normalizedName("куриное филе")
                        .defaultUnit("g")
                        .category("meat")
                        .build()
        );
        tomato = ingredientRepository.save(
                Ingredient.builder()
                        .name("Помидор")
                        .normalizedName("помидор")
                        .defaultUnit("g")
                        .category("vegetable")
                        .build()
        );

        createRecipe("Овсянка", "vegan", "breakfast",
                List.of("stove"), List.of("quick"), tomato, 200);

        createRecipe("Томатный суп", "vegan", "lunch",
                List.of("stove"), List.of("healthy"), tomato, 500);
        createRecipe("Салат", "vegan", "lunch",
                List.of("stove"), List.of("low_calorie"), tomato, 400);

        createRecipe("Рис с овощами", "vegan", "dinner",
                List.of("stove"), List.of("budget"), tomato, 300);
        createRecipe("Плов", "vegan", "dinner",
                List.of("stove"), List.of("hearty"), tomato, 250);

        createRecipe("Запеканка", "none", "breakfast",
                List.of("oven"), List.of("family"), chicken, 400);

        createRecipe("Смузи", "vegan", "any",
                List.of("microwave"), List.of("quick"), tomato, 100);
    }

    private Recipe createRecipe(
            String name, String diet, String mealType,
            List<String> appliances, List<String> tags,
            Ingredient ing, double qty
    ) {
        Recipe r = Recipe.builder()
                .name(name)
                .diet(diet)
                .mealType(mealType)
                .servings(2)
                .cookTimeMinutes(20)
                .build();

        for (String a : appliances) {
            r.getAppliances().add(RecipeAppliance.builder().recipe(r).appliance(a).build());
        }
        for (String t : tags) {
            r.getTags().add(RecipeTag.builder().recipe(r).tag(t).build());
        }
        r.getIngredients().add(RecipeIngredient.builder()
                .recipe(r)
                .ingredient(ing)
                .quantity(qty)
                .unit("g")
                .build());

        return recipeRepository.save(r);
    }

    private GenerateRequest request(Diet diet, List<Appliance> apps, Long seed) {
        return GenerateRequest.builder()
                .peopleCount(2)
                .days(List.of(Day.MON, Day.TUE))
                .budget(5000.0)
                .preferences(List.of(Preference.QUICK))
                .diet(diet)
                .appliances(apps)
                .randomSeed(seed == null ? null : seed.intValue())
                .build();
    }

    // ------------------------------------------------------------------
    // generatePlan
    // ------------------------------------------------------------------

    @Test
    void generatePlanCreatesMealsAndGroceryItems() {
        GenerateRequest req = request(Diet.VEGAN, List.of(Appliance.STOVE), 42L);
        MealPlan plan = service.generatePlan(req, null); // <--- ДОБАВЛЕН null

        assertEquals(2, plan.getPeopleCount());

        List<MealPlanMeal> meals = mealPlanMealRepository.findByMealPlanId(plan.getId());
        assertEquals(6, meals.size()); // 2 days × 3 meal types

        List<GroceryItem> items = groceryItemRepository.findByMealPlanId(plan.getId());
        assertTrue(items.size() > 0);
        assertEquals(items.size(), plan.getUnresolvedItemsCount());
    }

    @Test
    void dietFilterExcludesNonVegan() {
        GenerateRequest req = request(Diet.VEGAN, List.of(Appliance.STOVE), 42L);
        MealPlan plan = service.generatePlan(req, null); // <--- ДОБАВЛЕН null

        List<MealPlanMeal> meals = mealPlanMealRepository.findByMealPlanId(plan.getId());
        Set<String> recipeNames = meals.stream()
                .map(m -> m.getRecipe().getName())
                .collect(Collectors.toSet());

        assertTrue(recipeNames.contains("Овсянка"));
        assertTrue(recipeNames.contains("Томатный суп"));
        assertTrue(recipeNames.contains("Рис с овощами"));
        assertTrue(!recipeNames.contains("Запеканка"));
    }

    @Test
    void applianceFilterExcludesMissingTech() {
        GenerateRequest req = request(Diet.VEGAN, List.of(Appliance.STOVE), 42L);
        MealPlan plan = service.generatePlan(req, null); // <--- ДОБАВЛЕН null

        List<MealPlanMeal> meals = mealPlanMealRepository.findByMealPlanId(plan.getId());
        for (MealPlanMeal m : meals) {
            List<RecipeAppliance> apps = m.getRecipe().getAppliances();
            for (RecipeAppliance a : apps) {
                assertEquals("stove", a.getAppliance());
            }
        }
    }

    @Test
    void sameSeedProducesSamePlan() {
        GenerateRequest req1 = request(Diet.VEGAN, List.of(Appliance.STOVE), 42L);
        MealPlan plan1 = service.generatePlan(req1, null); // <--- ДОБАВЛЕН null

        GenerateRequest req2 = request(Diet.VEGAN, List.of(Appliance.STOVE), 42L);
        MealPlan plan2 = service.generatePlan(req2, null); // <--- ДОБАВЛЕН null

        List<Integer> ids1 = mealPlanMealRepository.findByMealPlanId(plan1.getId())
                .stream().map(m -> m.getRecipe().getId()).toList();
        List<Integer> ids2 = mealPlanMealRepository.findByMealPlanId(plan2.getId())
                .stream().map(m -> m.getRecipe().getId()).toList();

        assertEquals(ids1, ids2);
    }

    @Test
    void noCandidatesThrows() {
        GenerateRequest req = request(Diet.VEGAN, List.of(Appliance.AIR_FRYER), 42L);
        assertThrows(NoSuitableRecipesException.class, () -> service.generatePlan(req, null)); // <--- ДОБАВЛЕН null
    }

    @Test
    void buildGroceryItemsIsIdempotent() {
        GenerateRequest req = request(Diet.VEGAN, List.of(Appliance.STOVE), 42L);
        MealPlan plan = service.generatePlan(req, null); // <--- ДОБАВЛЕН null

        int firstCount = groceryItemRepository.findByMealPlanId(plan.getId()).size();
        service.buildGroceryItems(plan);
        int secondCount = groceryItemRepository.findByMealPlanId(plan.getId()).size();

        assertEquals(firstCount, secondCount);
    }

    // ------------------------------------------------------------------
    // replaceMeal
    // ------------------------------------------------------------------

    @Test
    void replaceMealChangesRecipeAndRebuildsGrocery() {
        GenerateRequest req = request(Diet.VEGAN, List.of(Appliance.STOVE), 42L);
        MealPlan plan = service.generatePlan(req, null); // <--- ДОБАВЛЕН null

        MealPlanMeal lunch = mealPlanMealRepository
                .findByMealPlanId(plan.getId()).stream()
                .filter(m -> "lunch".equals(m.getMealType()))
                .findFirst()
                .orElseThrow();

        Integer oldRecipeId = lunch.getRecipe().getId();

        GroceryItem tomatoBefore = groceryItemRepository
                .findByMealPlanId(plan.getId()).stream()
                .filter(i -> tomato.getId().equals(i.getIngredient().getId()))
                .findFirst()
                .orElseThrow();
        double qtyBefore = tomatoBefore.getNeededQuantity();

        service.replaceMeal(plan.getId(), lunch.getId(), null);

        MealPlanMeal newLunch = mealPlanMealRepository.findById(lunch.getId()).orElseThrow();
        assertNotEquals(oldRecipeId, newLunch.getRecipe().getId());

        GroceryItem tomatoAfter = groceryItemRepository
                .findByMealPlanId(plan.getId()).stream()
                .filter(i -> tomato.getId().equals(i.getIngredient().getId()))
                .findFirst()
                .orElseThrow();
        double qtyAfter = tomatoAfter.getNeededQuantity();
        assertNotEquals(qtyBefore, qtyAfter);
    }

    @Test
    void replaceMealWithExplicitRecipeId() {
        GenerateRequest req = request(Diet.VEGAN, List.of(Appliance.STOVE), 42L);
        MealPlan plan = service.generatePlan(req, null); // <--- ДОБАВЛЕН null

        MealPlanMeal lunch = mealPlanMealRepository
                .findByMealPlanId(plan.getId()).stream()
                .filter(m -> "lunch".equals(m.getMealType()))
                .findFirst()
                .orElseThrow();

        Integer pilafId = recipeRepository.findByName("Плов").orElseThrow().getId();

        service.replaceMeal(plan.getId(), lunch.getId(), pilafId);

        MealPlanMeal newLunch = mealPlanMealRepository.findById(lunch.getId()).orElseThrow();
        assertEquals(pilafId, newLunch.getRecipe().getId());
    }

    @Test
    void replaceMealNoAlternatives() {
        GenerateRequest req = request(Diet.VEGAN, List.of(Appliance.MICROWAVE), 42L);
        MealPlan plan = service.generatePlan(req, null); // <--- ДОБАВЛЕН null

        MealPlanMeal anyMeal = mealPlanMealRepository
                .findByMealPlanId(plan.getId()).stream()
                .findFirst()
                .orElseThrow();

        assertThrows(
                NoAlternativeRecipeException.class,
                () -> service.replaceMeal(plan.getId(), anyMeal.getId(), null)
        );
    }

    @Test
    void replaceMealNotFound() {
        GenerateRequest req = request(Diet.VEGAN, List.of(Appliance.STOVE), 42L);
        MealPlan plan = service.generatePlan(req, null); // <--- ДОБАВЛЕН null

        assertThrows(
                MealNotFoundException.class,
                () -> service.replaceMeal(plan.getId(), 99_999, null)
        );
    }

    @Test
    void replaceMealForeignMealThrows() {
        GenerateRequest req = request(Diet.VEGAN, List.of(Appliance.STOVE), 42L);
        MealPlan plan1 = service.generatePlan(req, null); // <--- ДОБАВЛЕН null
        MealPlan plan2 = service.generatePlan(req, null); // <--- ДОБАВЛЕН null

        MealPlanMeal plan1Lunch = mealPlanMealRepository
                .findByMealPlanId(plan1.getId()).stream()
                .filter(m -> "lunch".equals(m.getMealType()))
                .findFirst()
                .orElseThrow();

        assertThrows(
                MealNotFoundException.class,
                () -> service.replaceMeal(plan2.getId(), plan1Lunch.getId(), null)
        );
    }

    @Test
    void replaceMealRejectsInvalidExplicitRecipe() {
        GenerateRequest req = request(Diet.VEGAN, List.of(Appliance.STOVE), 42L);
        MealPlan plan = service.generatePlan(req, null); // <--- ДОБАВЛЕН null

        MealPlanMeal lunch = mealPlanMealRepository
                .findByMealPlanId(plan.getId()).stream()
                .filter(m -> "lunch".equals(m.getMealType()))
                .findFirst()
                .orElseThrow();

        Integer casseroleId = recipeRepository.findByName("Запеканка")
                .orElseThrow().getId();

        assertThrows(
                NoAlternativeRecipeException.class,
                () -> service.replaceMeal(plan.getId(), lunch.getId(), casseroleId)
        );
    }
}