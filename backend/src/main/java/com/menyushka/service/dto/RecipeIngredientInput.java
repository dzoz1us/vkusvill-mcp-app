package com.menyushka.service.dto;

public record RecipeIngredientInput(
        Integer ingredientId,
        String name,
        double quantity,
        String unit
) {
}