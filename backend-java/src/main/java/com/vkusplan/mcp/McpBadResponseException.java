package com.vkusplan.mcp;

public class McpBadResponseException extends McpException {
    public McpBadResponseException(String message) {
        super(message);
    }

    public McpBadResponseException(String message, Throwable cause) {
        super(message, cause);
    }
}