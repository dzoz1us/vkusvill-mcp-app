package com.vkusplan.mapper;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Component;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vkusplan.domain.MealPlan;
import com.vkusplan.domain.MealPlanMeal;
import com.vkusplan.dto.DayMealRead;
import com.vkusplan.dto.MealPlanRead;
import com.vkusplan.dto.OnboardingParams;
import com.vkusplan.enums.Appliance;
import com.vkusplan.enums.Day;
import com.vkusplan.enums.Diet;
import com.vkusplan.enums.MealPlanStatus;
import com.vkusplan.enums.MealType;
import com.vkusplan.enums.Preference;

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

        List<DayMealRead> meals = new ArrayList<>(plan.getMeals().size());
        for (MealPlanMeal m : plan.getMeals()) {
            meals.add(DayMealRead.builder()
                    .id(String.valueOf(m.getId()))
                    .day(Day.fromValue(m.getDay()))
                    .mealType(MealType.fromValue(m.getMealType()))
                    .recipe(recipeMapper.toShort(m.getRecipe()))
                    .build());
        }

        return MealPlanRead.builder()
                .id(String.valueOf(plan.getId()))
                .createdAt(plan.getCreatedAt())
                .params(buildParams(plan))
                .meals(meals)
                .cartEstimatedCost(plan.getCartEstimatedCost())
                .budget(plan.getBudget())
                .unresolvedItemsCount(plan.getUnresolvedItemsCount())
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