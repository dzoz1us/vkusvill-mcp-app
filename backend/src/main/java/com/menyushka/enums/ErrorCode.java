package com.menyushka.enums;

import com.fasterxml.jackson.annotation.JsonValue;

public enum ErrorCode {
    VALIDATION_ERROR,
    NOT_FOUND,
    INTERNAL_ERROR,
    VKUSVILL_MCP_UNAVAILABLE,
    VKUSVILL_MCP_TIMEOUT,
    VKUSVILL_MCP_BAD_RESPONSE,
    BUDGET_TOO_LOW,
    NO_SUITABLE_RECIPES,
    UNAUTHORIZED,
    FORBIDDEN,
    CONFLICT,
    ACCOUNT_BLOCKED,
    NOTHING_TO_ORDER,
    BUDGET_EXCEEDED;

    @JsonValue
    public String getValue() {
        return name();
    }
}