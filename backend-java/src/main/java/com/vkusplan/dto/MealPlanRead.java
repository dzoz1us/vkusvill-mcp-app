package com.vkusplan.dto;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import com.vkusplan.enums.MealPlanStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MealPlanRead {

    private String id;
    private Instant createdAt;
    private OnboardingParams params;

    @Builder.Default
    private List<DayMealRead> meals = new ArrayList<>();

    private Double cartEstimatedCost;
    private Double budget;
    private Integer unresolvedItemsCount;
    private MealPlanStatus status;
}