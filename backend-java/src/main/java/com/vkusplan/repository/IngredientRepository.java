package com.vkusplan.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.vkusplan.domain.Ingredient;

@Repository
public interface IngredientRepository extends JpaRepository<Ingredient, Integer> {

    Optional<Ingredient> findByNormalizedName(String normalizedName);
}