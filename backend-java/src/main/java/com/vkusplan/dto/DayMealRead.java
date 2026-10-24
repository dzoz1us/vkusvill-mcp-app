package com.vkusplan.dto;

import com.vkusplan.enums.Day;
import com.vkusplan.enums.MealType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DayMealRead {

    private String id;
    private Day day;
    private MealType mealType;
    private RecipeShort recipe;

    /** Порции этого блюда (по умолчанию — число людей в плане). */
    private Integer servings;
}