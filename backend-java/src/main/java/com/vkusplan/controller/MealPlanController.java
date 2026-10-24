package com.vkusplan.controller;

import java.util.ArrayList;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.vkusplan.domain.MealPlan;
import com.vkusplan.domain.MealPlanMeal;
import com.vkusplan.domain.Recipe;
import com.vkusplan.dto.GenerateRequest;
import com.vkusplan.dto.MealPlanRead;
import com.vkusplan.dto.PlanDtos.AddMealRequest;
import com.vkusplan.dto.PlanDtos.CreatePlanRequest;
import com.vkusplan.dto.PlanDtos.MealInput;
import com.vkusplan.dto.PlanDtos.PlanSummary;
import com.vkusplan.dto.PlanDtos.UpdatePlanRequest;
import com.vkusplan.dto.PlanDtos.UpdateServingsRequest;
import com.vkusplan.dto.RecipeShort;
import com.vkusplan.dto.ReplaceMealRequest;
import com.vkusplan.dto.ReplaceMealResponse;
import com.vkusplan.enums.Day;
import com.vkusplan.mapper.MealPlanMapper;
import com.vkusplan.mapper.RecipeMapper;
import com.vkusplan.repository.MealPlanMealRepository;
import com.vkusplan.repository.RecipeRepository;
import com.vkusplan.security.CurrentUser;
import com.vkusplan.service.MealNotFoundException;
import com.vkusplan.service.MealPlanService;

import jakarta.validation.Valid;

/** Планы меню клиента: создание, просмотр, редактирование, сохранение. */
@RestController
@RequestMapping("/api/meal-plans")
public class MealPlanController {

    private final MealPlanService mealPlanService;
    private final MealPlanMealRepository mealPlanMealRepository;
    private final RecipeRepository recipeRepository;
    private final MealPlanMapper mealPlanMapper;
    private final RecipeMapper recipeMapper;

    public MealPlanController(
            MealPlanService mealPlanService,
            MealPlanMealRepository mealPlanMealRepository,
            RecipeRepository recipeRepository,
            MealPlanMapper mealPlanMapper,
            RecipeMapper recipeMapper
    ) {
        this.mealPlanService = mealPlanService;
        this.mealPlanMealRepository = mealPlanMealRepository;
        this.recipeRepository = recipeRepository;
        this.mealPlanMapper = mealPlanMapper;
        this.recipeMapper = recipeMapper;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<PlanSummary> list() {
        List<PlanSummary> result = new ArrayList<>();
        for (MealPlan p : mealPlanService.listPlans(CurrentUser.id())) {
            MealPlanRead read = mealPlanMapper.toRead(p);
            result.add(new PlanSummary(
                    read.getId(),
                    read.getTitle(),
                    read.getSaved(),
                    read.getCreatedAt(),
                    p.getPeopleCount(),
                    p.getBudget(),
                    p.getCartEstimatedCost(),
                    p.getMeals().size(),
                    read.getParams().getDays()
            ));
        }
        return result;
    }

    @PostMapping("/generate")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public MealPlanRead generate(@Valid @RequestBody GenerateRequest request) {
        MealPlan plan = mealPlanService.generatePlan(request, CurrentUser.id());
        return mealPlanMapper.toRead(plan);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public MealPlanRead create(@Valid @RequestBody CreatePlanRequest request) {
        List<MealPlanService.Slot> slots = new ArrayList<>();
        if (request.meals() != null) {
            for (MealInput m : request.meals()) {
                Recipe recipe = recipeRepository.findById(m.recipeId())
                        .orElseThrow(() -> new MealNotFoundException("Recipe " + m.recipeId() + " not found"));
                slots.add(new MealPlanService.Slot(m.day(), m.mealType(), recipe, m.servings()));
            }
        }
        MealPlan plan = mealPlanService.createManualPlan(
                CurrentUser.id(), request.title(), request.peopleCount(), request.budget(), slots);
        return mealPlanMapper.toRead(plan);
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public MealPlanRead getPlan(@PathVariable Integer id) {
        return mealPlanMapper.toRead(mealPlanService.getOwned(id, CurrentUser.id()));
    }

    @PatchMapping("/{id}")
    @Transactional
    public MealPlanRead update(@PathVariable Integer id, @Valid @RequestBody UpdatePlanRequest request) {
        return mealPlanMapper.toRead(
                mealPlanService.updatePlan(id, CurrentUser.id(), request.title(), request.saved()));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void delete(@PathVariable Integer id) {
        mealPlanService.deletePlan(id, CurrentUser.id());
    }

    @PostMapping("/{id}/meals")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public MealPlanRead addMeal(@PathVariable Integer id, @Valid @RequestBody AddMealRequest request) {
        Day day = request.day();
        MealPlan plan = mealPlanService.addMeal(
                id, CurrentUser.id(), day, request.mealType(), request.recipeId(), request.servings());
        return mealPlanMapper.toRead(plan);
    }

    @DeleteMapping("/{id}/meals/{mealId}")
    @Transactional
    public MealPlanRead removeMeal(@PathVariable Integer id, @PathVariable Integer mealId) {
        return mealPlanMapper.toRead(mealPlanService.removeMeal(id, CurrentUser.id(), mealId));
    }

    @PatchMapping("/{id}/meals/{mealId}")
    @Transactional
    public MealPlanRead updateServings(
            @PathVariable Integer id,
            @PathVariable Integer mealId,
            @Valid @RequestBody UpdateServingsRequest request
    ) {
        return mealPlanMapper.toRead(
                mealPlanService.updateMealServings(id, CurrentUser.id(), mealId, request.servings()));
    }

    @PostMapping("/{id}/replace-meal")
    @Transactional
    public ReplaceMealResponse replaceMeal(
            @PathVariable Integer id,
            @Valid @RequestBody ReplaceMealRequest request
    ) {
        MealPlan plan = mealPlanService.replaceMeal(
                id,
                CurrentUser.id(),
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
