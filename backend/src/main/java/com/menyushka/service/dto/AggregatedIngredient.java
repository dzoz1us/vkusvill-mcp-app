package com.menyushka.service.dto;

import com.menyushka.enums.Unit;

public record AggregatedIngredient(
        Integer ingredientId,
        String name,
        double neededQuantity,
        Unit unit
) {
    @Override
    public String toString() {
        return name + ": " + neededQuantity + unit.getValue();
    }
}