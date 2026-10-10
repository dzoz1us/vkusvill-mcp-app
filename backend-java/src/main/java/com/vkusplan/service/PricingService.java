package com.vkusplan.service;

import java.util.Set;

import org.springframework.stereotype.Service;

/**
 * Package count and price calculation.
 *
 * Pure functions, no DB. The MCP layer feeds real product data
 * into these later.
 *
 * Key rule: packages are calculated AFTER aggregation. Never per recipe.
 */
@Service
public class PricingService {

    /**
     * Number of packages to buy.
     *
     * <pre>packages = ceil(needed / package_quantity)</pre>
     *
     * 700 g needed, package 450 g -> 2 packages.
     */
    public int packagesNeeded(double neededQuantity, double packageQuantity) {
        if (packageQuantity <= 0) {
            throw new IllegalArgumentException("packageQuantity must be positive");
        }
        if (neededQuantity < 0) {
            throw new IllegalArgumentException("neededQuantity must be non-negative");
        }
        return (int) Math.ceil(neededQuantity / packageQuantity);
    }

    /**
     * Total cost of N packages, rounded to 2 decimals.
     */
    public double totalPrice(int packages, double pricePerPackage) {
        if (packages < 0) {
            throw new IllegalArgumentException("packages must be non-negative");
        }
        if (pricePerPackage < 0) {
            throw new IllegalArgumentException("pricePerPackage must be non-negative");
        }
        return Math.round(packages * pricePerPackage * 100.0) / 100.0;
    }

    /**
     * Pairs of units that can be compared in the package calculation.
     *
     * In the recipe world we work with g / ml / pcs.
     * VkusVill reports package weight in g even for liquids like milk.
     * For kitchen purposes g and ml are treated as interchangeable —
     * density ~1. That is a documented MVP simplification.
     */
    private static final Set<Set<String>> COMPATIBLE_PAIRS = Set.of(
            Set.of("g", "g"),
            Set.of("g", "ml"),
            Set.of("ml", "ml"),
            Set.of("pcs", "pcs")
    );

    public boolean unitsCompatible(String a, String b) {
        return COMPATIBLE_PAIRS.contains(Set.of(a, b));
    }

    /**
     * Number of packages to buy, or {@code null} if data is insufficient
     * or units are not compatible.
     */
    public Integer packagesFor(
            double neededQuantity,
            String neededUnit,
            Double packageQuantity,
            String packageUnit
    ) {
        if (packageQuantity == null || packageUnit == null) {
            return null;
        }
        if (!unitsCompatible(neededUnit, packageUnit)) {
            return null;
        }
        return packagesNeeded(neededQuantity, packageQuantity);
    }
}