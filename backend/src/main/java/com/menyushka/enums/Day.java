package com.menyushka.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum Day {
    MON("mon"),
    TUE("tue"),
    WED("wed"),
    THU("thu"),
    FRI("fri"),
    SAT("sat"),
    SUN("sun");

    private final String value;

    Day(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    @JsonCreator
    public static Day fromValue(String value) {
        for (Day d : values()) {
            if (d.value.equals(value)) {
                return d;
            }
        }
        throw new IllegalArgumentException("Unknown Day: " + value);
    }
}