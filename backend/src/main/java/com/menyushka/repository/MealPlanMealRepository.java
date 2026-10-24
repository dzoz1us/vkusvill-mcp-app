package com.menyushka.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.menyushka.domain.MealPlanMeal;

@Repository
public interface MealPlanMealRepository extends JpaRepository<MealPlanMeal, Integer> {

    List<MealPlanMeal> findByMealPlanId(Integer mealPlanId);

    boolean existsByRecipeId(Integer recipeId);
}