package com.menyushka.controller;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.Locale;
import java.util.List;
import java.util.Set;

import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.menyushka.domain.Favorite;
import com.menyushka.domain.Recipe;
import com.menyushka.dto.CategoryRead;
import com.menyushka.dto.RecipeDetail;
import com.menyushka.dto.RecipeListResponse;
import com.menyushka.dto.RecipeShort;
import com.menyushka.exception.ApiException;
import com.menyushka.mapper.RecipeMapper;
import com.menyushka.repository.FavoriteRepository;
import com.menyushka.repository.IngredientRepository;
import com.menyushka.repository.RecipeCategoryRepository;
import com.menyushka.repository.RecipeRepository;
import com.menyushka.repository.UserRepository;
import com.menyushka.security.AuthUser;
import com.menyushka.security.CurrentUser;
import com.menyushka.service.CatalogService;
import com.menyushka.service.MealNotFoundException;
import com.menyushka.service.RecipeSpecs;

/** Каталог рецептов (виден гостям), категории, фильтры и избранное клиента. */
@RestController
@RequestMapping("/api")
public class RecipeController {

    private final RecipeRepository recipeRepository;
    private final RecipeCategoryRepository categoryRepository;
    private final IngredientRepository ingredientRepository;
    private final FavoriteRepository favoriteRepository;
    private final UserRepository userRepository;
    private final CatalogService catalogService;
    private final RecipeMapper recipeMapper;

    public RecipeController(
            RecipeRepository recipeRepository,
            RecipeCategoryRepository categoryRepository,
            IngredientRepository ingredientRepository,
            FavoriteRepository favoriteRepository,
            UserRepository userRepository,
            CatalogService catalogService,
            RecipeMapper recipeMapper
    ) {
        this.recipeRepository = recipeRepository;
        this.categoryRepository = categoryRepository;
        this.ingredientRepository = ingredientRepository;
        this.favoriteRepository = favoriteRepository;
        this.userRepository = userRepository;
        this.catalogService = catalogService;
        this.recipeMapper = recipeMapper;
    }

    /** Пользователь, если он вошёл (иначе null): каталог доступен и гостям. */
    private AuthUser optionalUser() {
        Authentication a = SecurityContextHolder.getContext().getAuthentication();
        return a != null && a.getPrincipal() instanceof AuthUser u ? u : null;
    }

    private RecipeMapper.Context context(AuthUser user) {
        Set<Integer> favorites = new HashSet<>();
        if (user != null) {
            favoriteRepository.findByUserIdOrderByCreatedAtDesc(user.id())
                    .forEach(f -> favorites.add(f.getRecipe().getId()));
        }
        return new RecipeMapper.Context(favorites, catalogService.mappingsByIngredientId());
    }

    @GetMapping("/recipes")
    @Transactional(readOnly = true)
    public RecipeListResponse listRecipes(
            @RequestParam(required = false) String diet,
            @RequestParam(name = "meal_type", required = false) String mealType,
            @RequestParam(required = false) String category,
            @RequestParam(name = "max_time", required = false) Integer maxTime,
            @RequestParam(required = false) String q,
            @RequestParam(name = "ingredient", required = false) List<String> ingredients,
            @RequestParam(required = false, defaultValue = "false") boolean favorite,
            @RequestParam(required = false, defaultValue = "name") String sort,
            @RequestParam(defaultValue = "50") int limit,
            @RequestParam(defaultValue = "0") int offset
    ) {
        AuthUser user = optionalUser();
        if (favorite && user == null) {
            throw ApiException.unauthorized("Избранное доступно после входа");
        }
        boolean admin = user != null && user.isAdmin();

        var spec = RecipeSpecs.of(new RecipeSpecs.Filter(
                diet, mealType, category, maxTime, null, null,
                favorite ? user.id() : null,
                admin ? null : Boolean.TRUE));

        Sort order = switch (sort) {
            case "time" -> Sort.by("cookTimeMinutes").and(Sort.by("name"));
            case "calories" -> Sort.by("calories").and(Sort.by("name"));
            case "id" -> Sort.by("id");
            default -> Sort.by("name");
        };

        int size = Math.max(1, Math.min(limit, 200));
        List<Recipe> found = new ArrayList<>(recipeRepository.findAll(spec, order));

        // lower() в СУБД может не работать с кириллицей, поэтому текстовые фильтры применяем здесь
        Locale ru = Locale.forLanguageTag("ru");
        if (q != null && !q.isBlank()) {
            String needle = q.trim().toLowerCase(ru);
            found.removeIf(r -> !r.getName().toLowerCase(ru).contains(needle)
                    && (r.getDescription() == null || !r.getDescription().toLowerCase(ru).contains(needle)));
        }
        if (ingredients != null) {
            for (String raw : ingredients) {
                if (raw == null || raw.isBlank()) continue;
                String needle = raw.trim().toLowerCase(ru);
                found.removeIf(r -> r.getIngredients().stream().noneMatch(ri ->
                        ri.getIngredient() != null && ri.getIngredient().getName().toLowerCase(ru).contains(needle)));
            }
        }

        int from = Math.min(Math.max(0, offset), found.size());
        int to = Math.min(from + size, found.size());

        RecipeMapper.Context ctx = context(user);
        List<RecipeShort> items = found.subList(from, to).stream()
                .map(r -> recipeMapper.toShort(r, ctx))
                .toList();

        return RecipeListResponse.builder()
                .items(items)
                .total(found.size())
                .limit(size)
                .offset(from)
                .build();
    }

    @GetMapping("/recipes/{id}")
    @Transactional(readOnly = true)
    public RecipeDetail getRecipe(@PathVariable Integer id) {
        AuthUser user = optionalUser();
        Recipe recipe = recipeRepository.findById(id)
                .filter(r -> !Boolean.FALSE.equals(r.getPublished()) || (user != null && user.isAdmin()))
                .orElseThrow(() -> new MealNotFoundException("Recipe " + id + " not found"));
        return recipeMapper.toDetail(recipe, context(user));
    }

    @GetMapping("/categories")
    @Transactional(readOnly = true)
    public List<CategoryRead> categories() {
        return categoryRepository.findAllByOrderBySortOrderAscNameAsc().stream()
                .map(recipeMapper::toCategory)
                .toList();
    }

    /** Список продуктов для фильтра «по ингредиентам». */
    @GetMapping("/ingredients")
    public List<String> ingredientNames() {
        return ingredientRepository.findAll().stream()
                .map(i -> i.getName())
                .sorted()
                .toList();
    }

    // ------------------------------------------------------------------
    // Favorites
    // ------------------------------------------------------------------

    @GetMapping("/favorites")
    @Transactional(readOnly = true)
    public List<RecipeShort> favorites() {
        AuthUser user = CurrentUser.require();
        RecipeMapper.Context ctx = context(user);
        return favoriteRepository.findByUserIdOrderByCreatedAtDesc(user.id()).stream()
                .map(Favorite::getRecipe)
                .filter(r -> !Boolean.FALSE.equals(r.getPublished()))
                .map(r -> recipeMapper.toShort(r, ctx))
                .toList();
    }

    @PutMapping("/favorites/{recipeId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void addFavorite(@PathVariable Integer recipeId) {
        Integer userId = CurrentUser.id();
        if (favoriteRepository.existsByUserIdAndRecipeId(userId, recipeId)) {
            return;
        }
        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new MealNotFoundException("Recipe " + recipeId + " not found"));
        favoriteRepository.save(Favorite.builder()
                .user(userRepository.findById(userId).orElseThrow())
                .recipe(recipe)
                .createdAt(java.time.Instant.now())
                .build());
    }

    @DeleteMapping("/favorites/{recipeId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void removeFavorite(@PathVariable Integer recipeId) {
        favoriteRepository.findByUserIdAndRecipeId(CurrentUser.id(), recipeId)
                .ifPresent(favoriteRepository::delete);
    }
}
