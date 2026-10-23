package com.vkusplan.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.vkusplan.domain.GroceryItem;
import com.vkusplan.domain.MealPlan;
import com.vkusplan.dto.CartLink;
import com.vkusplan.dto.CartResponse;
import com.vkusplan.dto.RefreshPricesResponse;
import com.vkusplan.enums.MatchStatus;
import com.vkusplan.mcp.McpClient;
import com.vkusplan.repository.GroceryItemRepository;
import com.vkusplan.repository.MealPlanRepository;
import com.vkusplan.service.MealNotFoundException;
import com.vkusplan.service.VkusVillService;

@RestController
@RequestMapping("/api/meal-plans")
public class VkusVillController {

    private static final int CART_CHUNK = 20;
    private static final double MAX_Q_PER_ITEM = 40.0;

    private final VkusVillService vkusVillService;
    private final MealPlanRepository planRepo;
    private final GroceryItemRepository groceryRepo;
    private final McpClient mcpClient;

    public VkusVillController(
            VkusVillService vkusVillService,
            MealPlanRepository planRepo,
            GroceryItemRepository groceryRepo,
            McpClient mcpClient
    ) {
        this.vkusVillService = vkusVillService;
        this.planRepo = planRepo;
        this.groceryRepo = groceryRepo;
        this.mcpClient = mcpClient;
    }

    @PostMapping("/{id}/refresh-prices")
    @Transactional
    public RefreshPricesResponse refreshPrices(@PathVariable Integer id) {
        MealPlan plan = planRepo.findById(id)
                .orElseThrow(() -> new MealNotFoundException(
                        "Meal plan " + id + " not found"
                ));

        double oldCost = plan.getCartEstimatedCost() != null
                ? plan.getCartEstimatedCost() : 0.0;

        vkusVillService.enrichPlanPrices(plan);
        planRepo.save(plan);

        double newCost = plan.getCartEstimatedCost() != null
                ? plan.getCartEstimatedCost() : 0.0;

        return RefreshPricesResponse.builder()
                .planId(String.valueOf(plan.getId()))
                .costChanged(Math.abs(newCost - oldCost) > 0.01)
                .newCost(newCost)
                .build();
    }

    @PostMapping("/{id}/vkusvill-cart")
    @Transactional
    public CartResponse createCart(@PathVariable Integer id) {
        MealPlan plan = planRepo.findById(id)
                .orElseThrow(() -> new MealNotFoundException(
                        "Meal plan " + id + " not found"
                ));

        // Best-effort enrichment: if MCP fails, cart still builds with
        // whatever data we already have.
        try {
            vkusVillService.enrichPlanPrices(plan);
            planRepo.save(plan);
        } catch (Exception ignore) {
            // degraded mode: proceed with existing state
        }

        List<GroceryItem> all = groceryRepo.findByMealPlanId(plan.getId());

        List<GroceryItem> cartItems = all.stream()
                .filter(i -> MatchStatus.MATCHED.getValue().equals(i.getMatchStatus()))
                .filter(i -> i.getProductXmlId() != null)
                .filter(i -> i.getPackageCount() != null)
                .toList();

        long unresolved = all.stream()
                .filter(i -> !MatchStatus.MATCHED.getValue().equals(i.getMatchStatus()))
                .count();

        if (cartItems.isEmpty()) {
            return CartResponse.builder()
                    .carts(List.of())
                    .priceChanged(false)
                    .unresolvedItems((int) unresolved)
                    .build();
        }

        List<Map<String, Object>> payload = new ArrayList<>();
        for (GroceryItem i : cartItems) {
            int xmlId;
            try {
                xmlId = Integer.parseInt(i.getProductXmlId());
            } catch (NumberFormatException e) {
                continue;
            }
            double q = Math.min(Math.max(1.0, i.getPackageCount()), MAX_Q_PER_ITEM);

            Map<String, Object> entry = new HashMap<>();
            entry.put("xml_id", xmlId);
            entry.put("q", q);
            payload.add(entry);
        }

        List<CartLink> carts = new ArrayList<>();
        for (int start = 0; start < payload.size(); start += CART_CHUNK) {
            List<Map<String, Object>> chunk = payload.subList(
                    start, Math.min(start + CART_CHUNK, payload.size())
            );
            try {
                String url = mcpClient.cartLinkCreate(chunk);
                if (url != null && !url.isBlank()) {
                    carts.add(CartLink.builder()
                            .cartUrl(url)
                            .itemsCount(chunk.size())
                            .build());
                }
            } catch (Exception ignore) {
                // skip this chunk if MCP call fails
            }
        }

        return CartResponse.builder()
                .carts(carts)
                .priceChanged(false)
                .unresolvedItems((int) unresolved)
                .build();
    }
}