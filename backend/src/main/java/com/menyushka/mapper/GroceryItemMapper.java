package com.menyushka.mapper;

import org.springframework.stereotype.Component;

import com.menyushka.domain.GroceryItem;
import com.menyushka.dto.GroceryItemRead;
import com.menyushka.enums.MatchStatus;

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
                .soldByWeight(item.getSoldByWeight())
                .cartQuantity(cartQuantity(item))
                .build();
    }

    /** Сколько отправить в корзину ВкусВилл. */
    public static Double cartQuantity(GroceryItem item) {
        if (item.getPackageCount() == null) return null;
        if (Boolean.TRUE.equals(item.getSoldByWeight())) {
            double step = item.getPackageQuantity() != null ? item.getPackageQuantity() : 100.0;
            return Math.round(item.getPackageCount() * step) / 1000.0;
        }
        return item.getPackageCount().doubleValue();
    }
}
