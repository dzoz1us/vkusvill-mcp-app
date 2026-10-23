package com.vkusplan.seed;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class RecipeIngredientSeedDto {

    @JsonProperty("normalized_name")
    private String normalizedName;

    private double quantity;
    private String unit;
}