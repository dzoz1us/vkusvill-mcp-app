package com.vkusplan.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.vkusplan.domain.MealPlanMeal;

@Repository
public interface MealPlanMealRepository extends JpaRepository<MealPlanMeal, Integer> {

    List<MealPlanMeal> findByMealPlanId(Integer mealPlanId);
}