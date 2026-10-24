package com.menyushka.service.dto;

import java.util.List;

public record RecipeInput(
        Integer recipeId,
        int baseServings,
        List<RecipeIngredientInput> ingredients
) {
}