package com.menyushka.mapper;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Component;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.menyushka.domain.ProductMapping;
import com.menyushka.domain.Recipe;
import com.menyushka.domain.RecipeAppliance;
import com.menyushka.domain.RecipeCategory;
import com.menyushka.domain.RecipeIngredient;
import com.menyushka.domain.RecipeTag;
import com.menyushka.dto.CategoryRead;
import com.menyushka.dto.IngredientRead;
import com.menyushka.dto.NutritionInfo;
import com.menyushka.dto.RecipeDetail;
import com.menyushka.dto.RecipeShort;
import com.menyushka.enums.Appliance;
import com.menyushka.enums.Diet;
import com.menyushka.service.CatalogService;

@Component
public class RecipeMapper {

    /** Данные текущего пользователя и каталога, нужные для флагов «в избранном» и «можно заказать». */
    public record Context(Set<Integer> favoriteIds, Map<Integer, ProductMapping> mappings) {
        public static final Context NONE = new Context(Set.of(), null);
    }

    private final ObjectMapper objectMapper;
    private final CatalogService catalogService;

    public RecipeMapper(ObjectMapper objectMapper, CatalogService catalogService) {
        this.objectMapper = objectMapper;
        this.catalogService = catalogService;
    }

    public RecipeShort toShort(Recipe recipe) {
        return toShort(recipe, Context.NONE);
    }

    public RecipeShort toShort(Recipe recipe, Context ctx) {
        if (recipe == null) return null;

        return RecipeShort.builder()
                .id(String.valueOf(recipe.getId()))
                .name(recipe.getName())
                .imageUrl(recipe.getImageUrl())
                .cookTimeMinutes(recipe.getCookTimeMinutes())
                .servings(recipe.getServings())
                .nutrition(buildNutrition(recipe))
                .diet(Diet.fromValue(recipe.getDiet()))
                .description(recipe.getDescription())
                .mealType(recipe.getMealType())
                .categories(categories(recipe))
                .tags(tags(recipe))
                .isFavorite(ctx.favoriteIds().contains(recipe.getId()))
                .purchasable(purchasable(recipe, ctx))
                .published(!Boolean.FALSE.equals(recipe.getPublished()))
                .build();
    }

    public RecipeDetail toDetail(Recipe recipe) {
        return toDetail(recipe, Context.NONE);
    }

    public RecipeDetail toDetail(Recipe recipe, Context ctx) {
        if (recipe == null) return null;

        List<Appliance> appliances = new ArrayList<>();
        for (RecipeAppliance ra : recipe.getAppliances()) {
            appliances.add(Appliance.fromValue(ra.getAppliance()));
        }

        List<IngredientRead> ingredients = new ArrayList<>();
        for (RecipeIngredient ri : recipe.getIngredients()) {
            Integer ingId = ri.getIngredient() != null ? ri.getIngredient().getId() : null;
            Boolean available = ctx.mappings() == null || ingId == null
                    ? null
                    : catalogService.isPurchasable(ctx.mappings().get(ingId));
            ingredients.add(IngredientRead.builder()
                    .id(ingId != null ? String.valueOf(ingId) : null)
                    .name(ri.getIngredient() != null ? ri.getIngredient().getName() : "")
                    .quantity(ri.getQuantity())
                    .unit(ri.getUnit())
                    .available(available)
                    .build());
        }

        return RecipeDetail.builder()
                .id(String.valueOf(recipe.getId()))
                .name(recipe.getName())
                .imageUrl(recipe.getImageUrl())
                .cookTimeMinutes(recipe.getCookTimeMinutes())
                .servings(recipe.getServings())
                .nutrition(buildNutrition(recipe))
                .diet(Diet.fromValue(recipe.getDiet()))
                .description(recipe.getDescription())
                .mealType(recipe.getMealType())
                .categories(categories(recipe))
                .tags(tags(recipe))
                .isFavorite(ctx.favoriteIds().contains(recipe.getId()))
                .purchasable(purchasable(recipe, ctx))
                .published(!Boolean.FALSE.equals(recipe.getPublished()))
                .appliances(appliances)
                .ingredients(ingredients)
                .steps(parseSteps(recipe.getSteps()))
                .build();
    }

    public CategoryRead toCategory(RecipeCategory c) {
        return CategoryRead.builder()
                .id(String.valueOf(c.getId()))
                .name(c.getName())
                .slug(c.getSlug())
                .build();
    }

    private Boolean purchasable(Recipe recipe, Context ctx) {
        return ctx.mappings() == null ? null : catalogService.isRecipePurchasable(recipe, ctx.mappings());
    }

    private List<CategoryRead> categories(Recipe recipe) {
        return recipe.getCategories().stream()
                .sorted(Comparator.comparingInt(RecipeCategory::getSortOrder)
                        .thenComparing(RecipeCategory::getName))
                .map(this::toCategory)
                .toList();
    }

    private List<String> tags(Recipe recipe) {
        return recipe.getTags().stream().map(RecipeTag::getTag).sorted().toList();
    }

    private NutritionInfo buildNutrition(Recipe recipe) {
        if (recipe.getCalories() == null) return null;
        return NutritionInfo.builder()
                .calories(recipe.getCalories())
                .protein(recipe.getProtein() != null ? recipe.getProtein() : 0.0)
                .fat(recipe.getFat() != null ? recipe.getFat() : 0.0)
                .carbs(recipe.getCarbs() != null ? recipe.getCarbs() : 0.0)
                .build();
    }

    private List<String> parseSteps(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (JsonProcessingException e) {
            return List.of();
        }
    }
}
