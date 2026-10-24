package com.menyushka.controller;

import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.menyushka.domain.MealPlan;
import com.menyushka.dto.GroceryDtos.AvailabilityResponse;
import com.menyushka.dto.RefreshPricesResponse;
import com.menyushka.security.CurrentUser;
import com.menyushka.service.MealPlanService;
import com.menyushka.service.VkusVillService;

/** Проверка наличия и актуальных цен товаров через MCP ВкусВилл. */
@RestController
@RequestMapping("/api/meal-plans")
public class VkusVillController {

    private final VkusVillService vkusVillService;
    private final MealPlanService mealPlanService;

    public VkusVillController(VkusVillService vkusVillService, MealPlanService mealPlanService) {
        this.vkusVillService = vkusVillService;
        this.mealPlanService = mealPlanService;
    }

    /** Проверить наличие товаров: недоступные заменяются аналогами, цены обновляются. */
    @PostMapping("/{id}/check-availability")
    @Transactional
    public AvailabilityResponse checkAvailability(@PathVariable Integer id) {
        MealPlan plan = mealPlanService.getOwned(id, CurrentUser.id());
        VkusVillService.AvailabilityResult r = vkusVillService.checkAvailability(plan);
        return new AvailabilityResponse(
                r.checked(), r.priceChanged(), r.replaced(), r.unavailable(), r.unchecked(),
                plan.getCartEstimatedCost(), plan.getUnresolvedItemsCount());
    }

    @PostMapping("/{id}/refresh-prices")
    @Transactional
    public RefreshPricesResponse refreshPrices(@PathVariable Integer id) {
        MealPlan plan = mealPlanService.getOwned(id, CurrentUser.id());
        double oldCost = plan.getCartEstimatedCost() != null ? plan.getCartEstimatedCost() : 0.0;
        vkusVillService.checkAvailability(plan);
        double newCost = plan.getCartEstimatedCost() != null ? plan.getCartEstimatedCost() : 0.0;
        return RefreshPricesResponse.builder()
                .planId(String.valueOf(plan.getId()))
                .costChanged(Math.abs(newCost - oldCost) > 0.01)
                .newCost(newCost)
                .build();
    }
}
