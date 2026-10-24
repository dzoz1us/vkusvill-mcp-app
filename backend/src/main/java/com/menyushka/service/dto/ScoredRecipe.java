package com.menyushka.service.dto;

import com.menyushka.domain.Recipe;

public record ScoredRecipe(Recipe recipe, int score) {
}