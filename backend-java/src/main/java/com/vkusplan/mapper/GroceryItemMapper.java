package com.vkusplan.mapper;

import org.springframework.stereotype.Component;

import com.vkusplan.domain.GroceryItem;
import com.vkusplan.dto.GroceryItemRead;
import com.vkusplan.enums.MatchStatus;

@Component
public class GroceryItemMapper {

    public GroceryItemRead toRead(GroceryItem item) {
        if (item == null) return null;

        return GroceryItemRead.builder()
                .id(String.valueOf(item.getId()))
                .ingredientId(item.getIngredient() != null
                        ? String.valueOf(item.getIngredient().getId())
                        : null)
                .productName(item.getProductName())
                .neededQuantity(item.getNeededQuantity())
                .neededUnit(item.getNeededUnit())
                .productUrl(item.getProductUrl())
                .productXmlId(item.getProductXmlId())
                .packageQuantity(item.getPackageQuantity())
                .packageUnit(item.getPackageUnit())
                .packageCount(item.getPackageCount())
                .pricePerPackage(item.getPricePerPackage())
                .totalPrice(item.getTotalPrice())
                .matchStatus(MatchStatus.fromValue(item.getMatchStatus()))
                .isBought(item.getIsBought())
                .isManual(item.getIsManual())
                .build();
    }
}