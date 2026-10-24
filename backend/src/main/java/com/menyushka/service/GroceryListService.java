package com.menyushka.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.menyushka.domain.GroceryItem;
import com.menyushka.domain.MealPlan;
import com.menyushka.domain.ProductMapping;
import com.menyushka.dto.GroceryDtos.ProductOption;
import com.menyushka.dto.GroceryDtos.ReplaceProductRequest;
import com.menyushka.dto.GroceryItemRead;
import com.menyushka.dto.GroceryItemUpdate;
import com.menyushka.dto.GroceryListResponse;
import com.menyushka.dto.ManualGroceryItemCreate;
import com.menyushka.enums.ErrorCode;
import com.menyushka.enums.MatchStatus;
import com.menyushka.exception.ApiException;
import com.menyushka.mapper.GroceryItemMapper;
import com.menyushka.repository.GroceryItemRepository;

/** Список покупок плана: просмотр, правка количества, удаление, замена товара. */
@Service
public class GroceryListService {

    private final GroceryItemRepository groceryRepo;
    private final MealPlanService mealPlanService;
    private final CatalogService catalogService;
    private final VkusVillService vkusVillService;
    private final GroceryItemMapper mapper;

    public GroceryListService(
            GroceryItemRepository groceryRepo,
            MealPlanService mealPlanService,
            CatalogService catalogService,
            VkusVillService vkusVillService,
            GroceryItemMapper mapper
    ) {
        this.groceryRepo = groceryRepo;
        this.mealPlanService = mealPlanService;
        this.catalogService = catalogService;
        this.vkusVillService = vkusVillService;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public GroceryListResponse getList(Integer planId, Integer userId) {
        MealPlan plan = mealPlanService.getOwned(planId, userId);
        List<GroceryItem> items = groceryRepo.findByMealPlanId(plan.getId());

        int matched = 0, review = 0, notFound = 0;
        double total = 0.0;
        List<GroceryItemRead> dtos = new ArrayList<>(items.size());
        for (GroceryItem item : items) {
            dtos.add(mapper.toRead(item));
            total += item.getTotalPrice() != null ? item.getTotalPrice() : 0.0;

            String status = item.getMatchStatus();
            if (MatchStatus.MATCHED.getValue().equals(status)) matched++;
            else if (MatchStatus.REQUIRES_REVIEW.getValue().equals(status)) review++;
            else notFound++;
        }

        return GroceryListResponse.builder()
                .items(dtos)
                .totalCost(CatalogService.round2(total))
                .matchedCount(matched)
                .reviewCount(review)
                .notFoundCount(notFound)
                .build();
    }

    private GroceryItem ownedItem(Integer itemId, Integer userId) {
        GroceryItem item = groceryRepo.findById(itemId)
                .orElseThrow(() -> new GroceryItemNotFoundException("Grocery item " + itemId + " not found"));
        mealPlanService.getOwned(item.getMealPlan().getId(), userId);
        return item;
    }

    @Transactional
    public GroceryItem update(Integer itemId, Integer userId, GroceryItemUpdate update) {
        GroceryItem item = ownedItem(itemId, userId);

        if (update.getIsBought() != null) {
            item.setIsBought(update.getIsBought());
        }

        if (Boolean.TRUE.equals(item.getIsManual())) {
            if (update.getNeededQuantity() != null) {
                if (update.getNeededQuantity() <= 0) {
                    throw ApiException.badRequest("Количество должно быть больше нуля");
                }
                item.setNeededQuantity(update.getNeededQuantity());
            }
            if (update.getPrice() != null) {
                if (update.getPrice() < 0) {
                    throw ApiException.badRequest("Цена не может быть отрицательной");
                }
                item.setPricePerPackage(update.getPrice());
                item.setTotalPrice(update.getPrice());
            }
        } else if (update.getPackageCount() != null) {
            if (update.getPackageCount() < 1 || update.getPackageCount() > 99) {
                throw ApiException.badRequest("Количество — от 1 до 99");
            }
            if (item.getPricePerPackage() == null || item.getPackageQuantity() == null) {
                throw ApiException.badRequest("Для этой позиции нет товара — сначала выберите товар");
            }
            CatalogService.Purchase base = new CatalogService.Purchase(
                    item.getPackageCount() == null ? 1 : item.getPackageCount(),
                    item.getPackageQuantity(),
                    item.getPackageUnit(),
                    item.getPricePerPackage(),
                    item.getTotalPrice() == null ? 0.0 : item.getTotalPrice(),
                    0.0,
                    Boolean.TRUE.equals(item.getSoldByWeight())
            );
            CatalogService.Purchase edited = catalogService.withPackageCount(base, update.getPackageCount());
            item.setPackageCount(edited.packageCount());
            item.setTotalPrice(edited.totalPrice());
        }

        groceryRepo.save(item);
        mealPlanService.recomputeTotals(item.getMealPlan());
        return item;
    }

    @Transactional
    public void delete(Integer itemId, Integer userId) {
        GroceryItem item = ownedItem(itemId, userId);
        MealPlan plan = item.getMealPlan();
        groceryRepo.delete(item);
        groceryRepo.flush();
        mealPlanService.recomputeTotals(plan);
    }

    @Transactional
    public GroceryItem addManual(Integer planId, Integer userId, ManualGroceryItemCreate request) {
        MealPlan plan = mealPlanService.getOwned(planId, userId);
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
                .soldByWeight(false)
                .build();
        groceryRepo.save(item);
        mealPlanService.recomputeTotals(plan);
        return item;
    }

    @Transactional(readOnly = true)
    public List<ProductOption> alternatives(Integer itemId, Integer userId) {
        GroceryItem item = ownedItem(itemId, userId);
        if (Boolean.TRUE.equals(item.getIsManual())) {
            throw ApiException.badRequest("Для ручной позиции нет автоматических аналогов");
        }
        return vkusVillService.alternativesFor(item).stream().map(ProductOption::of).toList();
    }

    /** Подменяет товар только в этом списке (общее сопоставление ингредиента не меняется). */
    @Transactional
    public GroceryItem replaceProduct(Integer itemId, Integer userId, ReplaceProductRequest request) {
        GroceryItem item = ownedItem(itemId, userId);
        if (Boolean.TRUE.equals(item.getIsManual())) {
            throw ApiException.badRequest("Ручную позицию можно только изменить или удалить");
        }
        ProductMapping base = item.getIngredient() == null ? null
                : catalogService.mappingsByIngredientId().get(item.getIngredient().getId());
        ProductMapping basis = vkusVillService.mappingFrom(request.toCandidate(), base);

        CatalogService.Purchase purchase = catalogService
                .purchase(basis, item.getNeededQuantity(), item.getNeededUnit())
                .orElseThrow(() -> new ApiException(
                        ErrorCode.VALIDATION_ERROR,
                        HttpStatus.UNPROCESSABLE_ENTITY,
                        "Для этого товара нельзя рассчитать количество упаковок"));

        mealPlanService.applyPurchase(item, basis, purchase);
        groceryRepo.save(item);
        mealPlanService.recomputeTotals(item.getMealPlan());
        return item;
    }
}
