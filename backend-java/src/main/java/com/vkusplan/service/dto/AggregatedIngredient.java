package com.vkusplan.service.dto;

import com.vkusplan.enums.Unit;

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