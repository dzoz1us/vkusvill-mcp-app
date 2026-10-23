package com.vkusplan.seed;

import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vkusplan.domain.Ingredient;
import com.vkusplan.domain.Recipe;
import com.vkusplan.domain.RecipeAppliance;
import com.vkusplan.domain.RecipeIngredient;
import com.vkusplan.domain.RecipeTag;
import com.vkusplan.repository.IngredientRepository;
import com.vkusplan.repository.RecipeRepository;

/**
 * Idempotent seeder. Reads ingredients.json and recipes.json from
 * classpath:seed/ and populates the database.
 *
 * Safe to run multiple times: existing rows are updated, not duplicated.
 */
@Service
public class SeedService {

    private final IngredientRepository ingredientRepository;
    private final RecipeRepository recipeRepository;
    private final ObjectMapper objectMapper;

    public SeedService(
            IngredientRepository ingredientRepository,
            RecipeRepository recipeRepository,
            ObjectMapper objectMapper
    ) {
        this.ingredientRepository = ingredientRepository;
        this.recipeRepository = recipeRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public SeedSummary runSeed() {
        Map<String, Ingredient> ingredients = seedIngredients();
        int recipes = seedRecipes(ingredients);
        return new SeedSummary(ingredients.size(), recipes);
    }

    // ------------------------------------------------------------------
    // Ingredients
    // ------------------------------------------------------------------

    private Map<String, Ingredient> seedIngredients() {
        List<IngredientSeedDto> dtos = readJson("seed/ingredients.json",
                new TypeReference<List<IngredientSeedDto>>() {});

        Map<String, Ingredient> byNorm = new HashMap<>();
        for (IngredientSeedDto dto : dtos) {
            Ingredient ing = ingredientRepository
                    .findByNormalizedName(dto.getNormalizedName())
                    .orElseGet(() -> Ingredient.builder()
                            .normalizedName(dto.getNormalizedName())
                            .build());

            ing.setName(dto.getName());
            ing.setDefaultUnit(dto.getDefaultUnit());
            ing.setCategory(dto.getCategory());

            ingredientRepository.save(ing);
            byNorm.put(dto.getNormalizedName(), ing);
        }
        return byNorm;
    }

    // ------------------------------------------------------------------
    // Recipes
    // ------------------------------------------------------------------

    private int seedRecipes(Map<String, Ingredient> ingredients) {
        List<RecipeSeedDto> dtos = readJson("seed/recipes.json",
                new TypeReference<List<RecipeSeedDto>>() {});

        for (RecipeSeedDto dto : dtos) {
            Recipe recipe = recipeRepository.findByName(dto.getName())
                    .orElseGet(() -> Recipe.builder()
                            .name(dto.getName())
                            .build());

            recipe.setDescription(dto.getDescription());
            recipe.setImageUrl(dto.getImageUrl());
            recipe.setMealType(dto.getMealType());
            recipe.setServings(dto.getServings() != null ? dto.getServings() : 2);
            recipe.setCookTimeMinutes(dto.getCookTimeMinutes() != null
                    ? dto.getCookTimeMinutes() : 30);
            recipe.setCalories(dto.getCalories());
            recipe.setProtein(dto.getProtein());
            recipe.setFat(dto.getFat());
            recipe.setCarbs(dto.getCarbs());
            recipe.setDiet(dto.getDiet());
            recipe.setSteps(toJson(dto.getSteps()));

            // Wipe old relations for idempotency.
            recipe.getIngredients().clear();
            recipe.getTags().clear();
            recipe.getAppliances().clear();

            // IMPORTANT: force orphan DELETE before INSERT of new children,
            // otherwise Hibernate may insert first and violate the unique key.
            recipeRepository.flush();

            for (RecipeIngredientSeedDto ingDto : dto.getIngredients()) {
                Ingredient ing = ingredients.get(ingDto.getNormalizedName());
                if (ing == null) {
                    throw new IllegalStateException(
                            "Unknown ingredient " + ingDto.getNormalizedName()
                                    + " in recipe " + dto.getName()
                    );
                }
                recipe.getIngredients().add(RecipeIngredient.builder()
                        .recipe(recipe)
                        .ingredient(ing)
                        .quantity(ingDto.getQuantity())
                        .unit(ingDto.getUnit())
                        .build());
            }

            for (String tag : dto.getTags()) {
                recipe.getTags().add(RecipeTag.builder()
                        .recipe(recipe)
                        .tag(tag)
                        .build());
            }

            for (String appliance : dto.getAppliances()) {
                recipe.getAppliances().add(RecipeAppliance.builder()
                        .recipe(recipe)
                        .appliance(appliance)
                        .build());
            }

            recipeRepository.save(recipe);
        }

        return (int) recipeRepository.count();
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    private <T> T readJson(String classpathPath, TypeReference<T> type) {
        try (InputStream is = new ClassPathResource(classpathPath).getInputStream()) {
            return objectMapper.readValue(is, type);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to read " + classpathPath, e);
        }
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (IOException e) {
            throw new IllegalStateException("JSON serialization failed", e);
        }
    }

    public record SeedSummary(int ingredients, int recipes) {}
}