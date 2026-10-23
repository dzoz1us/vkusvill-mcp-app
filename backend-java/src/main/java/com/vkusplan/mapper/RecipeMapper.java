package com.vkusplan.mapper;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Component;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vkusplan.domain.Recipe;
import com.vkusplan.domain.RecipeAppliance;
import com.vkusplan.domain.RecipeIngredient;
import com.vkusplan.domain.RecipeTag;
import com.vkusplan.dto.IngredientRead;
import com.vkusplan.dto.NutritionInfo;
import com.vkusplan.dto.RecipeDetail;
import com.vkusplan.dto.RecipeShort;
import com.vkusplan.enums.Appliance;
import com.vkusplan.enums.Diet;

@Component
public class RecipeMapper {

    private final ObjectMapper objectMapper;

    public RecipeMapper(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public RecipeShort toShort(Recipe recipe) {
        if (recipe == null) return null;

        return RecipeShort.builder()
                .id(String.valueOf(recipe.getId()))
                .name(recipe.getName())
                .imageUrl(recipe.getImageUrl())
                .cookTimeMinutes(recipe.getCookTimeMinutes())
                .servings(recipe.getServings())
                .nutrition(buildNutrition(recipe))
                .diet(Diet.fromValue(recipe.getDiet()))
                .build();
    }

    public RecipeDetail toDetail(Recipe recipe) {
        if (recipe == null) return null;

        List<Appliance> appliances = new ArrayList<>();
        for (RecipeAppliance ra : recipe.getAppliances()) {
            appliances.add(Appliance.fromValue(ra.getAppliance()));
        }

        List<IngredientRead> ingredients = new ArrayList<>();
        for (RecipeIngredient ri : recipe.getIngredients()) {
            ingredients.add(IngredientRead.builder()
                    .id(ri.getIngredient() != null ? String.valueOf(ri.getIngredient().getId()) : null)
                    .name(ri.getIngredient() != null ? ri.getIngredient().getName() : "")
                    .quantity(ri.getQuantity())
                    .unit(ri.getUnit())
                    .build());
        }

        return RecipeDetail.builder()
                .id(String.valueOf(recipe.getId()))
                .name(recipe.getName())
                .imageUrl(recipe.getImageUrl())
                .cookTimeMinutes(recipe.getCookTimeMinutes())
                .servings(recipe.getServings())
                .nutrition(buildNutrition(recipe))
                .diet(Diet.fromValue(recipe.getDiet()))
                .appliances(appliances)
                .ingredients(ingredients)
                .steps(parseSteps(recipe.getSteps()))
                .build();
    }

    private NutritionInfo buildNutrition(Recipe recipe) {
        if (recipe.getCalories() == null) return null;
        return NutritionInfo.builder()
                .calories(recipe.getCalories())
                .protein(recipe.getProtein() != null ? recipe.getProtein() : 0.0)
                .fat(recipe.getFat() != null ? recipe.getFat() : 0.0)
                .carbs(recipe.getCarbs() != null ? recipe.getCarbs() : 0.0)
                .build();
    }

    private List<String> parseSteps(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (JsonProcessingException e) {
            return List.of();
        }
    }
}