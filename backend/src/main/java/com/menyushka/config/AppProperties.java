package com.menyushka.config;

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

    /** Секрет подписи JWT. В проде обязательно переопределить. */
    private String jwtSecret = "dev-secret-change-me-dev-secret-change-me-0123456789";
    private int jwtTtlHours = 168;

    /** В режиме разработки токен восстановления пароля возвращается в ответе (почты нет). */
    private boolean devMode = true;

    /** Администратор по умолчанию (создаётся, если администраторов нет). */
    private String adminEmail = "admin@menyushka.ru";
    private String adminPassword = "admin12345";
    private String adminName = "Администратор";

    /** Заполнять рецепты и товары при старте, если база пуста. */
    private boolean autoSeed = true;

    /**
     * В планы попадают только рецепты, все ингредиенты которых найдены во ВкусВилл и есть в наличии.
     * Отключается только в тестах.
     */
    private boolean strictCatalog = true;

    /** Максимум товаров в одной ссылке корзины ВкусВилл (лимит MCP — 100). */
    private int cartMaxItems = 100;
}