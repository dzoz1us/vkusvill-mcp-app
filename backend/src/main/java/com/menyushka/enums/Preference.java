package com.menyushka.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum Preference {
    QUICK("quick"),
    LOW_CALORIE("low_calorie"),
    FAMILY("family"),
    HEALTHY("healthy"),
    HIGH_PROTEIN("high_protein"),
    BUDGET("budget"),
    HEARTY("hearty");

    private final String value;

    Preference(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    @JsonCreator
    public static Preference fromValue(String value) {
        for (Preference v : values()) {
            if (v.value.equals(value)) {
                return v;
            }
        }
        throw new IllegalArgumentException("Unknown Preference: " + value);
    }
}