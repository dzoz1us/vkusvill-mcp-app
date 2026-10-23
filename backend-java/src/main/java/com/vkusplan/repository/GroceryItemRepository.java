package com.vkusplan.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.vkusplan.domain.GroceryItem;

@Repository
public interface GroceryItemRepository extends JpaRepository<GroceryItem, Integer> {

    List<GroceryItem> findByMealPlanId(Integer mealPlanId);

    List<GroceryItem> findByMealPlanIdAndMatchStatus(Integer mealPlanId, String matchStatus);

    @Modifying
    @Query("DELETE FROM GroceryItem g WHERE g.mealPlan.id = :planId")
    void deleteByMealPlanId(@Param("planId") Integer planId);
}