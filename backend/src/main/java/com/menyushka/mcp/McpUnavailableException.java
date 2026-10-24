package com.menyushka.mcp;

public class McpUnavailableException extends McpException {
    public McpUnavailableException(String message) {
        super(message);
    }

    public McpUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}