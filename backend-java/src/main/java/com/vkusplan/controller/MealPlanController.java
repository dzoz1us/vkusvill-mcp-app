package com.vkusplan.controller;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
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
import com.vkusplan.domain.User;
import com.vkusplan.dto.GenerateRequest;
import com.vkusplan.dto.MealPlanRead;
import com.vkusplan.dto.ReplaceMealRequest;
import com.vkusplan.dto.ReplaceMealResponse;
import com.vkusplan.dto.RecipeShort;
import com.vkusplan.mapper.MealPlanMapper;
import com.vkusplan.mapper.RecipeMapper;
import com.vkusplan.repository.MealPlanMealRepository;
import com.vkusplan.repository.MealPlanRepository;
import com.vkusplan.repository.UserRepository;
import com.vkusplan.service.MealNotFoundException;
import com.vkusplan.service.MealPlanService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/meal-plans")
@RequiredArgsConstructor
public class MealPlanController {

    private final MealPlanService mealPlanService;
    private final MealPlanRepository mealPlanRepository;
    private final MealPlanMealRepository mealPlanMealRepository;
    private final UserRepository userRepository;
    private final MealPlanMapper mealPlanMapper;
    private final RecipeMapper recipeMapper;

    @PostMapping("/generate")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public MealPlanRead generate(
            @Valid @RequestBody GenerateRequest request,
            Authentication authentication
    ) {
        User user = resolveCurrentUser(authentication);
        MealPlan plan = mealPlanService.generatePlan(request, user);
        return mealPlanMapper.toRead(plan);
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public MealPlanRead getPlan(@PathVariable Integer id, Authentication authentication) {
        MealPlan plan = findAuthorizedPlan(id, authentication);
        return mealPlanMapper.toRead(plan);
    }

    @PostMapping("/{id}/replace-meal")
    @Transactional
    public ReplaceMealResponse replaceMeal(
            @PathVariable Integer id,
            @Valid @RequestBody ReplaceMealRequest request,
            Authentication authentication
    ) {
        MealPlan plan = findAuthorizedPlan(id, authentication);

        MealPlan updated = mealPlanService.replaceMeal(
                plan.getId(),
                request.getMealId(),
                request.getNewRecipeId()
        );

        MealPlanMeal meal = mealPlanMealRepository.findById(request.getMealId())
                .orElseThrow(() -> new MealNotFoundException(
                        "Meal " + request.getMealId() + " not found after replacement"
                ));

        RecipeShort replacedRecipe = recipeMapper.toShort(meal.getRecipe());

        return ReplaceMealResponse.builder()
                .plan(mealPlanMapper.toRead(updated))
                .replacedRecipe(replacedRecipe)
                .build();
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    private User resolveCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            return null;
        }
        String email = authentication.getName();
        return userRepository.findByEmail(email).orElse(null);
    }

    private MealPlan findAuthorizedPlan(Integer id, Authentication authentication) {
        MealPlan plan = mealPlanRepository.findById(id)
                .orElseThrow(() -> new MealNotFoundException("Meal plan " + id + " not found"));

        // Guest plan — no user_id — accessible by anyone with the id (MVP behavior)
        if (plan.getUser() == null) {
            return plan;
        }

        User currentUser = resolveCurrentUser(authentication);
        if (currentUser == null || !plan.getUser().getId().equals(currentUser.getId())) {
            throw new MealNotFoundException("Meal plan " + id + " not found");
        }
        return plan;
    }
}