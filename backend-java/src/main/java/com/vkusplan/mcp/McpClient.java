package com.vkusplan.mcp;

import java.net.SocketTimeoutException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

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
import com.vkusplan.config.AppProperties;

/**
 * Low-level client for the VkusVill MCP server.
 *
 * Isolated on purpose: no business logic, no ORM. The service layer
 * translates ProductCandidate into GroceryItem rows.
 */
@Component
public class McpClient {

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
                .build();
    }

    // ------------------------------------------------------------------
    // Public API
    // ------------------------------------------------------------------

    public List<ProductCandidate> productsSearch(String query) {
        Map<String, Object> args = new LinkedHashMap<>();
        args.put("q", query);
        args.put("page", 1);
        args.put("mode", "custom");
        args.put("fields", List.of(
                "id", "xml_id", "name", "price", "weight", "unit", "url"
        ));
        args.put("vvonly", 1);

        Object result = callTool("vkusvill_products_search", args);
        return parseProductList(result);
    }

    public String cartLinkCreate(List<Map<String, Object>> products) {
        Map<String, Object> args = Map.of("products", products);
        Object result = callTool("vkusvill_cart_link_create", args);
        if (result == null) return null;

        JsonNode node = objectMapper.valueToTree(result);
        JsonNode data = node.path("data");
        if (data.has("link")) return data.get("link").asText();
        if (data.has("url")) return data.get("url").asText();
        return null;
    }

    // ------------------------------------------------------------------
    // Internals
    // ------------------------------------------------------------------

    private Object callTool(String toolName, Map<String, Object> arguments) {
        int id = requestId.incrementAndGet();

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("jsonrpc", "2.0");
        body.put("id", id);
        body.put("method", "tools/call");
        body.put("params", Map.of(
                "name", toolName,
                "arguments", arguments
        ));

        String raw;
        try {
            raw = restClient.post()
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON, MediaType.TEXT_EVENT_STREAM)
                    .body(body)
                    .retrieve()
                    .body(String.class);
        } catch (HttpClientErrorException.TooManyRequests e) {
            throw new McpUnavailableException("MCP rate limit (429)", e);
        } catch (HttpServerErrorException e) {
            throw new McpUnavailableException("MCP returned " + e.getStatusCode(), e);
        } catch (ResourceAccessException e) {
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
                throw new McpBadResponseException("MCP error: " + root.get("error"));
            }

            JsonNode result = root.path("result");
            JsonNode content = result.path("content");
            if (content.isArray() && content.size() > 0) {
                String text = content.get(0).path("text").asText("");
                if (!text.isBlank()) {
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
        if (!items.isArray()) return List.of();

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
        String xmlId = item.has("xml_id") ? item.get("xml_id").asText() : null;
        String name = item.has("name") ? item.get("name").asText() : null;
        if (xmlId == null || name == null) {
            return null;
        }

        Integer productId = item.has("id") ? item.get("id").asInt() : null;

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

        return ProductCandidate.builder()
                .productId(productId)
                .xmlId(xmlId)
                .name(unescapeHtml(name))
                .price(price)
                .packageQuantity(packageQuantity)
                .packageUnit(packageUnit)
                .url(url)
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