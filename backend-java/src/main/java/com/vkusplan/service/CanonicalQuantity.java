package com.vkusplan.service;

import com.vkusplan.enums.Unit;

public record CanonicalQuantity(double value, Unit unit) {

    public CanonicalQuantity add(CanonicalQuantity other) {
        if (this.unit != other.unit) {
            throw new IllegalArgumentException(
                    "Cannot add " + unit.getValue() + " and " + other.unit.getValue()
            );
        }
        return new CanonicalQuantity(this.value + other.value, this.unit);
    }

    @Override
    public String toString() {
        return value + unit.getValue();
    }
}