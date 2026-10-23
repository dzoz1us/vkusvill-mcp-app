package com.vkusplan.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.vkusplan.domain.Ingredient;
import com.vkusplan.domain.Recipe;
import com.vkusplan.domain.RecipeIngredient;
import com.vkusplan.repository.IngredientRepository;
import com.vkusplan.repository.RecipeRepository;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class RecipeControllerTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    RecipeRepository recipeRepository;

    @Autowired
    IngredientRepository ingredientRepository;

    private Integer recipeId;

    @BeforeEach
    void setUp() {
        recipeRepository.deleteAll();
        ingredientRepository.deleteAll();

        Ingredient tomato = ingredientRepository.save(
                Ingredient.builder()
                        .name("Помидор")
                        .normalizedName("помидор")
                        .defaultUnit("g")
                        .build()
        );

        Recipe r = Recipe.builder()
                .name("Томатный суп")
                .diet("vegan")
                .mealType("lunch")
                .servings(2)
                .cookTimeMinutes(30)
                .calories(180.0)
                .protein(6.0)
                .fat(8.0)
                .carbs(22.0)
                .steps("[\"Шаг 1\",\"Шаг 2\"]")
                .build();

        r.getIngredients().add(
                RecipeIngredient.builder()
                        .recipe(r)
                        .ingredient(tomato)
                        .quantity(500.0)
                        .unit("g")
                        .build()
        );

        recipeId = recipeRepository.save(r).getId();
    }

    @Test
    void listRecipesReturnsPage() throws Exception {
        mockMvc.perform(get("/api/recipes?limit=5&offset=0"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.items[0].name").value("Томатный суп"))
                .andExpect(jsonPath("$.items[0].diet").value("vegan"))
                .andExpect(jsonPath("$.items[0].cook_time_minutes").value(30));
    }

    @Test
    void listRecipesFilterByDiet() throws Exception {
        mockMvc.perform(get("/api/recipes?diet=vegan"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1));

        mockMvc.perform(get("/api/recipes?diet=none"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(0));
    }

    @Test
    void getRecipeReturnsDetail() throws Exception {
        mockMvc.perform(get("/api/recipes/" + recipeId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(String.valueOf(recipeId)))
                .andExpect(jsonPath("$.name").value("Томатный суп"))
                .andExpect(jsonPath("$.nutrition.calories").value(180.0))
                .andExpect(jsonPath("$.ingredients[0].name").value("Помидор"))
                .andExpect(jsonPath("$.steps[0]").value("Шаг 1"));
    }

    @Test
    void getRecipeNotFound() throws Exception {
        mockMvc.perform(get("/api/recipes/999999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("NOT_FOUND"));
    }
}