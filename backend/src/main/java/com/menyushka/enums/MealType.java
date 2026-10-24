package com.menyushka.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum MealType {
    BREAKFAST("breakfast"),
    LUNCH("lunch"),
    DINNER("dinner");

    private final String value;

    MealType(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    @JsonCreator
    public static MealType fromValue(String value) {
        for (MealType v : values()) {
            if (v.value.equals(value)) {
                return v;
            }
        }
        throw new IllegalArgumentException("Unknown MealType: " + value);
    }
}