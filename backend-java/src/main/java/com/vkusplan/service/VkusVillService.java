package com.vkusplan.service;

import java.time.Instant;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vkusplan.config.AppProperties;
import com.vkusplan.domain.GroceryItem;
import com.vkusplan.domain.Ingredient;
import com.vkusplan.domain.MealPlan;
import com.vkusplan.domain.ProductMapping;
import com.vkusplan.enums.MatchStatus;
import com.vkusplan.mcp.Matcher;
import com.vkusplan.mcp.McpClient;
import com.vkusplan.mcp.McpException;
import com.vkusplan.mcp.ProductCandidate;
import com.vkusplan.repository.GroceryItemRepository;
import com.vkusplan.repository.ProductMappingRepository;

/**
 * Sits between the low-level McpClient and the grocery layer.
 * Enriches GroceryItem rows with real product data and prices.
 */
@Service
public class VkusVillService {

    private final McpClient mcpClient;
    private final GroceryItemRepository groceryRepo;
    private final ProductMappingRepository mappingRepo;
    private final PricingService pricingService;
    private final AppProperties props;

    public VkusVillService(
            McpClient mcpClient,
            GroceryItemRepository groceryRepo,
            ProductMappingRepository mappingRepo,
            PricingService pricingService,
            AppProperties props
    ) {
        this.mcpClient = mcpClient;
        this.groceryRepo = groceryRepo;
        this.mappingRepo = mappingRepo;
        this.pricingService = pricingService;
        this.props = props;
    }

    /**
     * For every grocery item of the plan, try to match a product and
     * compute package count + total price. Updates plan counters.
     *
     * Returns number of items successfully priced.
     */
    @Transactional
    public int enrichPlanPrices(MealPlan plan) {
        List<GroceryItem> items = groceryRepo.findByMealPlanId(plan.getId());
        double total = 0.0;
        int priced = 0;

        for (GroceryItem item : items) {
            if (item.getIngredient() == null) {
                // manual item: keep its price as-is
                if (item.getTotalPrice() != null) total += item.getTotalPrice();
                continue;
            }

            MatchOutcome outcome = matchIngredient(item.getIngredient());

            item.setMatchStatus(outcome.status);
            if (outcome.candidate == null) {
                groceryRepo.save(item);
                continue;
            }

            item.setProductXmlId(outcome.candidate.getXmlId());
            item.setProductName(outcome.candidate.getName());
            item.setProductUrl(outcome.candidate.getUrl());
            item.setPackageQuantity(outcome.candidate.getPackageQuantity());
            item.setPackageUnit(outcome.candidate.getPackageUnit());

            Integer packages = pricingService.packagesFor(
                    item.getNeededQuantity(),
                    item.getNeededUnit(),
                    outcome.candidate.getPackageQuantity(),
                    outcome.candidate.getPackageUnit()
            );
            item.setPackageCount(packages);

            if (packages != null && outcome.candidate.getPrice() != null) {
                item.setPricePerPackage(outcome.candidate.getPrice());
                double tp = pricingService.totalPrice(packages, outcome.candidate.getPrice());
                item.setTotalPrice(tp);
                total += tp;
                priced++;
            } else {
                item.setPricePerPackage(null);
                item.setTotalPrice(null);
            }

            groceryRepo.save(item);
        }

        plan.setCartEstimatedCost(round2(total));
        long unresolved = items.stream()
                .filter(i -> !MatchStatus.MATCHED.getValue().equals(i.getMatchStatus()))
                .count();
        plan.setUnresolvedItemsCount((int) unresolved);

        return priced;
    }

    /**
     * Search + score for a single ingredient. Returns a status and (possibly)
     * a best candidate. Does not persist anything.
     */
    public MatchOutcome matchIngredient(Ingredient ingredient) {
        if (!props.isEnableLiveMcp()) {
            return new MatchOutcome("not_found", null);
        }

        String query = Matcher.normalizeIngredientQuery(ingredient.getName());

        List<ProductCandidate> candidates;
        try {
            candidates = mcpClient.productsSearch(query);
        } catch (McpException e) {
            // degrade gracefully: keep item as not_found
            return new MatchOutcome("not_found", null);
        }

        Matcher.MatchResult result = Matcher.pickBestCandidate(ingredient.getName(), candidates);

        if (result.candidate != null && "matched".equals(result.status)) {
            upsertMapping(ingredient, result.candidate, result.score, result.status);
        }

        return new MatchOutcome(result.status, result.candidate);
    }

    private void upsertMapping(
            Ingredient ingredient,
            ProductCandidate c,
            double score,
            String status
    ) {
        ProductMapping pm = mappingRepo.findByIngredientId(ingredient.getId())
                .orElseGet(() -> {
                    ProductMapping m = new ProductMapping();
                    m.setIngredient(ingredient);
                    return m;
                });

        pm.setProductXmlId(c.getXmlId());
        pm.setProductName(c.getName());
        pm.setProductUrl(c.getUrl());
        pm.setPackageQuantity(c.getPackageQuantity());
        pm.setPackageUnit(c.getPackageUnit());
        pm.setLastPrice(c.getPrice());
        pm.setMatchScore(score);
        pm.setMatchStatus(status);
        pm.setLastCheckedAt(Instant.now());

        mappingRepo.save(pm);
    }

    private static double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }

    public static class MatchOutcome {
        public final String status;
        public final ProductCandidate candidate;

        public MatchOutcome(String status, ProductCandidate candidate) {
            this.status = status;
            this.candidate = candidate;
        }
    }
}