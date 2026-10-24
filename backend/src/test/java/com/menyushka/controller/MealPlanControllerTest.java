package com.menyushka.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import com.menyushka.support.TestAuthConfig;

import com.menyushka.domain.Ingredient;
import com.menyushka.domain.Recipe;
import com.menyushka.domain.RecipeAppliance;
import com.menyushka.domain.RecipeIngredient;
import com.menyushka.domain.RecipeTag;
import com.menyushka.repository.GroceryItemRepository;
import com.menyushka.repository.IngredientRepository;
import com.menyushka.repository.MealPlanMealRepository;
import com.menyushka.repository.MealPlanRepository;
import com.menyushka.repository.RecipeRepository;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestAuthConfig.class)
class MealPlanControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired RecipeRepository recipeRepository;
    @Autowired IngredientRepository ingredientRepository;
    @Autowired MealPlanRepository mealPlanRepository;
    @Autowired MealPlanMealRepository mealPlanMealRepository;
    @Autowired GroceryItemRepository groceryItemRepository;

    @BeforeEach
    void setUp() {
        groceryItemRepository.deleteAll();
        mealPlanMealRepository.deleteAll();
        mealPlanRepository.deleteAll();
        recipeRepository.deleteAll();
        ingredientRepository.deleteAll();

        Ingredient tomato = ingredientRepository.save(
                Ingredient.builder()
                        .name("Помидор")
                        .normalizedName("помидор")
                        .defaultUnit("g")
                        .build()
        );

        createRecipe("Овсянка", "vegan", "breakfast", tomato, 200);
        createRecipe("Томатный суп", "vegan", "lunch", tomato, 500);
        createRecipe("Салат", "vegan", "lunch", tomato, 400);
        createRecipe("Рис с овощами", "vegan", "dinner", tomato, 300);
    }

    private void createRecipe(String name, String diet, String mealType, Ingredient ing, double qty) {
        Recipe r = Recipe.builder()
                .name(name)
                .diet(diet)
                .mealType(mealType)
                .servings(2)
                .cookTimeMinutes(20)
                .steps("[]")
                .build();
        r.getAppliances().add(RecipeAppliance.builder().recipe(r).appliance("stove").build());
        r.getTags().add(RecipeTag.builder().recipe(r).tag("quick").build());
        r.getIngredients().add(RecipeIngredient.builder()
                .recipe(r)
                .ingredient(ing)
                .quantity(qty)
                .unit("g")
                .build());
        recipeRepository.save(r);
    }

    private String generateBody(String seed) {
        return """
                {
                  "people_count": 2,
                  "days": ["mon"],
                  "budget": 5000,
                  "preferences": ["quick"],
                  "diet": "vegan",
                  "appliances": ["stove"],
                  "random_seed": %s
                }
                """.formatted(seed);
    }

    @Test
    void generateReturnsCreatedPlan() throws Exception {
        mockMvc.perform(post("/api/meal-plans/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(generateBody("42")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isString())
                .andExpect(jsonPath("$.budget").value(5000.0))
                .andExpect(jsonPath("$.status").value("ready"))
                .andExpect(jsonPath("$.params.people_count").value(2))
                .andExpect(jsonPath("$.params.diet").value("vegan"))
                .andExpect(jsonPath("$.params.appliances[0]").value("stove"))
                .andExpect(jsonPath("$.meals.length()").value(3))
                .andExpect(jsonPath("$.meals[0].day").value("mon"));
    }

    @Test
    void generateWithInvalidPayloadReturns422() throws Exception {
        String badBody = """
                {"people_count": 0, "days": [], "budget": 0}
                """;
        mockMvc.perform(post("/api/meal-plans/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(badBody))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
    }

    @Test
    void getPlanReturnsDetails() throws Exception {
        String json = mockMvc.perform(post("/api/meal-plans/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(generateBody("42")))
                .andReturn().getResponse().getContentAsString();

        String planId = com.jayway.jsonpath.JsonPath.read(json, "$.id");

        mockMvc.perform(get("/api/meal-plans/" + planId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(planId))
                .andExpect(jsonPath("$.meals.length()").value(3));
    }

    @Test
    void getPlanNotFound() throws Exception {
        mockMvc.perform(get("/api/meal-plans/999999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("NOT_FOUND"));
    }

    @Test
    void replaceMealChangesRecipe() throws Exception {
        String json = mockMvc.perform(post("/api/meal-plans/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(generateBody("42")))
                .andReturn().getResponse().getContentAsString();

        String planId = com.jayway.jsonpath.JsonPath.read(json, "$.id");
        String oldLunchRecipe = com.jayway.jsonpath.JsonPath.read(json, "$.meals[1].recipe.name");

        // Use repository instead of plan.getMeals() to avoid lazy init exception.
        Integer mealId = mealPlanMealRepository
                .findByMealPlanId(Integer.parseInt(planId)).stream()
                .filter(m -> "lunch".equals(m.getMealType()))
                .findFirst()
                .orElseThrow()
                .getId();

        String body = "{\"meal_id\": " + mealId + "}";

        mockMvc.perform(post("/api/meal-plans/" + planId + "/replace-meal")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.plan.id").value(planId))
                .andExpect(jsonPath("$.replaced_recipe.name").isString())
                .andExpect(jsonPath("$.replaced_recipe.name").value(
                        org.hamcrest.Matchers.not(oldLunchRecipe)
                ));
    }
}