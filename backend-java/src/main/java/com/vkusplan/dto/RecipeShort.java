package com.vkusplan.dto;

import com.vkusplan.enums.Diet;

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
}