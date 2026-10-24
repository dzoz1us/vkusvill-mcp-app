package com.menyushka.mcp;

import java.net.SocketTimeoutException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.menyushka.config.AppProperties;

@Component
public class McpClient {

    private static final Logger log = LoggerFactory.getLogger(McpClient.class);

    private final AppProperties props;
    private final ObjectMapper objectMapper;
    private final RestClient restClient;
    private final AtomicInteger requestId = new AtomicInteger(0);

    public McpClient(AppProperties props, ObjectMapper objectMapper) {
        this.props = props;
        this.objectMapper = objectMapper;

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(props.getMcpTimeoutMs());
        factory.setReadTimeout(props.getMcpTimeoutMs());

        this.restClient = RestClient.builder()
                .baseUrl(props.getMcpUrl())
                .requestFactory(factory)
                .defaultHeader("User-Agent", "Menyushka-Backend/0.1")
                .build();

        log.info("McpClient initialized: url={}, enableLiveMcp={}, timeout={}ms",
                props.getMcpUrl(), props.isEnableLiveMcp(), props.getMcpTimeoutMs());
    }

    public List<ProductCandidate> productsSearch(String query) {
        Map<String, Object> args = new LinkedHashMap<>();
        args.put("q", query);
        args.put("page", 1);
        args.put("mode", "custom");
        args.put("fields", List.of("id", "name", "price", "weight", "unit", "url"));
        args.put("vvonly", 1);

        Object result = callTool("vkusvill_products_search", args);
        return parseProductList(result);
    }

    /** Актуальные данные о товаре; пусто, если товар не найден (снят с продажи). */
    public java.util.Optional<ProductCandidate> productDetails(int productId) {
        Object result = callTool("vkusvill_product_details", Map.of("id", productId));
        if (result == null) {
            return java.util.Optional.empty();
        }
        JsonNode node = objectMapper.valueToTree(result);
        if (node.has("ok") && !node.get("ok").asBoolean()) {
            return java.util.Optional.empty();
        }
        return java.util.Optional.ofNullable(parseProduct(node.path("data")));
    }

    /** Аналоги товара из каталога ВкусВилл. */
    public List<ProductCandidate> productAnalogs(int productId) {
        Object result = callTool("vkusvill_product_analogs", Map.of("id", productId));
        if (result == null) {
            return List.of();
        }
        JsonNode node = objectMapper.valueToTree(result);
        JsonNode items = node.path("data").path("products");
        List<ProductCandidate> out = new ArrayList<>();
        if (items.isArray()) {
            for (JsonNode item : items) {
                ProductCandidate p = parseProduct(item);
                if (p != null) {
                    out.add(p);
                }
            }
        }
        return out;
    }

    public String cartLinkCreate(List<Map<String, Object>> products) {
        try {
            log.info("MCP cartLinkCreate raw JSON: {}", objectMapper.writeValueAsString(products));
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize payload", e);
        }
        Map<String, Object> args = Map.of("products", products);
        Object result = callTool("vkusvill_cart_link_create", args);

        if (result == null) {
            log.warn("cartLinkCreate: MCP returned null result");
            return null;
        }

        JsonNode node = objectMapper.valueToTree(result);
        log.info("cartLinkCreate response: {}", node);

        if (node.has("ok") && !node.get("ok").asBoolean()) {
            log.error("cartLinkCreate: MCP rejected request: {}", node);
            return null;
        }

        if (node.has("link")) return node.get("link").asText();
        if (node.has("url")) return node.get("url").asText();

        JsonNode data = node.path("data");
        if (data.has("link")) return data.get("link").asText();
        if (data.has("url")) return data.get("url").asText();
        if (data.has("cart_url")) return data.get("cart_url").asText();
        if (data.has("share_basket_url")) return data.get("share_basket_url").asText();

        log.warn("cartLinkCreate: no URL found in response: {}", node);
        return null;
    }

    private Object callTool(String toolName, Map<String, Object> arguments) {
        int id = requestId.incrementAndGet();

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("jsonrpc", "2.0");
        body.put("id", id);
        body.put("method", "tools/call");
        body.put("params", Map.of("name", toolName, "arguments", arguments));

        String raw;
        try {
            raw = restClient.post()
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON, MediaType.TEXT_EVENT_STREAM)
                    .body(body)
                    .retrieve()
                    .body(String.class);
        } catch (HttpClientErrorException.TooManyRequests e) {
            log.error("MCP rate limit (429): {}", e.getMessage());
            throw new McpUnavailableException("MCP rate limit", e);
        } catch (HttpServerErrorException e) {
            log.error("MCP 5xx: {} {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new McpUnavailableException("MCP returned " + e.getStatusCode(), e);
        } catch (ResourceAccessException e) {
            log.error("MCP network error: {}", e.getMessage(), e);
            if (e.getCause() instanceof SocketTimeoutException) {
                throw new McpTimeoutException("MCP request timed out", e);
            }
            throw new McpUnavailableException("MCP unreachable", e);
        }

        if (raw == null || raw.isBlank()) {
            throw new McpBadResponseException("Empty MCP response");
        }

        try {
            JsonNode root = objectMapper.readTree(raw);
            if (root.has("error")) {
                log.error("MCP JSON-RPC error for {}: {}", toolName, root.get("error"));
                throw new McpBadResponseException("MCP error: " + root.get("error"));
            }

            JsonNode result = root.path("result");
            JsonNode content = result.path("content");
            if (content.isArray() && content.size() > 0) {
                String text = content.get(0).path("text").asText("");
                if (!text.isBlank()) {
                    if ("vkusvill_cart_link_create".equals(toolName)) {
                        log.info("MCP raw text for {}: {}", toolName, text);
                    }
                    return objectMapper.readValue(text, Object.class);
                }
            }
            return null;
        } catch (JsonProcessingException e) {
            throw new McpBadResponseException("MCP response is not valid JSON", e);
        }
    }

    private List<ProductCandidate> parseProductList(Object raw) {
        if (raw == null) return List.of();

        JsonNode root = objectMapper.valueToTree(raw);
        JsonNode items = root.path("data").path("items");
        if (!items.isArray()) {
            return List.of();
        }

        List<ProductCandidate> result = new ArrayList<>();
        for (JsonNode item : items) {
            ProductCandidate p = parseProduct(item);
            if (p != null) {
                result.add(p);
            }
        }
        return result;
    }

    private ProductCandidate parseProduct(JsonNode item) {
        Integer productId = item.has("id") ? item.get("id").asInt() : null;
        String name = item.has("name") ? item.get("name").asText() : null;
        if (productId == null || name == null) {
            return null;
        }

        String xmlId = String.valueOf(productId);

        Double price = null;
        JsonNode priceNode = item.path("price");
        if (priceNode.isObject() && priceNode.has("current")) {
            price = priceNode.get("current").asDouble();
        } else if (priceNode.isNumber()) {
            price = priceNode.asDouble();
        }

        Double packageQuantity = null;
        String packageUnit = null;
        JsonNode weight = item.path("weight");
        if (weight.isObject()) {
            double val = weight.path("value").asDouble(0);
            String wUnit = weight.path("unit").asText("");
            Object[] canonical = toCanonical(val, wUnit);
            if (canonical != null) {
                packageQuantity = (Double) canonical[0];
                packageUnit = (String) canonical[1];
            }
        }

        String url = item.has("url") ? item.get("url").asText() : null;
        boolean soldByWeight = !weight.isObject() && "кг".equals(item.path("unit").asText(""));

        return ProductCandidate.builder()
                .productId(productId)
                .xmlId(xmlId)
                .name(unescapeHtml(name))
                .price(price)
                .packageQuantity(packageQuantity)
                .packageUnit(packageUnit)
                .url(url)
                .soldByWeight(soldByWeight)
                .build();
    }

    private Object[] toCanonical(double value, String unit) {
        String u = unit == null ? "" : unit.trim().toLowerCase();
        return switch (u) {
            case "кг", "kg" -> new Object[]{value * 1000.0, "g"};
            case "г", "g" -> new Object[]{value, "g"};
            case "л", "l" -> new Object[]{value * 1000.0, "ml"};
            case "мл", "ml" -> new Object[]{value, "ml"};
            case "шт", "pcs" -> new Object[]{value, "pcs"};
            default -> null;
        };
    }

    private String unescapeHtml(String s) {
        return s.replace("&nbsp;", " ")
                .replace("\u00A0", " ")
                .replace("&amp;", "&")
                .replace("&lt;", "<")
                .replace("&gt;", ">")
                .replace("&quot;", "\"");
    }
}