package com.menyushka.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.menyushka.domain.RecipeCategory;

@Repository
public interface RecipeCategoryRepository extends JpaRepository<RecipeCategory, Integer> {

    Optional<RecipeCategory> findBySlug(String slug);

    Optional<RecipeCategory> findByNameIgnoreCase(String name);

    List<RecipeCategory> findAllByOrderBySortOrderAscNameAsc();
}
