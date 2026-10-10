package com.vkusplan.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.vkusplan.domain.ProductMapping;

@Repository
public interface ProductMappingRepository extends JpaRepository<ProductMapping, Integer> {

    Optional<ProductMapping> findByIngredientId(Integer ingredientId);
}