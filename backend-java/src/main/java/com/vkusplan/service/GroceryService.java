package com.vkusplan.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.vkusplan.enums.Unit;
import com.vkusplan.service.dto.AggregatedIngredient;
import com.vkusplan.service.dto.RecipeIngredientInput;
import com.vkusplan.service.dto.RecipeInput;

/**
 * Aggregate ingredients across multiple recipes.
 *
 * Rule: identical ingredients are summed ONCE across all recipes, in
 * canonical units. Packages are then calculated per aggregated ingredient
 * (PricingService).
 *
 * This class knows nothing about the database or MCP — it operates on
 * plain input records and can be unit-tested in isolation.
 */
@Service
public class GroceryService {

    private final QuantityService quantityService;

    public GroceryService(QuantityService quantityService) {
        this.quantityService = quantityService;
    }

    /**
     * Scale + sum ingredients across all recipes.
     *
     * Order of output is stable: first-seen order of ingredientId.
     */
    public List<AggregatedIngredient> aggregateIngredients(
            List<RecipeInput> recipes,
            int peopleCount
    ) {
        List<Integer> servings = new ArrayList<>(recipes.size());
        for (int i = 0; i < recipes.size(); i++) {
            servings.add(peopleCount);
        }
        return aggregateIngredients(recipes, servings);
    }

    /** То же, но у каждого блюда свои порции (servingsPerRecipe[i] относится к recipes[i]). */
    public List<AggregatedIngredient> aggregateIngredients(
            List<RecipeInput> recipes,
            List<Integer> servingsPerRecipe
    ) {
        if (recipes.size() != servingsPerRecipe.size()) {
            throw new IllegalArgumentException("servings must match recipes");
        }

        // LinkedHashMap preserves insertion order.
        Map<Integer, AggregationEntry> totals = new LinkedHashMap<>();

        for (int idx = 0; idx < recipes.size(); idx++) {
            RecipeInput recipe = recipes.get(idx);
            int peopleCount = servingsPerRecipe.get(idx);
            if (peopleCount <= 0) {
                throw new IllegalArgumentException("peopleCount must be positive");
            }
            for (RecipeIngredientInput ing : recipe.ingredients()) {
                CanonicalQuantity scaled = quantityService.scaleQuantity(
                        ing.quantity(),
                        recipe.baseServings(),
                        peopleCount,
                        ing.unit()
                );

                AggregationEntry existing = totals.get(ing.ingredientId());
                if (existing == null) {
                    totals.put(
                            ing.ingredientId(),
                            new AggregationEntry(ing.name(), scaled.value(), scaled.unit())
                    );
                } else {
                    if (existing.unit != scaled.unit()) {
                        throw new IllegalArgumentException(
                                "Ingredient " + ing.ingredientId() + " mixed units: "
                                        + existing.unit.getValue() + " vs " + scaled.unit().getValue()
                        );
                    }
                    existing.value += scaled.value();
                }
            }
        }

        List<AggregatedIngredient> result = new ArrayList<>(totals.size());
        for (Map.Entry<Integer, AggregationEntry> e : totals.entrySet()) {
            AggregationEntry agg = e.getValue();
            // Round to 3 decimals to keep values clean.
            double rounded = Math.round(agg.value * 1000.0) / 1000.0;
            result.add(new AggregatedIngredient(
                    e.getKey(),
                    agg.name,
                    rounded,
                    agg.unit
            ));
        }
        return result;
    }

    /** Mutable holder for aggregation. Internal only. */
    private static final class AggregationEntry {
        final String name;
        final Unit unit;
        double value;

        AggregationEntry(String name, double value, Unit unit) {
            this.name = name;
            this.value = value;
            this.unit = unit;
        }
    }
}