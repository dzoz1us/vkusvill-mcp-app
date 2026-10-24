package com.menyushka.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroceryItemUpdate {

    private Boolean isBought;

    /** Сколько упаковок (или шагов по 100 г для товара на вес) купить. */
    private Integer packageCount;

    /** Только для ручных позиций. */
    private Double neededQuantity;
    private Double price;
}