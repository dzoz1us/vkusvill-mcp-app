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
import com.menyushka.repository.ProductMappingRepository;
import com.menyushka.repository.RecipeRepository;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class VkusVillControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired RecipeRepository recipeRepository;
    @Autowired IngredientRepository ingredientRepository;
    @Autowired MealPlanRepository mealPlanRepository;
    @Autowired MealPlanMealRepository mealPlanMealRepository;
    @Autowired GroceryItemRepository groceryItemRepository;
    @Autowired ProductMappingRepository productMappingRepository;

    private String planId;

    @BeforeEach
    void setUp() throws Exception {
        productMappingRepository.deleteAll();
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

        String body = """
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
                        .content(body))
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
    void refreshPricesWithoutLiveMcpReturnsSameCost() throws Exception {
        // enable-live-mcp is false in test profile -> no MCP calls,
        // everything remains not_found, cost stays zero.
        mockMvc.perform(post("/api/meal-plans/" + planId + "/refresh-prices"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.plan_id").value(planId))
                .andExpect(jsonPath("$.cost_changed").value(false))
                .andExpect(jsonPath("$.new_cost").value(0.0));
    }

    @Test
    void refreshPricesPlanNotFound() throws Exception {
        mockMvc.perform(post("/api/meal-plans/999999/refresh-prices"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("NOT_FOUND"));
    }

    @Test
    void createCartWithNoMatchedItemsReturnsEmptyCarts() throws Exception {
        // Nothing matched (live MCP off) -> empty carts, but unresolved counter
        // reflects remaining items.
        mockMvc.perform(post("/api/meal-plans/" + planId + "/vkusvill-cart"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.carts.length()").value(0))
                .andExpect(jsonPath("$.unresolved_items").value(1));
    }

    @Test
    void createCartPlanNotFound() throws Exception {
        mockMvc.perform(post("/api/meal-plans/999999/vkusvill-cart"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("NOT_FOUND"));
    }

    @Test
    void groceryListAfterRefreshIsAvailable() throws Exception {
        // Just verify GET works on a generated plan
        mockMvc.perform(get("/api/meal-plans/" + planId + "/grocery-list"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.not_found_count").value(1));
    }
}