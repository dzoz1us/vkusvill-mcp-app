package com.vkusplan.controller;

import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.vkusplan.domain.MealPlan;
import com.vkusplan.domain.MealPlanMeal;
import com.vkusplan.dto.GenerateRequest;
import com.vkusplan.dto.MealPlanRead;
import com.vkusplan.dto.ReplaceMealRequest;
import com.vkusplan.dto.ReplaceMealResponse;
import com.vkusplan.dto.RecipeShort;
import com.vkusplan.mapper.MealPlanMapper;
import com.vkusplan.mapper.RecipeMapper;
import com.vkusplan.repository.MealPlanMealRepository;
import com.vkusplan.repository.MealPlanRepository;
import com.vkusplan.service.MealNotFoundException;
import com.vkusplan.service.MealPlanService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/meal-plans")
public class MealPlanController {

    private final MealPlanService mealPlanService;
    private final MealPlanRepository mealPlanRepository;
    private final MealPlanMealRepository mealPlanMealRepository;
    private final MealPlanMapper mealPlanMapper;
    private final RecipeMapper recipeMapper;

    public MealPlanController(
            MealPlanService mealPlanService,
            MealPlanRepository mealPlanRepository,
            MealPlanMealRepository mealPlanMealRepository,
            MealPlanMapper mealPlanMapper,
            RecipeMapper recipeMapper
    ) {
        this.mealPlanService = mealPlanService;
        this.mealPlanRepository = mealPlanRepository;
        this.mealPlanMealRepository = mealPlanMealRepository;
        this.mealPlanMapper = mealPlanMapper;
        this.recipeMapper = recipeMapper;
    }

    @PostMapping("/generate")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public MealPlanRead generate(@Valid @RequestBody GenerateRequest request) {
        MealPlan plan = mealPlanService.generatePlan(request);
        return mealPlanMapper.toRead(plan);
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public MealPlanRead getPlan(@PathVariable Integer id) {
        MealPlan plan = mealPlanRepository.findById(id)
                .orElseThrow(() -> new MealNotFoundException("Meal plan " + id + " not found"));
        return mealPlanMapper.toRead(plan);
    }

    @PostMapping("/{id}/replace-meal")
    @Transactional
    public ReplaceMealResponse replaceMeal(
            @PathVariable Integer id,
            @Valid @RequestBody ReplaceMealRequest request
    ) {
        MealPlan plan = mealPlanService.replaceMeal(
                id,
                request.getMealId(),
                request.getNewRecipeId()
        );

        MealPlanMeal meal = mealPlanMealRepository.findById(request.getMealId())
                .orElseThrow(() -> new MealNotFoundException(
                        "Meal " + request.getMealId() + " not found after replacement"
                ));

        RecipeShort replacedRecipe = recipeMapper.toShort(meal.getRecipe());

        return ReplaceMealResponse.builder()
                .plan(mealPlanMapper.toRead(plan))
                .replacedRecipe(replacedRecipe)
                .build();
    }
}