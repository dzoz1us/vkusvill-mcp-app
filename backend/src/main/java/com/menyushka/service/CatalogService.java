package com.menyushka.service;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.menyushka.domain.Ingredient;
import com.menyushka.domain.ProductMapping;
import com.menyushka.domain.Recipe;
import com.menyushka.domain.RecipeIngredient;
import com.menyushka.repository.ProductMappingRepository;

/**
 * Каталог товаров ВкусВилл для ингредиентов и расчёт покупки:
 * сколько упаковок (или килограммов) нужно и сколько это стоит.
 */
@Service
public class CatalogService {

    /** Шаг покупки для товаров на вес, г. */
    public static final double WEIGHT_STEP_G = 100.0;

    /** Результат расчёта покупки по одному ингредиенту. */
    public record Purchase(
            int packageCount,
            double packageQuantity,
            String packageUnit,
            double pricePerPackage,
            double totalPrice,
            double cartQuantity,
            boolean soldByWeight
    ) {}

    private final ProductMappingRepository mappings;

    public CatalogService(ProductMappingRepository mappings) {
        this.mappings = mappings;
    }

    /** Все сопоставления «ингредиент → товар» по id ингредиента. */
    @Transactional(readOnly = true)
    public Map<Integer, ProductMapping> mappingsByIngredientId() {
        Map<Integer, ProductMapping> result = new HashMap<>();
        for (ProductMapping m : mappings.findAll()) {
            result.put(m.getIngredient().getId(), m);
        }
        return result;
    }

    /** Товар можно положить в корзину: он найден, в наличии и у него есть цена и упаковка. */
    public boolean isPurchasable(ProductMapping m) {
        if (m == null) return false;
        if (!"matched".equals(m.getMatchStatus())) return false;
        if (!Boolean.TRUE.equals(m.getAvailable())) return false;
        if (m.getLastPrice() == null || m.getLastPrice() <= 0) return false;
        if (m.getProductXmlId() == null || m.getProductXmlId().isBlank()) return false;
        if (Boolean.TRUE.equals(m.getSoldByWeight())) return true;
        return m.getPackageQuantity() != null && m.getPackageQuantity() > 0 && m.getPackageUnit() != null;
    }

    /** Все ингредиенты рецепта сопоставлены с товарами, которые есть в наличии. */
    public boolean isRecipePurchasable(Recipe recipe, Map<Integer, ProductMapping> byIngredient) {
        if (recipe.getIngredients().isEmpty()) {
            return false;
        }
        for (RecipeIngredient ri : recipe.getIngredients()) {
            Ingredient ing = ri.getIngredient();
            if (ing == null || !isPurchasable(byIngredient.get(ing.getId()))) {
                return false;
            }
        }
        return true;
    }

    /**
     * Сколько нужно купить.
     *
     * @param needed   потребность в канонических единицах (g / ml / pcs)
     * @param unit     единица потребности
     */
    public Optional<Purchase> purchase(ProductMapping m, double needed, String unit) {
        if (!isPurchasable(m) || needed < 0) {
            return Optional.empty();
        }
        String u = unit == null ? "" : unit.trim().toLowerCase();
        Double pieceWeight = m.getPieceWeightG() != null && m.getPieceWeightG() > 0 ? m.getPieceWeightG() : null;

        if (Boolean.TRUE.equals(m.getSoldByWeight())) {
            Double grams = switch (u) {
                case "g", "ml" -> needed;
                case "pcs" -> pieceWeight == null ? null : needed * pieceWeight;
                default -> null;
            };
            if (grams == null) {
                return Optional.empty();
            }
            int count = Math.max(1, (int) Math.ceil(grams / WEIGHT_STEP_G - 1e-9));
            double perStep = round2(m.getLastPrice() / (1000.0 / WEIGHT_STEP_G));
            return Optional.of(new Purchase(
                    count, WEIGHT_STEP_G, "g", perStep, round2(count * perStep),
                    round3(count * WEIGHT_STEP_G / 1000.0), true));
        }

        String packUnit = m.getPackageUnit().toLowerCase();
        double packQty = m.getPackageQuantity();
        Double neededInPack;
        if (u.equals(packUnit) || isMassOrVolume(u) && isMassOrVolume(packUnit)) {
            neededInPack = needed;
        } else if (u.equals("pcs") && isMassOrVolume(packUnit) && pieceWeight != null) {
            neededInPack = needed * pieceWeight;
        } else if (isMassOrVolume(u) && packUnit.equals("pcs") && pieceWeight != null) {
            neededInPack = needed / pieceWeight;
        } else {
            return Optional.empty();
        }
        int count = Math.max(1, (int) Math.ceil(neededInPack / packQty - 1e-9));
        return Optional.of(new Purchase(
                count, packQty, m.getPackageUnit(), m.getLastPrice(),
                round2(count * m.getLastPrice()), count, false));
    }

    /** Расчёт для уже выбранного количества упаковок (ручное изменение). */
    public Purchase withPackageCount(Purchase base, int packageCount) {
        int count = Math.max(1, packageCount);
        double cartQty = base.soldByWeight()
                ? round3(count * base.packageQuantity() / 1000.0)
                : count;
        return new Purchase(count, base.packageQuantity(), base.packageUnit(), base.pricePerPackage(),
                round2(count * base.pricePerPackage()), cartQty, base.soldByWeight());
    }

    private static boolean isMassOrVolume(String u) {
        return u.equals("g") || u.equals("ml");
    }

    public static double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }

    private static double round3(double v) {
        return Math.round(v * 1000.0) / 1000.0;
    }
}
