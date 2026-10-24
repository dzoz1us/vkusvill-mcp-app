package com.menyushka.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReplaceMealRequest {

    @NotNull
    private Integer mealId;

    private Integer newRecipeId;
}