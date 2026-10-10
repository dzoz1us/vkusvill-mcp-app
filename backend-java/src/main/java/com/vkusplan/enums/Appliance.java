package com.vkusplan.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum Appliance {
    STOVE("stove"),
    OVEN("oven"),
    MICROWAVE("microwave"),
    MULTICOOKER("multicooker"),
    AIR_FRYER("air_fryer"),
    BLENDER("blender");

    private final String value;

    Appliance(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    @JsonCreator
    public static Appliance fromValue(String value) {
        for (Appliance v : values()) {
            if (v.value.equals(value)) {
                return v;
            }
        }
        throw new IllegalArgumentException("Unknown Appliance: " + value);
    }
}