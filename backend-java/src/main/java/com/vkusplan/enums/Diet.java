package com.vkusplan.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum Diet {
    NONE("none"),
    VEGETARIAN("vegetarian"),
    VEGAN("vegan"),
    PESCATARIAN("pescatarian");

    private final String value;

    Diet(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    @JsonCreator
    public static Diet fromValue(String value) {
        for (Diet v : values()) {
            if (v.value.equals(value)) {
                return v;
            }
        }
        throw new IllegalArgumentException("Unknown Diet: " + value);
    }
}