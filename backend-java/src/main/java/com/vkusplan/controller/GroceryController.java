package com.vkusplan.controller;

import java.util.ArrayList;
import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.vkusplan.domain.GroceryItem;
import com.vkusplan.domain.MealPlan;
import com.vkusplan.domain.User;
import com.vkusplan.dto.GroceryItemRead;
import com.vkusplan.dto.GroceryItemUpdate;
import com.vkusplan.dto.GroceryListResponse;
import com.vkusplan.dto.ManualGroceryItemCreate;
import com.vkusplan.enums.MatchStatus;
import com.vkusplan.mapper.GroceryItemMapper;
import com.vkusplan.repository.GroceryItemRepository;
import com.vkusplan.repository.MealPlanRepository;
import com.vkusplan.repository.UserRepository;
import com.vkusplan.service.GroceryItemNotFoundException;
import com.vkusplan.service.MealNotFoundException;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class GroceryController {

    private final GroceryItemRepository groceryItemRepository;
    private final MealPlanRepository mealPlanRepository;
    private final UserRepository userRepository;
    private final GroceryItemMapper groceryItemMapper;

    @GetMapping("/api/meal-plans/{planId}/grocery-list")
    @Transactional(readOnly = true)
    public GroceryListResponse getGroceryList(
            @PathVariable Integer planId,
            Authentication authentication
    ) {
        MealPlan plan = findAuthorizedPlan(planId, authentication);

        List<GroceryItem> items = groceryItemRepository.findByMealPlanId(plan.getId());

        int matched = 0, review = 0, notFound = 0;
        double total = 0.0;

        List<GroceryItemRead> dtos = new ArrayList<>(items.size());
        for (GroceryItem item : items) {
            dtos.add(groceryItemMapper.toRead(item));
            total += item.getTotalPrice() != null ? item.getTotalPrice() : 0.0;

            String status = item.getMatchStatus();
            if (MatchStatus.MATCHED.getValue().equals(status)) matched++;
            else if (MatchStatus.REQUIRES_REVIEW.getValue().equals(status)) review++;
            else notFound++;
        }

        return GroceryListResponse.builder()
                .items(dtos)
                .totalCost(Math.round(total * 100.0) / 100.0)
                .matchedCount(matched)
                .reviewCount(review)
                .notFoundCount(notFound)
                .build();
    }

    @PatchMapping("/api/grocery-items/{itemId}")
    @Transactional
    public GroceryItemRead updateGroceryItem(
            @PathVariable Integer itemId,
            @RequestBody GroceryItemUpdate update,
            Authentication authentication
    ) {
        GroceryItem item = groceryItemRepository.findById(itemId)
                .orElseThrow(() -> new GroceryItemNotFoundException(
                        "Grocery item " + itemId + " not found"
                ));

        // Validate ownership via parent plan
        findAuthorizedPlan(item.getMealPlan().getId(), authentication);

        if (update.getIsBought() != null) {
            item.setIsBought(update.getIsBought());
        }

        return groceryItemMapper.toRead(groceryItemRepository.save(item));
    }

    @PostMapping("/api/meal-plans/{planId}/grocery-items")
    @Transactional
    public GroceryItemRead addManualItem(
            @PathVariable Integer planId,
            @Valid @RequestBody ManualGroceryItemCreate request,
            Authentication authentication
    ) {
        MealPlan plan = findAuthorizedPlan(planId, authentication);

        GroceryItem item = GroceryItem.builder()
                .mealPlan(plan)
                .ingredient(null)
                .productName(request.getProductName())
                .neededQuantity(request.getNeededQuantity())
                .neededUnit(request.getNeededUnit())
                .pricePerPackage(request.getPrice())
                .totalPrice(request.getPrice())
                .matchStatus(MatchStatus.MATCHED.getValue())
                .isBought(false)
                .isManual(true)
                .build();

        return groceryItemMapper.toRead(groceryItemRepository.save(item));
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    private User resolveCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            return null;
        }
        return userRepository.findByEmail(authentication.getName()).orElse(null);
    }

    private MealPlan findAuthorizedPlan(Integer id, Authentication authentication) {
        MealPlan plan = mealPlanRepository.findById(id)
                .orElseThrow(() -> new MealNotFoundException("Meal plan " + id + " not found"));

        if (plan.getUser() == null) {
            return plan;
        }

        User currentUser = resolveCurrentUser(authentication);
        if (currentUser == null || !plan.getUser().getId().equals(currentUser.getId())) {
            throw new MealNotFoundException("Meal plan " + id + " not found");
        }
        return plan;
    }
}