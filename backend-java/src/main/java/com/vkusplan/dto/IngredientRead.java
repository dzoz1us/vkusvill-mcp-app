package com.vkusplan.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IngredientRead {

    private String id;
    private String name;
    private Double quantity;
    private String unit;

    /** Для этого продукта есть товар во ВкусВилл. */
    private Boolean available;
}