package com.menyushka.service;

import java.util.Map;

import org.springframework.stereotype.Service;

import com.menyushka.enums.Unit;

/**
 * Unit conversion and portion scaling.
 *
 * The calculation core works exclusively in canonical units:
 *   mass   -> g
 *   volume -> ml
 *   count  -> pcs
 *
 * All conversions happen BEFORE aggregation. Never sum "1 kg" + "300 g"
 * as strings — always convert to grams first.
 */
@Service
public class QuantityService {

    /** Aliases that may appear in recipe data and MCP responses. */
    private static final Map<String, Unit> UNIT_ALIASES = Map.ofEntries(
            Map.entry("g", Unit.G),
            Map.entry("г", Unit.G),
            Map.entry("gr", Unit.G),
            Map.entry("gram", Unit.G),
            Map.entry("grams", Unit.G),
            Map.entry("грамм", Unit.G),
            Map.entry("kg", Unit.G),
            Map.entry("кг", Unit.G),
            Map.entry("kilogram", Unit.G),
            Map.entry("kilograms", Unit.G),
            Map.entry("ml", Unit.ML),
            Map.entry("мл", Unit.ML),
            Map.entry("milliliter", Unit.ML),
            Map.entry("milliliters", Unit.ML),
            Map.entry("l", Unit.ML),
            Map.entry("л", Unit.ML),
            Map.entry("liter", Unit.ML),
            Map.entry("liters", Unit.ML),
            Map.entry("pcs", Unit.PCS),
            Map.entry("pc", Unit.PCS),
            Map.entry("шт", Unit.PCS),
            Map.entry("штука", Unit.PCS),
            Map.entry("штук", Unit.PCS),
            Map.entry("piece", Unit.PCS),
            Map.entry("pieces", Unit.PCS)
    );

    /** Multiplier to convert a value in {@code unit} into the canonical unit. */
    private static final Map<String, Double> SCALE_TO_CANONICAL = Map.ofEntries(
            Map.entry("g", 1.0),
            Map.entry("г", 1.0),
            Map.entry("gr", 1.0),
            Map.entry("gram", 1.0),
            Map.entry("grams", 1.0),
            Map.entry("грамм", 1.0),
            Map.entry("kg", 1000.0),
            Map.entry("кг", 1000.0),
            Map.entry("kilogram", 1000.0),
            Map.entry("kilograms", 1000.0),
            Map.entry("ml", 1.0),
            Map.entry("мл", 1.0),
            Map.entry("milliliter", 1.0),
            Map.entry("milliliters", 1.0),
            Map.entry("l", 1000.0),
            Map.entry("л", 1000.0),
            Map.entry("liter", 1000.0),
            Map.entry("liters", 1000.0),
            Map.entry("pcs", 1.0),
            Map.entry("pc", 1.0),
            Map.entry("шт", 1.0),
            Map.entry("штука", 1.0),
            Map.entry("штук", 1.0),
            Map.entry("piece", 1.0),
            Map.entry("pieces", 1.0)
    );

    /**
     * Convert (quantity, unit) to a canonical unit.
     *
     * @throws UnknownUnitException if the unit string is not recognized.
     * @throws IllegalArgumentException if quantity is negative.
     */
    public CanonicalQuantity toCanonical(double quantity, String unit) {
        if (quantity < 0) {
            throw new IllegalArgumentException("quantity must be non-negative");
        }

        String key = unit == null ? "" : unit.trim().toLowerCase();
        Unit canonicalUnit = UNIT_ALIASES.get(key);
        Double factor = SCALE_TO_CANONICAL.get(key);

        if (canonicalUnit == null || factor == null) {
            throw new UnknownUnitException(unit);
        }

        return new CanonicalQuantity(quantity * factor, canonicalUnit);
    }

    /**
     * Scale a recipe ingredient to the requested number of servings.
     *
     * <pre>scaled = recipe_quantity / base_servings * people_count</pre>
     */
    public CanonicalQuantity scaleQuantity(
            double recipeQuantity,
            int recipeBaseServings,
            int peopleCount,
            String unit
    ) {
        if (recipeBaseServings <= 0) {
            throw new IllegalArgumentException("recipeBaseServings must be positive");
        }
        if (peopleCount <= 0) {
            throw new IllegalArgumentException("peopleCount must be positive");
        }

        CanonicalQuantity canonical = toCanonical(recipeQuantity, unit);
        double factor = (double) peopleCount / recipeBaseServings;
        return new CanonicalQuantity(canonical.value() * factor, canonical.unit());
    }
}