package com.menyushka.seed;

import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.menyushka.domain.Ingredient;
import com.menyushka.domain.ProductMapping;
import com.menyushka.domain.Recipe;
import com.menyushka.domain.RecipeCategory;
import com.menyushka.domain.RecipeAppliance;
import com.menyushka.domain.RecipeIngredient;
import com.menyushka.domain.RecipeTag;
import com.menyushka.repository.IngredientRepository;
import com.menyushka.repository.ProductMappingRepository;
import com.menyushka.repository.RecipeCategoryRepository;
import com.menyushka.repository.RecipeRepository;

/**
 * Idempotent seeder. Reads ingredients.json and recipes.json from
 * classpath:seed/ and populates the database.
 *
 * Safe to run multiple times: existing rows are updated, not duplicated.
 */
@Service
public class SeedService {

    private final IngredientRepository ingredientRepository;
    private final RecipeRepository recipeRepository;
    private final ProductMappingRepository productMappingRepository;
    private final RecipeCategoryRepository categoryRepository;
    private final ObjectMapper objectMapper;

    public SeedService(
            IngredientRepository ingredientRepository,
            RecipeRepository recipeRepository,
            ProductMappingRepository productMappingRepository,
            RecipeCategoryRepository categoryRepository,
            ObjectMapper objectMapper
    ) {
        this.ingredientRepository = ingredientRepository;
        this.recipeRepository = recipeRepository;
        this.productMappingRepository = productMappingRepository;
        this.categoryRepository = categoryRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public SeedSummary runSeed() {
        Map<String, Ingredient> ingredients = seedIngredients();
        int recipes = seedRecipes(ingredients);
        int categories = seedCategories();
        int products = seedProducts(ingredients);
        return new SeedSummary(ingredients.size(), recipes, categories, products);
    }

    // ------------------------------------------------------------------
    // Ingredients
    // ------------------------------------------------------------------

    private Map<String, Ingredient> seedIngredients() {
        List<IngredientSeedDto> dtos = readJson("seed/ingredients.json",
                new TypeReference<List<IngredientSeedDto>>() {});

        Map<String, Ingredient> byNorm = new HashMap<>();
        for (IngredientSeedDto dto : dtos) {
            Ingredient ing = ingredientRepository
                    .findByNormalizedName(dto.getNormalizedName())
                    .orElseGet(() -> Ingredient.builder()
                            .normalizedName(dto.getNormalizedName())
                            .build());

            ing.setName(dto.getName());
            ing.setDefaultUnit(dto.getDefaultUnit());
            ing.setCategory(dto.getCategory());

            ingredientRepository.save(ing);
            byNorm.put(dto.getNormalizedName(), ing);
        }
        return byNorm;
    }

    // ------------------------------------------------------------------
    // Recipes
    // ------------------------------------------------------------------

    private int seedRecipes(Map<String, Ingredient> ingredients) {
        List<RecipeSeedDto> dtos = readJson("seed/recipes.json",
                new TypeReference<List<RecipeSeedDto>>() {});

        for (RecipeSeedDto dto : dtos) {
            Recipe recipe = recipeRepository.findByName(dto.getName())
                    .orElseGet(() -> Recipe.builder()
                            .name(dto.getName())
                            .build());

            recipe.setDescription(dto.getDescription());
            recipe.setImageUrl(dto.getImageUrl());
            recipe.setMealType(dto.getMealType());
            recipe.setServings(dto.getServings() != null ? dto.getServings() : 2);
            recipe.setCookTimeMinutes(dto.getCookTimeMinutes() != null
                    ? dto.getCookTimeMinutes() : 30);
            recipe.setCalories(dto.getCalories());
            recipe.setProtein(dto.getProtein());
            recipe.setFat(dto.getFat());
            recipe.setCarbs(dto.getCarbs());
            recipe.setDiet(dto.getDiet());
            recipe.setSteps(toJson(dto.getSteps()));

            // Wipe old relations for idempotency.
            recipe.getIngredients().clear();
            recipe.getTags().clear();
            recipe.getAppliances().clear();

            // IMPORTANT: force orphan DELETE before INSERT of new children,
            // otherwise Hibernate may insert first and violate the unique key.
            recipeRepository.flush();

            for (RecipeIngredientSeedDto ingDto : dto.getIngredients()) {
                Ingredient ing = ingredients.get(ingDto.getNormalizedName());
                if (ing == null) {
                    throw new IllegalStateException(
                            "Unknown ingredient " + ingDto.getNormalizedName()
                                    + " in recipe " + dto.getName()
                    );
                }
                recipe.getIngredients().add(RecipeIngredient.builder()
                        .recipe(recipe)
                        .ingredient(ing)
                        .quantity(ingDto.getQuantity())
                        .unit(ingDto.getUnit())
                        .build());
            }

            for (String tag : dto.getTags()) {
                recipe.getTags().add(RecipeTag.builder()
                        .recipe(recipe)
                        .tag(tag)
                        .build());
            }

            for (String appliance : dto.getAppliances()) {
                recipe.getAppliances().add(RecipeAppliance.builder()
                        .recipe(recipe)
                        .appliance(appliance)
                        .build());
            }

            recipeRepository.save(recipe);
        }

        return (int) recipeRepository.count();
    }

    // ------------------------------------------------------------------
    // Categories
    // ------------------------------------------------------------------

    /** Создаёт категории и назначает их только тем рецептам, у которых категорий ещё нет. */
    private int seedCategories() {
        Map<String, RecipeCategory> byName = new HashMap<>();
        int order = 0;
        for (Map.Entry<String, String> e : CategoryRules.CATEGORIES.entrySet()) {
            final int sort = order++;
            RecipeCategory c = categoryRepository.findByNameIgnoreCase(e.getKey())
                    .orElseGet(() -> categoryRepository.save(RecipeCategory.builder()
                            .name(e.getKey())
                            .slug(e.getValue())
                            .sortOrder(sort)
                            .build()));
            byName.put(e.getKey(), c);
        }

        for (Recipe recipe : recipeRepository.findAll()) {
            if (!recipe.getCategories().isEmpty()) {
                continue;
            }
            for (String name : CategoryRules.forRecipe(recipe.getName(), recipe.getMealType())) {
                recipe.getCategories().add(byName.get(name));
            }
            recipeRepository.save(recipe);
        }
        return (int) categoryRepository.count();
    }

    // ------------------------------------------------------------------
    // Products (VkusVill catalog)
    // ------------------------------------------------------------------

    /** Сопоставляет ингредиенты с товарами ВкусВилл; уже существующие связи не трогает. */
    private int seedProducts(Map<String, Ingredient> ingredients) {
        List<ProductSeedDto> dtos = readJson("seed/products.json",
                new TypeReference<List<ProductSeedDto>>() {});

        for (ProductSeedDto dto : dtos) {
            Ingredient ing = ingredients.get(dto.getNormalizedName());
            if (ing == null || productMappingRepository.findByIngredientId(ing.getId()).isPresent()) {
                continue;
            }
            productMappingRepository.save(ProductMapping.builder()
                    .ingredient(ing)
                    .productXmlId(dto.getXmlId())
                    .productName(dto.getName())
                    .productUrl(dto.getUrl())
                    .packageQuantity(dto.getPackageQuantity())
                    .packageUnit(dto.getPackageUnit())
                    .lastPrice(dto.getPrice())
                    .soldByWeight(Boolean.TRUE.equals(dto.getSoldByWeight()))
                    .pieceWeightG(dto.getPieceWeightG())
                    .available(true)
                    .matchScore(10.0)
                    .matchStatus("matched")
                    .lastCheckedAt(java.time.Instant.now())
                    .build());
        }
        return (int) productMappingRepository.count();
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    private <T> T readJson(String classpathPath, TypeReference<T> type) {
        try (InputStream is = new ClassPathResource(classpathPath).getInputStream()) {
            return objectMapper.readValue(is, type);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to read " + classpathPath, e);
        }
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (IOException e) {
            throw new IllegalStateException("JSON serialization failed", e);
        }
    }

    public record SeedSummary(int ingredients, int recipes, int categories, int products) {}
}