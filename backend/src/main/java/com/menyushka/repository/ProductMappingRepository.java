package com.menyushka.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.menyushka.domain.ProductMapping;

@Repository
public interface ProductMappingRepository extends JpaRepository<ProductMapping, Integer> {

    Optional<ProductMapping> findByIngredientId(Integer ingredientId);

    java.util.List<ProductMapping> findAllByOrderByIdAsc();

    Optional<ProductMapping> findByProductXmlId(String productXmlId);
}