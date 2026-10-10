package com.vkusplan.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum MatchStatus {
    MATCHED("matched"),
    REQUIRES_REVIEW("requires_review"),
    NOT_FOUND("not_found");

    private final String value;

    MatchStatus(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    @JsonCreator
    public static MatchStatus fromValue(String value) {
        for (MatchStatus v : values()) {
            if (v.value.equals(value)) {
                return v;
            }
        }
        throw new IllegalArgumentException("Unknown MatchStatus: " + value);
    }
}