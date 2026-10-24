package com.menyushka.dto;

import com.menyushka.enums.MatchStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroceryItemRead {

    private String id;
    private String ingredientId;
    private String productName;

    private Double neededQuantity;
    private String neededUnit;

    private String productUrl;
    private String productXmlId;

    private Double packageQuantity;
    private String packageUnit;
    private Integer packageCount;
    private Double pricePerPackage;
    private Double totalPrice;

    private MatchStatus matchStatus;
    private Boolean isBought;
    private Boolean isManual;

    /** Товар на вес: цена за 100 г, в корзину уходят килограммы. */
    private Boolean soldByWeight;

    /** Количество, которое уйдёт в корзину: штуки или килограммы. */
    private Double cartQuantity;
}