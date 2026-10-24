package com.menyushka.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.menyushka.domain.Favorite;

@Repository
public interface FavoriteRepository extends JpaRepository<Favorite, Integer> {

    List<Favorite> findByUserIdOrderByCreatedAtDesc(Integer userId);

    Optional<Favorite> findByUserIdAndRecipeId(Integer userId, Integer recipeId);

    boolean existsByUserIdAndRecipeId(Integer userId, Integer recipeId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM Favorite f WHERE f.recipe.id = :recipeId")
    void deleteByRecipeId(@org.springframework.data.repository.query.Param("recipeId") Integer recipeId);
}
