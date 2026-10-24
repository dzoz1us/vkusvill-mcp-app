package com.vkusplan.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.vkusplan.domain.Ingredient;

@Repository
public interface IngredientRepository extends JpaRepository<Ingredient, Integer> {

    Optional<Ingredient> findByNormalizedName(String normalizedName);

    /** В скольких рецептах используется ингредиент. */
    @org.springframework.data.jpa.repository.Query("SELECT COUNT(ri) FROM RecipeIngredient ri WHERE ri.ingredient.id = :id")
    long countUsages(@org.springframework.data.repository.query.Param("id") Integer id);
}