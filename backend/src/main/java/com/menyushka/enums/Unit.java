package com.menyushka.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum Unit {
    G("g"),
    ML("ml"),
    PCS("pcs");

    private final String value;

    Unit(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    @JsonCreator
    public static Unit fromValue(String value) {
        for (Unit v : values()) {
            if (v.value.equals(value)) {
                return v;
            }
        }
        throw new IllegalArgumentException("Unknown Unit: " + value);
    }
}