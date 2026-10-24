package com.vkusplan.dto;

import java.util.List;

import com.vkusplan.enums.Appliance;
import com.vkusplan.enums.Day;
import com.vkusplan.enums.Diet;
import com.vkusplan.enums.Preference;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GenerateRequest {

    @NotNull
    @Min(1)
    @Max(12)
    private Integer peopleCount;

    @NotEmpty
    private List<Day> days;

    /** Бюджет на неделю, ₽. Необязателен; если указан — не меньше 500. */
    @DecimalMin(value = "500", message = "Минимальный бюджет — 500 ₽")
    private Double budget;

    @NotNull
    @Builder.Default
    private List<Preference> preferences = List.of();

    @NotNull
    @Builder.Default
    private Diet diet = Diet.NONE;

    @NotNull
    @Builder.Default
    private List<Appliance> appliances = List.of();

    private Integer randomSeed;
}