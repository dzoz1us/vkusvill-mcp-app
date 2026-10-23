package com.vkusplan.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Data;

@Data
@Component
@ConfigurationProperties(prefix = "app")
public class AppProperties {

    private String frontendOrigin = "http://localhost:5173";

    private String mcpUrl = "https://mcp.vkusvill.ru/mcp";
    private int mcpTimeoutMs = 10_000;
    private boolean enableLiveMcp = false;
    private int searchCacheTtlSeconds = 1800;
}