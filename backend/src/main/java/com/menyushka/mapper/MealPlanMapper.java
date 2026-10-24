package com.menyushka.mapper;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Component;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.menyushka.domain.MealPlan;
import com.menyushka.domain.MealPlanMeal;
import com.menyushka.dto.DayMealRead;
import com.menyushka.dto.MealPlanRead;
import com.menyushka.dto.OnboardingParams;
import com.menyushka.enums.Appliance;
import com.menyushka.enums.Day;
import com.menyushka.enums.Diet;
import com.menyushka.enums.MealPlanStatus;
import com.menyushka.enums.MealType;
import com.menyushka.enums.Preference;

@Component
public class MealPlanMapper {

    private final RecipeMapper recipeMapper;
    private final ObjectMapper objectMapper;

    public MealPlanMapper(RecipeMapper recipeMapper, ObjectMapper objectMapper) {
        this.recipeMapper = recipeMapper;
        this.objectMapper = objectMapper;
    }

    public MealPlanRead toRead(MealPlan plan) {
        if (plan == null) return null;

        List<MealPlanMeal> ordered = new ArrayList<>(plan.getMeals());
        ordered.sort(Comparator
                .comparingInt((MealPlanMeal m) -> Day.fromValue(m.getDay()).ordinal())
                .thenComparingInt(m -> MealType.fromValue(m.getMealType()).ordinal())
                .thenComparingInt(m -> m.getSortIndex() == null ? 0 : m.getSortIndex())
                .thenComparingInt(MealPlanMeal::getId));

        List<DayMealRead> meals = new ArrayList<>(ordered.size());
        for (MealPlanMeal m : ordered) {
            meals.add(DayMealRead.builder()
                    .id(String.valueOf(m.getId()))
                    .day(Day.fromValue(m.getDay()))
                    .mealType(MealType.fromValue(m.getMealType()))
                    .recipe(recipeMapper.toShort(m.getRecipe()))
                    .servings(m.getServings() != null ? m.getServings() : plan.getPeopleCount())
                    .build());
        }

        return MealPlanRead.builder()
                .id(String.valueOf(plan.getId()))
                .title(plan.getTitle())
                .saved(plan.getSaved())
                .createdAt(plan.getCreatedAt())
                .params(buildParams(plan))
                .meals(meals)
                .cartEstimatedCost(plan.getCartEstimatedCost())
                .budget(plan.getBudget())
                .unresolvedItemsCount(plan.getUnresolvedItemsCount())
                .omittedMeals(plan.getOmittedMeals())
                .status(MealPlanStatus.fromValue(plan.getStatus()))
                .build();
    }

    private OnboardingParams buildParams(MealPlan plan) {
        List<Day> days = new ArrayList<>();
        for (String s : parseStringArray(plan.getDaysJson())) {
            days.add(Day.fromValue(s));
        }
        List<Preference> prefs = new ArrayList<>();
        for (String s : parseStringArray(plan.getPreferencesJson())) {
            prefs.add(Preference.fromValue(s));
        }
        List<Appliance> apps = new ArrayList<>();
        for (String s : parseStringArray(plan.getAppliancesJson())) {
            apps.add(Appliance.fromValue(s));
        }

        return OnboardingParams.builder()
                .peopleCount(plan.getPeopleCount())
                .days(days)
                .budget(plan.getBudget())
                .preferences(prefs)
                .diet(Diet.fromValue(plan.getDiet()))
                .appliances(apps)
                .build();
    }

    private List<String> parseStringArray(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (JsonProcessingException e) {
            return List.of();
        }
    }
}