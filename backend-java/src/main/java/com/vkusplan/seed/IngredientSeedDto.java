package com.vkusplan.seed;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class IngredientSeedDto {

    private String name;

    @JsonProperty("normalized_name")
    private String normalizedName;

    @JsonProperty("default_unit")
    private String defaultUnit;

    private String category;
}