package com.vkusplan.service.dto;

public record RecipeIngredientInput(
        Integer ingredientId,
        String name,
        double quantity,
        String unit
) {
}