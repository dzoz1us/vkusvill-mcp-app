package com.menyushka.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
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
import org.springframework.test.web.servlet.MockMvc;

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
class GroceryControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired RecipeRepository recipeRepository;
    @Autowired IngredientRepository ingredientRepository;
    @Autowired MealPlanRepository mealPlanRepository;
    @Autowired MealPlanMealRepository mealPlanMealRepository;
    @Autowired GroceryItemRepository groceryItemRepository;

    private String planId;

    @BeforeEach
    void setUp() throws Exception {
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
        createRecipe("Рис с овощами", "vegan", "dinner", tomato, 300);

        String generateBody = """
                {
                  "people_count": 2,
                  "days": ["mon"],
                  "budget": 5000,
                  "preferences": ["quick"],
                  "diet": "vegan",
                  "appliances": ["stove"],
                  "random_seed": 42
                }
                """;

        String json = mockMvc.perform(post("/api/meal-plans/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(generateBody))
                .andReturn().getResponse().getContentAsString();

        planId = com.jayway.jsonpath.JsonPath.read(json, "$.id");
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

    @Test
    void getGroceryListReturnsItems() throws Exception {
        mockMvc.perform(get("/api/meal-plans/" + planId + "/grocery-list"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].product_name").value("Помидор"))
                .andExpect(jsonPath("$.matched_count").value(0))
                .andExpect(jsonPath("$.not_found_count").value(1));
    }

    @Test
    void getGroceryListPlanNotFound() throws Exception {
        mockMvc.perform(get("/api/meal-plans/999999/grocery-list"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("NOT_FOUND"));
    }

    @Test
    void updateGroceryItemTogglesBought() throws Exception {
        // Get first item id
        String listJson = mockMvc.perform(get("/api/meal-plans/" + planId + "/grocery-list"))
                .andReturn().getResponse().getContentAsString();
        String itemId = com.jayway.jsonpath.JsonPath.read(listJson, "$.items[0].id");

        mockMvc.perform(patch("/api/grocery-items/" + itemId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"is_bought\": true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.is_bought").value(true))
                .andExpect(jsonPath("$.product_name").value("Помидор"));
    }

    @Test
    void addManualItemCreatesNewRow() throws Exception {
        String body = """
                {
                  "product_name": "Свежая зелень",
                  "needed_quantity": 100,
                  "needed_unit": "g",
                  "price": 150
                }
                """;

        mockMvc.perform(post("/api/meal-plans/" + planId + "/grocery-items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.product_name").value("Свежая зелень"))
                .andExpect(jsonPath("$.is_manual").value(true))
                .andExpect(jsonPath("$.total_price").value(150.0));

        // List should now have 2 items
        mockMvc.perform(get("/api/meal-plans/" + planId + "/grocery-list"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(2));
    }
}