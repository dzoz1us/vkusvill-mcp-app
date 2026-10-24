package com.vkusplan.dto;

import java.util.ArrayList;
import java.util.List;

import com.vkusplan.enums.Appliance;
import com.vkusplan.enums.Diet;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecipeDetail {

    private String id;
    private String name;
    private String imageUrl;
    private Integer cookTimeMinutes;
    private Integer servings;
    private NutritionInfo nutrition;
    private Diet diet;

    private String description;
    private String mealType;

    @Builder.Default
    private List<CategoryRead> categories = new ArrayList<>();

    @Builder.Default
    private List<String> tags = new ArrayList<>();

    private Boolean isFavorite;
    private Boolean purchasable;
    private Boolean published;

    @Builder.Default
    private List<Appliance> appliances = new ArrayList<>();

    @Builder.Default
    private List<IngredientRead> ingredients = new ArrayList<>();

    @Builder.Default
    private List<String> steps = new ArrayList<>();
}