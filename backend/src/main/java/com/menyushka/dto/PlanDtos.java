package com.menyushka.dto;

import java.time.Instant;
import java.util.List;

import com.menyushka.enums.Day;
import com.menyushka.enums.MealType;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Запросы и ответы для работы с планами меню. */
public final class PlanDtos {

    private PlanDtos() {}

    public record MealInput(
            @NotNull Day day,
            @NotNull MealType mealType,
            @NotNull Integer recipeId,
            @Min(1) @Max(12) Integer servings
    ) {}

    /** Ручное создание плана: рецепты, порции и необязательный бюджет. */
    public record CreatePlanRequest(
            @Size(max = 200) String title,
            @NotNull @Min(1) @Max(12) Integer peopleCount,
            @DecimalMin(value = "500", message = "Минимальный бюджет — 500 ₽") Double budget,
            @Valid List<MealInput> meals
    ) {}

    public record AddMealRequest(
            @NotNull Day day,
            @NotNull MealType mealType,
            @NotNull Integer recipeId,
            @Min(1) @Max(12) Integer servings
    ) {}

    public record UpdateServingsRequest(@NotNull @Min(1) @Max(12) Integer servings) {}

    public record UpdatePlanRequest(@Size(max = 200) String title, Boolean saved) {}

    public record PlanSummary(
            String id,
            String title,
            Boolean saved,
            Instant createdAt,
            Integer peopleCount,
            Double budget,
            Double cartEstimatedCost,
            Integer mealsCount,
            List<Day> days
    ) {}
}
