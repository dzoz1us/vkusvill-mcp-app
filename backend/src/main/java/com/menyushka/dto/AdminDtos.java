package com.menyushka.dto;

import java.time.Instant;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

/** Запросы и ответы административной части. */
public final class AdminDtos {

    private AdminDtos() {}

    public record UpdateUserRequest(
            @Size(max = 100) String name,
            Boolean blocked,
            String role
    ) {}

    public record RecipeIngredientInput(
            @NotNull Integer ingredientId,
            @NotNull @Positive Double quantity,
            @NotBlank String unit
    ) {}

    public record RecipeUpsert(
            @NotBlank @Size(max = 200) String name,
            @Size(max = 2000) String description,
            @Size(max = 500) String imageUrl,
            String mealType,
            @NotNull @Min(1) @Max(20) Integer servings,
            @NotNull @Min(1) @Max(600) Integer cookTimeMinutes,
            Double calories,
            Double protein,
            Double fat,
            Double carbs,
            @NotBlank String diet,
            List<String> tags,
            List<String> appliances,
            List<Integer> categoryIds,
            Boolean published,
            @NotEmpty List<@NotBlank String> steps,
            @NotEmpty @Valid List<RecipeIngredientInput> ingredients
    ) {}

    public record CategoryUpsert(
            @NotBlank @Size(max = 100) String name,
            @Size(max = 100) String slug,
            Integer sortOrder
    ) {}

    public record IngredientUpsert(
            @NotBlank @Size(max = 200) String name,
            @NotBlank String defaultUnit,
            @Size(max = 100) String category
    ) {}

    public record ProductMappingRead(
            String ingredientId,
            String ingredientName,
            String ingredientCategory,
            String defaultUnit,
            boolean mapped,
            String productXmlId,
            String productName,
            String productUrl,
            Double packageQuantity,
            String packageUnit,
            Double price,
            Boolean soldByWeight,
            Double pieceWeightG,
            Boolean available,
            Instant lastCheckedAt
    ) {}

    public record ProductMappingUpsert(
            @NotBlank String productXmlId,
            @NotBlank @Size(max = 300) String productName,
            @Size(max = 500) String productUrl,
            @Positive Double packageQuantity,
            String packageUnit,
            @NotNull @Positive Double price,
            Boolean soldByWeight,
            @Positive Double pieceWeightG,
            Boolean available
    ) {}

    public record SyncResult(int checked, int updated, int unavailable, int failed) {}
}
