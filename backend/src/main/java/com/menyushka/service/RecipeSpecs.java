package com.menyushka.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import org.springframework.data.jpa.domain.Specification;

import com.menyushka.domain.Favorite;
import com.menyushka.domain.Ingredient;
import com.menyushka.domain.Recipe;
import com.menyushka.domain.RecipeCategory;
import com.menyushka.domain.RecipeIngredient;

import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;

/** Фильтры каталога рецептов. */
public final class RecipeSpecs {

    private RecipeSpecs() {}

    public record Filter(
            String diet,
            String mealType,
            String categorySlug,
            Integer maxTime,
            String query,
            List<String> ingredientNames,
            Integer favoriteOfUserId,
            Boolean published
    ) {}

    public static Specification<Recipe> of(Filter f) {
        return (root, cq, cb) -> {
            List<Predicate> p = new ArrayList<>();

            if (f.published() != null) {
                p.add(cb.equal(root.get("published"), f.published()));
            }
            if (notBlank(f.diet())) {
                p.add(cb.equal(root.get("diet"), f.diet()));
            }
            if (notBlank(f.mealType())) {
                // «любое время» подходит к обеду и ужину, но не к завтраку
                if ("breakfast".equals(f.mealType())) {
                    p.add(cb.equal(root.get("mealType"), "breakfast"));
                } else {
                    p.add(cb.or(
                            cb.equal(root.get("mealType"), f.mealType()),
                            cb.equal(root.get("mealType"), "any")));
                }
            }
            if (f.maxTime() != null) {
                p.add(cb.lessThanOrEqualTo(root.get("cookTimeMinutes"), f.maxTime()));
            }
            if (notBlank(f.categorySlug())) {
                Subquery<Integer> sub = cq.subquery(Integer.class);
                Root<Recipe> r2 = sub.from(Recipe.class);
                var cat = r2.<Recipe, RecipeCategory>join("categories");
                sub.select(r2.get("id")).where(
                        cb.equal(r2.get("id"), root.get("id")),
                        cb.equal(cat.get("slug"), f.categorySlug()));
                p.add(cb.exists(sub));
            }
            if (f.favoriteOfUserId() != null) {
                Subquery<Integer> sub = cq.subquery(Integer.class);
                Root<Favorite> fav = sub.from(Favorite.class);
                sub.select(fav.get("id")).where(
                        cb.equal(fav.get("recipe").get("id"), root.get("id")),
                        cb.equal(fav.get("user").get("id"), f.favoriteOfUserId()));
                p.add(cb.exists(sub));
            }
            return cb.and(p.toArray(new Predicate[0]));
        };
    }

    private static boolean notBlank(String s) {
        return s != null && !s.isBlank();
    }
}
