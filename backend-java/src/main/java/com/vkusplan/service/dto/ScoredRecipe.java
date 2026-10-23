package com.vkusplan.service.dto;

import com.vkusplan.domain.Recipe;

public record ScoredRecipe(Recipe recipe, int score) {
}