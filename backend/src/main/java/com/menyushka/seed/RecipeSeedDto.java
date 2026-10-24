package com.menyushka.seed;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class RecipeSeedDto {

    private String name;
    private String description;

    @JsonProperty("image_url")
    private String imageUrl;

    @JsonProperty("meal_type")
    private String mealType;

    private Integer servings;

    @JsonProperty("cook_time_minutes")
    private Integer cookTimeMinutes;

    private Double calories;
    private Double protein;
    private Double fat;
    private Double carbs;

    private String diet;

    private List<String> tags = new ArrayList<>();
    private List<String> appliances = new ArrayList<>();
    private List<RecipeIngredientSeedDto> ingredients = new ArrayList<>();
    private List<String> steps = new ArrayList<>();
}