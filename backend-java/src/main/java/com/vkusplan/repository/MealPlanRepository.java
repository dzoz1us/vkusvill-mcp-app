package com.vkusplan.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.vkusplan.domain.MealPlan;

@Repository
public interface MealPlanRepository extends JpaRepository<MealPlan, Integer> {

    java.util.List<MealPlan> findByUserIdOrderByCreatedAtDesc(Integer userId);
}