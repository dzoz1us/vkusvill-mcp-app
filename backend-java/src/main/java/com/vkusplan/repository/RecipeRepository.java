package com.vkusplan.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.vkusplan.domain.Recipe;

@Repository
public interface RecipeRepository extends JpaRepository<Recipe, Integer>,
        org.springframework.data.jpa.repository.JpaSpecificationExecutor<Recipe> {

    Optional<Recipe> findByName(String name);

    Page<Recipe> findByDiet(String diet, Pageable pageable);
}