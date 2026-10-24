package com.menyushka.dto;

import com.menyushka.enums.Diet;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecipeShort {

    private String id;
    private String name;
    private String imageUrl;
    private Integer cookTimeMinutes;
    private Integer servings;
    private NutritionInfo nutrition;
    private Diet diet;

    private String description;
    private String mealType;

    @lombok.Builder.Default
    private java.util.List<CategoryRead> categories = new java.util.ArrayList<>();

    @lombok.Builder.Default
    private java.util.List<String> tags = new java.util.ArrayList<>();

    private Boolean isFavorite;

    /** Все продукты рецепта найдены во ВкусВилл — рецепт можно добавлять в план. */
    private Boolean purchasable;

    private Boolean published;
}