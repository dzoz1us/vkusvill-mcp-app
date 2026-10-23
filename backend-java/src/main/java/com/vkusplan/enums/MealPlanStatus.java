package com.vkusplan.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum MealPlanStatus {
    GENERATING("generating"),
    READY("ready"),
    ERROR("error");

    private final String value;

    MealPlanStatus(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    @JsonCreator
    public static MealPlanStatus fromValue(String value) {
        for (MealPlanStatus v : values()) {
            if (v.value.equals(value)) {
                return v;
            }
        }
        throw new IllegalArgumentException("Unknown MealPlanStatus: " + value);
    }
}