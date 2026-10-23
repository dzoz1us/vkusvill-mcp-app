package com.vkusplan.controller;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.vkusplan.domain.Recipe;
import com.vkusplan.dto.RecipeDetail;
import com.vkusplan.dto.RecipeListResponse;
import com.vkusplan.dto.RecipeShort;
import com.vkusplan.mapper.RecipeMapper;
import com.vkusplan.repository.RecipeRepository;
import com.vkusplan.service.MealNotFoundException;

@RestController
@RequestMapping("/api/recipes")
public class RecipeController {

    private final RecipeRepository recipeRepository;
    private final RecipeMapper recipeMapper;

    public RecipeController(RecipeRepository recipeRepository, RecipeMapper recipeMapper) {
        this.recipeRepository = recipeRepository;
        this.recipeMapper = recipeMapper;
    }

    @GetMapping
    public RecipeListResponse listRecipes(
            @RequestParam(required = false) String diet,
            @RequestParam(defaultValue = "50") int limit,
            @RequestParam(defaultValue = "0") int offset
    ) {
        int page = offset / Math.max(1, limit);

        Page<Recipe> pageResult;
        if (diet != null && !diet.isBlank()) {
            pageResult = recipeRepository.findByDiet(
                    diet,
                    PageRequest.of(page, limit, Sort.by("id"))
            );
        } else {
            pageResult = recipeRepository.findAll(
                    PageRequest.of(page, limit, Sort.by("id"))
            );
        }

        List<RecipeShort> items = pageResult.getContent().stream()
                .map(recipeMapper::toShort)
                .toList();

        return RecipeListResponse.builder()
                .items(items)
                .total((int) pageResult.getTotalElements())
                .limit(limit)
                .offset(offset)
                .build();
    }

    @Transactional(readOnly = true)
    @GetMapping("/{id}")
    public RecipeDetail getRecipe(@PathVariable Integer id) {
        Recipe recipe = recipeRepository.findById(id)
                .orElseThrow(() -> new MealNotFoundException(
                        "Recipe " + id + " not found"
                ));
        return recipeMapper.toDetail(recipe);
    }
}