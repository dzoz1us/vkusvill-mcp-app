package com.vkusplan.seed;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import com.vkusplan.domain.Ingredient;
import com.vkusplan.domain.Recipe;
import com.vkusplan.repository.GroceryItemRepository;
import com.vkusplan.repository.IngredientRepository;
import com.vkusplan.repository.MealPlanMealRepository;
import com.vkusplan.repository.MealPlanRepository;
import com.vkusplan.repository.RecipeRepository;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class SeedServiceTest {

    @Autowired SeedService seedService;
    @Autowired RecipeRepository recipeRepository;
    @Autowired IngredientRepository ingredientRepository;
    @Autowired GroceryItemRepository groceryItemRepository;
    @Autowired MealPlanMealRepository mealPlanMealRepository;
    @Autowired MealPlanRepository mealPlanRepository;

    @BeforeEach
    void setUp() {
        groceryItemRepository.deleteAll();
        mealPlanMealRepository.deleteAll();
        mealPlanRepository.deleteAll();
        recipeRepository.deleteAll();
        ingredientRepository.deleteAll();
    }

    @Test
    void seedCreatesExpectedCounts() {
        SeedService.SeedSummary summary = seedService.runSeed();

        assertTrue(summary.ingredients() >= 41, "at least 41 ingredients");
        assertTrue(summary.recipes() >= 60, "at least 60 recipes");

        assertEquals(summary.ingredients(), ingredientRepository.count());
        assertEquals(summary.recipes(), recipeRepository.count());
    }

    @Test
    void seedIsIdempotent() {
        seedService.runSeed();
        long firstIng = ingredientRepository.count();
        long firstRec = recipeRepository.count();

        seedService.runSeed();
        long secondIng = ingredientRepository.count();
        long secondRec = recipeRepository.count();

        assertEquals(firstIng, secondIng);
        assertEquals(firstRec, secondRec);
    }

    @Test
    void seedCreatesRecipesWithRelations() {
        seedService.runSeed();

        Recipe oat = recipeRepository.findByName("Овсянка с ягодами и мёдом").orElse(null);
        assertNotNull(oat, "oatmeal recipe must exist");
        assertEquals(10, oat.getCookTimeMinutes());
        assertEquals(2, oat.getServings());
        assertEquals("vegetarian", oat.getDiet());
        assertEquals("breakfast", oat.getMealType());
        assertTrue(oat.getIngredients().size() >= 4);
        assertTrue(oat.getTags().size() >= 1);
        assertTrue(oat.getAppliances().size() >= 1);
        assertNotNull(oat.getSteps());
        assertTrue(oat.getSteps().startsWith("["));
    }

    @Test
    void sharedIngredientsExist() {
        seedService.runSeed();

        Ingredient chicken = ingredientRepository
                .findByNormalizedName("куриное филе")
                .orElse(null);
        assertNotNull(chicken, "chicken must exist");

        long recipesWithChicken = recipeRepository.findAll().stream()
                .filter(r -> r.getIngredients().stream()
                        .anyMatch(ri -> chicken.getId().equals(ri.getIngredient().getId())))
                .count();

        assertTrue(recipesWithChicken >= 3, "chicken must appear in 3+ recipes");
    }
}