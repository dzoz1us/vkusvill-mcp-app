package com.vkusplan.controller.admin;

import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vkusplan.domain.Recipe;
import com.vkusplan.domain.RecipeAppliance;
import com.vkusplan.domain.RecipeCategory;
import com.vkusplan.domain.RecipeIngredient;
import com.vkusplan.domain.RecipeTag;
import com.vkusplan.dto.AdminDtos.CategoryUpsert;
import com.vkusplan.dto.AdminDtos.RecipeIngredientInput;
import com.vkusplan.dto.AdminDtos.RecipeUpsert;
import com.vkusplan.dto.CategoryRead;
import com.vkusplan.dto.RecipeDetail;
import com.vkusplan.enums.Appliance;
import com.vkusplan.enums.Diet;
import com.vkusplan.enums.Preference;
import com.vkusplan.exception.ApiException;
import com.vkusplan.mapper.RecipeMapper;
import com.vkusplan.repository.FavoriteRepository;
import com.vkusplan.repository.IngredientRepository;
import com.vkusplan.repository.MealPlanMealRepository;
import com.vkusplan.repository.RecipeCategoryRepository;
import com.vkusplan.repository.RecipeRepository;
import com.vkusplan.service.CatalogService;
import com.vkusplan.service.QuantityService;

import jakarta.validation.Valid;

/** Администратор: модерация каталога — рецепты и категории. */
@RestController
@RequestMapping("/api/admin")
public class AdminRecipeController {

    private static final Set<String> MEAL_TYPES = Set.of("breakfast", "lunch", "dinner", "any");

    private static final Map<Character, String> TRANSLIT = Map.ofEntries(
            Map.entry('а', "a"), Map.entry('б', "b"), Map.entry('в', "v"), Map.entry('г', "g"),
            Map.entry('д', "d"), Map.entry('е', "e"), Map.entry('ё', "e"), Map.entry('ж', "zh"),
            Map.entry('з', "z"), Map.entry('и', "i"), Map.entry('й', "y"), Map.entry('к', "k"),
            Map.entry('л', "l"), Map.entry('м', "m"), Map.entry('н', "n"), Map.entry('о', "o"),
            Map.entry('п', "p"), Map.entry('р', "r"), Map.entry('с', "s"), Map.entry('т', "t"),
            Map.entry('у', "u"), Map.entry('ф', "f"), Map.entry('х', "h"), Map.entry('ц', "c"),
            Map.entry('ч', "ch"), Map.entry('ш', "sh"), Map.entry('щ', "sch"), Map.entry('ъ', ""),
            Map.entry('ы', "y"), Map.entry('ь', ""), Map.entry('э', "e"), Map.entry('ю', "yu"),
            Map.entry('я', "ya")
    );

    private final RecipeRepository recipes;
    private final RecipeCategoryRepository categories;
    private final IngredientRepository ingredients;
    private final FavoriteRepository favorites;
    private final MealPlanMealRepository planMeals;
    private final QuantityService quantityService;
    private final CatalogService catalogService;
    private final RecipeMapper recipeMapper;
    private final ObjectMapper objectMapper;

    public AdminRecipeController(
            RecipeRepository recipes,
            RecipeCategoryRepository categories,
            IngredientRepository ingredients,
            FavoriteRepository favorites,
            MealPlanMealRepository planMeals,
            QuantityService quantityService,
            CatalogService catalogService,
            RecipeMapper recipeMapper,
            ObjectMapper objectMapper
    ) {
        this.recipes = recipes;
        this.categories = categories;
        this.ingredients = ingredients;
        this.favorites = favorites;
        this.planMeals = planMeals;
        this.quantityService = quantityService;
        this.catalogService = catalogService;
        this.recipeMapper = recipeMapper;
        this.objectMapper = objectMapper;
    }

    // ------------------------------------------------------------------
    // Recipes
    // ------------------------------------------------------------------

    @PostMapping("/recipes")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public RecipeDetail create(@Valid @RequestBody RecipeUpsert request) {
        if (recipes.findByName(request.name().trim()).isPresent()) {
            throw ApiException.conflict("Рецепт с таким названием уже есть");
        }
        Recipe recipe = Recipe.builder().name(request.name().trim()).build();
        apply(recipe, request);
        return detail(recipes.save(recipe));
    }

    @PutMapping("/recipes/{id}")
    @Transactional
    public RecipeDetail update(@PathVariable Integer id, @Valid @RequestBody RecipeUpsert request) {
        Recipe recipe = require(id);
        recipes.findByName(request.name().trim()).ifPresent(other -> {
            if (!other.getId().equals(id)) {
                throw ApiException.conflict("Рецепт с таким названием уже есть");
            }
        });
        recipe.setName(request.name().trim());
        apply(recipe, request);
        return detail(recipes.save(recipe));
    }

    /** Скрыть рецепт из каталога и из новых планов или вернуть обратно (модерация). */
    @PatchMapping("/recipes/{id}/publish")
    @Transactional
    public RecipeDetail publish(@PathVariable Integer id, @RequestBody Map<String, Boolean> body) {
        Recipe recipe = require(id);
        recipe.setPublished(Boolean.TRUE.equals(body.get("published")));
        return detail(recipes.save(recipe));
    }

    @DeleteMapping("/recipes/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void delete(@PathVariable Integer id) {
        Recipe recipe = require(id);
        if (planMeals.existsByRecipeId(id)) {
            throw ApiException.conflict("Рецепт уже используется в планах клиентов — скройте его вместо удаления");
        }
        favorites.deleteByRecipeId(id);
        recipes.delete(recipe);
    }

    private Recipe require(Integer id) {
        return recipes.findById(id).orElseThrow(() -> ApiException.notFound("Рецепт не найден"));
    }

    private RecipeDetail detail(Recipe r) {
        return recipeMapper.toDetail(r, new RecipeMapper.Context(Set.of(), catalogService.mappingsByIngredientId()));
    }

    private void apply(Recipe recipe, RecipeUpsert req) {
        String mealType = req.mealType() == null || req.mealType().isBlank() ? "any" : req.mealType();
        if (!MEAL_TYPES.contains(mealType)) {
            throw ApiException.badRequest("Тип блюда: breakfast, lunch, dinner или any");
        }
        Diet diet;
        try {
            diet = Diet.fromValue(req.diet());
        } catch (IllegalArgumentException e) {
            throw ApiException.badRequest("Неизвестная диета: " + req.diet());
        }

        recipe.setDescription(req.description());
        recipe.setImageUrl(req.imageUrl());
        recipe.setMealType(mealType);
        recipe.setServings(req.servings());
        recipe.setCookTimeMinutes(req.cookTimeMinutes());
        recipe.setCalories(req.calories());
        recipe.setProtein(req.protein());
        recipe.setFat(req.fat());
        recipe.setCarbs(req.carbs());
        recipe.setDiet(diet.getValue());
        recipe.setPublished(req.published() == null || req.published());
        try {
            recipe.setSteps(objectMapper.writeValueAsString(
                    req.steps().stream().map(String::trim).toList()));
        } catch (JsonProcessingException e) {
            throw ApiException.badRequest("Не удалось сохранить шаги");
        }

        // заменяем дочерние записи; flush удаляет старые до вставки новых (уникальные ключи)
        recipe.getIngredients().clear();
        recipe.getTags().clear();
        recipe.getAppliances().clear();
        recipe.getCategories().clear();
        if (recipe.getId() != null) {
            recipes.flush();
        }

        Set<Integer> seen = new HashSet<>();
        for (RecipeIngredientInput in : req.ingredients()) {
            if (!seen.add(in.ingredientId())) {
                throw ApiException.badRequest("Ингредиент указан дважды");
            }
            var ing = ingredients.findById(in.ingredientId())
                    .orElseThrow(() -> ApiException.badRequest("Нет ингредиента " + in.ingredientId()));
            String unit;
            try {
                unit = quantityService.toCanonical(in.quantity(), in.unit()).unit().getValue();
            } catch (RuntimeException e) {
                throw ApiException.badRequest("Единица измерения: g, ml или pcs");
            }
            recipe.getIngredients().add(RecipeIngredient.builder()
                    .recipe(recipe).ingredient(ing).quantity(in.quantity()).unit(unit).build());
        }

        if (req.tags() != null) {
            for (String tag : new HashSet<>(req.tags())) {
                try {
                    Preference.fromValue(tag);
                } catch (IllegalArgumentException e) {
                    throw ApiException.badRequest("Неизвестный тег: " + tag);
                }
                recipe.getTags().add(RecipeTag.builder().recipe(recipe).tag(tag).build());
            }
        }
        List<String> apps = req.appliances() == null || req.appliances().isEmpty() ? List.of("stove") : req.appliances();
        for (String a : new HashSet<>(apps)) {
            try {
                Appliance.fromValue(a);
            } catch (IllegalArgumentException e) {
                throw ApiException.badRequest("Неизвестная техника: " + a);
            }
            recipe.getAppliances().add(RecipeAppliance.builder().recipe(recipe).appliance(a).build());
        }
        if (req.categoryIds() != null) {
            for (Integer cid : new HashSet<>(req.categoryIds())) {
                recipe.getCategories().add(categories.findById(cid)
                        .orElseThrow(() -> ApiException.badRequest("Нет категории " + cid)));
            }
        }
    }

    // ------------------------------------------------------------------
    // Categories
    // ------------------------------------------------------------------

    @PostMapping("/categories")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public CategoryRead createCategory(@Valid @RequestBody CategoryUpsert request) {
        String slug = slugOf(request);
        if (categories.findByNameIgnoreCase(request.name().trim()).isPresent()
                || categories.findBySlug(slug).isPresent()) {
            throw ApiException.conflict("Такая категория уже есть");
        }
        int sort = request.sortOrder() != null
                ? request.sortOrder()
                : categories.findAll().stream().mapToInt(RecipeCategory::getSortOrder).max().orElse(0) + 1;
        return recipeMapper.toCategory(categories.save(RecipeCategory.builder()
                .name(request.name().trim()).slug(slug).sortOrder(sort).build()));
    }

    @PutMapping("/categories/{id}")
    @Transactional
    public CategoryRead updateCategory(@PathVariable Integer id, @Valid @RequestBody CategoryUpsert request) {
        RecipeCategory c = categories.findById(id).orElseThrow(() -> ApiException.notFound("Категория не найдена"));
        String slug = slugOf(request);
        categories.findBySlug(slug).ifPresent(o -> {
            if (!o.getId().equals(id)) throw ApiException.conflict("Такой адрес категории уже занят");
        });
        categories.findByNameIgnoreCase(request.name().trim()).ifPresent(o -> {
            if (!o.getId().equals(id)) throw ApiException.conflict("Такая категория уже есть");
        });
        c.setName(request.name().trim());
        c.setSlug(slug);
        if (request.sortOrder() != null) {
            c.setSortOrder(request.sortOrder());
        }
        return recipeMapper.toCategory(categories.save(c));
    }

    @DeleteMapping("/categories/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void deleteCategory(@PathVariable Integer id) {
        RecipeCategory c = categories.findById(id).orElseThrow(() -> ApiException.notFound("Категория не найдена"));
        // убираем категорию у рецептов, затем удаляем саму категорию
        for (Recipe r : recipes.findAll()) {
            if (r.getCategories().removeIf(x -> x.getId().equals(id))) {
                recipes.save(r);
            }
        }
        recipes.flush();
        categories.delete(c);
    }

    private String slugOf(CategoryUpsert req) {
        String base = req.slug() != null && !req.slug().isBlank() ? req.slug() : req.name();
        StringBuilder sb = new StringBuilder();
        for (char ch : base.trim().toLowerCase(Locale.ROOT).toCharArray()) {
            if (TRANSLIT.containsKey(ch)) sb.append(TRANSLIT.get(ch));
            else if ((ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9')) sb.append(ch);
            else if (sb.length() > 0 && sb.charAt(sb.length() - 1) != '-') sb.append('-');
        }
        String slug = sb.toString().replaceAll("^-+|-+$", "");
        if (slug.isEmpty()) {
            throw ApiException.badRequest("Не получилось составить адрес категории");
        }
        return slug;
    }
}
