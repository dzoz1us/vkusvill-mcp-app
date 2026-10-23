package com.vkusplan.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ManualGroceryItemCreate {

    @NotBlank
    @Size(min = 1, max = 200)
    private String productName;

    @NotNull
    @Positive
    private Double neededQuantity;

    @NotBlank
    @Size(min = 1, max = 20)
    private String neededUnit;

    @Positive
    private Double price;
}