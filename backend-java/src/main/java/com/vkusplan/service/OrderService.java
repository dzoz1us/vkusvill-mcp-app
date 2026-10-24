package com.vkusplan.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vkusplan.config.AppProperties;
import com.vkusplan.domain.GroceryItem;
import com.vkusplan.domain.MealPlan;
import com.vkusplan.domain.OrderItem;
import com.vkusplan.domain.OrderStatus;
import com.vkusplan.domain.PurchaseOrder;
import com.vkusplan.domain.User;
import com.vkusplan.dto.OrderDtos.OrderItemRead;
import com.vkusplan.dto.OrderDtos.OrderRead;
import com.vkusplan.enums.ErrorCode;
import com.vkusplan.enums.MatchStatus;
import com.vkusplan.exception.ApiException;
import com.vkusplan.mapper.GroceryItemMapper;
import com.vkusplan.mcp.McpClient;
import com.vkusplan.mcp.McpException;
import com.vkusplan.repository.GroceryItemRepository;
import com.vkusplan.repository.OrderStatusRepository;
import com.vkusplan.repository.PurchaseOrderRepository;
import com.vkusplan.repository.UserRepository;

/**
 * Оформление заказа: список покупок уходит во ВкусВилл одной ссылкой корзины,
 * дальше заказ живёт со статусами, уведомлениями и историей.
 */
@Service
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    public static final String STATUS_CREATED = "CREATED";
    public static final String STATUS_CONFIRMED = "CONFIRMED";

    /** Ограничение MCP на количество одного товара в корзине. */
    private static final double MAX_Q_PER_ITEM = 40.0;

    private final PurchaseOrderRepository orders;
    private final OrderStatusRepository statuses;
    private final GroceryItemRepository groceryRepo;
    private final UserRepository users;
    private final MealPlanService mealPlanService;
    private final VkusVillService vkusVillService;
    private final NotificationService notifications;
    private final McpClient mcpClient;
    private final AppProperties props;

    public OrderService(
            PurchaseOrderRepository orders,
            OrderStatusRepository statuses,
            GroceryItemRepository groceryRepo,
            UserRepository users,
            MealPlanService mealPlanService,
            VkusVillService vkusVillService,
            NotificationService notifications,
            McpClient mcpClient,
            AppProperties props
    ) {
        this.orders = orders;
        this.statuses = statuses;
        this.groceryRepo = groceryRepo;
        this.users = users;
        this.mealPlanService = mealPlanService;
        this.vkusVillService = vkusVillService;
        this.notifications = notifications;
        this.mcpClient = mcpClient;
        this.props = props;
    }

    // ------------------------------------------------------------------
    // Checkout
    // ------------------------------------------------------------------

    /** Отправляет список покупок плана во ВкусВилл и создаёт заказ. */
    @Transactional
    public PurchaseOrder checkout(Integer planId, Integer userId) {
        MealPlan plan = mealPlanService.getOwned(planId, userId);

        List<GroceryItem> cartItems = groceryRepo.findByMealPlanId(plan.getId()).stream()
                .filter(i -> !Boolean.TRUE.equals(i.getIsBought()))
                .filter(i -> MatchStatus.MATCHED.getValue().equals(i.getMatchStatus()))
                .filter(i -> i.getProductXmlId() != null && i.getPackageCount() != null)
                .toList();

        if (cartItems.isEmpty()) {
            throw new ApiException(
                    ErrorCode.NOTHING_TO_ORDER,
                    HttpStatus.UNPROCESSABLE_ENTITY,
                    "В списке нет товаров, которые можно заказать"
            );
        }

        PurchaseOrder order = PurchaseOrder.builder()
                .user(users.findById(userId).orElseThrow())
                .mealPlan(plan)
                .statusCode(STATUS_CREATED)
                .itemsCount(0)
                .totalCost(0.0)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        double total = 0.0;
        for (GroceryItem g : cartItems) {
            Double q = GroceryItemMapper.cartQuantity(g);
            order.getItems().add(OrderItem.builder()
                    .order(order)
                    .productXmlId(g.getProductXmlId())
                    .productName(g.getProductName())
                    .productUrl(g.getProductUrl())
                    .packageCount(g.getPackageCount())
                    .cartQuantity(q == null ? 1.0 : q)
                    .soldByWeight(Boolean.TRUE.equals(g.getSoldByWeight()))
                    .pricePerPackage(g.getPricePerPackage())
                    .totalPrice(g.getTotalPrice())
                    .build());
            total += g.getTotalPrice() == null ? 0.0 : g.getTotalPrice();
        }
        order.setItemsCount(order.getItems().size());
        order.setTotalCost(CatalogService.round2(total));
        order.setCartUrl(createCartLink(order.getItems()));

        PurchaseOrder saved = orders.save(order);
        notifications.push(order.getUser(), saved.getId(),
                "Заказ №" + saved.getId() + ": корзина собрана",
                "Список продуктов передан во ВкусВилл. Осталось оформить заказ на сайте.");
        return saved;
    }

    /** Повторяет прошлый заказ: те же товары и количества, новая ссылка корзины. */
    @Transactional
    public PurchaseOrder repeat(Integer orderId, Integer userId) {
        PurchaseOrder original = requireOwned(orderId, userId);

        PurchaseOrder copy = PurchaseOrder.builder()
                .user(original.getUser())
                .mealPlan(original.getMealPlan())
                .statusCode(STATUS_CREATED)
                .repeatedFromId(original.getId())
                .itemsCount(original.getItems().size())
                .totalCost(original.getTotalCost())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        for (OrderItem i : original.getItems()) {
            copy.getItems().add(OrderItem.builder()
                    .order(copy)
                    .productXmlId(i.getProductXmlId())
                    .productName(i.getProductName())
                    .productUrl(i.getProductUrl())
                    .packageCount(i.getPackageCount())
                    .cartQuantity(i.getCartQuantity())
                    .soldByWeight(i.getSoldByWeight())
                    .pricePerPackage(i.getPricePerPackage())
                    .totalPrice(i.getTotalPrice())
                    .build());
        }
        copy.setCartUrl(createCartLink(copy.getItems()));

        PurchaseOrder saved = orders.save(copy);
        notifications.push(saved.getUser(), saved.getId(),
                "Заказ №" + saved.getId() + ": повтор заказа №" + original.getId(),
                "Корзина собрана заново, осталось оформить заказ на сайте ВкусВилл.");
        return saved;
    }

    private String createCartLink(List<OrderItem> items) {
        vkusVillService.requireLive();
        if (items.size() > props.getCartMaxItems()) {
            throw new ApiException(
                    ErrorCode.VALIDATION_ERROR,
                    HttpStatus.UNPROCESSABLE_ENTITY,
                    "В одну корзину помещается не больше " + props.getCartMaxItems()
                            + " товаров — удалите лишнее из списка"
            );
        }

        List<Map<String, Object>> payload = new ArrayList<>(items.size());
        for (OrderItem i : items) {
            int xmlId;
            try {
                xmlId = Integer.parseInt(i.getProductXmlId());
            } catch (NumberFormatException e) {
                log.warn("Пропущен товар с нечисловым id: {}", i.getProductXmlId());
                continue;
            }
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("id", xmlId);
            entry.put("q", Math.min(Math.max(0.01, i.getCartQuantity()), MAX_Q_PER_ITEM));
            payload.add(entry);
        }
        if (payload.isEmpty()) {
            throw new ApiException(
                    ErrorCode.NOTHING_TO_ORDER, HttpStatus.UNPROCESSABLE_ENTITY, "Нет товаров для корзины");
        }

        try {
            String url = mcpClient.cartLinkCreate(payload);
            if (url == null || url.isBlank()) {
                throw new ApiException(
                        ErrorCode.VKUSVILL_MCP_BAD_RESPONSE,
                        HttpStatus.BAD_GATEWAY,
                        "ВкусВилл не вернул ссылку на корзину"
                );
            }
            return url;
        } catch (McpException e) {
            log.error("cart_link_create не удался: {}", e.getMessage(), e);
            throw new ApiException(
                    ErrorCode.VKUSVILL_MCP_UNAVAILABLE,
                    HttpStatus.BAD_GATEWAY,
                    "ВкусВилл сейчас не отвечает, попробуйте позже"
            );
        }
    }

    // ------------------------------------------------------------------
    // Status & history
    // ------------------------------------------------------------------

    /** Клиент подтверждает, что оформил заказ на сайте ВкусВилл. */
    @Transactional
    public PurchaseOrder confirm(Integer orderId, Integer userId) {
        PurchaseOrder order = requireOwned(orderId, userId);
        if (STATUS_CREATED.equals(order.getStatusCode())) {
            applyStatus(order, STATUS_CONFIRMED);
        }
        return order;
    }

    @Transactional
    public PurchaseOrder setStatus(Integer orderId, String statusCode) {
        PurchaseOrder order = orders.findById(orderId)
                .orElseThrow(() -> ApiException.notFound("Заказ не найден"));
        if (order.getStatusCode().equals(statusCode)) {
            return order;
        }
        applyStatus(order, statusCode);
        return order;
    }

    private void applyStatus(PurchaseOrder order, String statusCode) {
        OrderStatus status = statuses.findByCode(statusCode)
                .orElseThrow(() -> ApiException.badRequest("Неизвестный статус заказа: " + statusCode));
        order.setStatusCode(status.getCode());
        order.setUpdatedAt(Instant.now());
        orders.save(order);
        notifications.push(order.getUser(), order.getId(),
                "Заказ №" + order.getId() + ": " + status.getTitle(),
                status.getDescription());
    }

    @Transactional(readOnly = true)
    public List<PurchaseOrder> history(Integer userId) {
        return orders.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional(readOnly = true)
    public List<PurchaseOrder> all() {
        return orders.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public PurchaseOrder requireOwned(Integer orderId, Integer userId) {
        PurchaseOrder order = orders.findById(orderId)
                .orElseThrow(() -> ApiException.notFound("Заказ не найден"));
        if (!order.getUser().getId().equals(userId)) {
            throw ApiException.notFound("Заказ не найден");
        }
        return order;
    }

    // ------------------------------------------------------------------
    // Mapping
    // ------------------------------------------------------------------

    @Transactional(readOnly = true)
    public OrderRead toRead(PurchaseOrder o) {
        OrderStatus s = statuses.findByCode(o.getStatusCode()).orElse(null);
        User u = o.getUser();
        List<OrderItemRead> items = o.getItems().stream()
                .map(i -> new OrderItemRead(
                        i.getProductXmlId(), i.getProductName(), i.getProductUrl(), i.getPackageCount(),
                        i.getCartQuantity(), i.getSoldByWeight(), i.getPricePerPackage(), i.getTotalPrice()))
                .toList();
        return new OrderRead(
                String.valueOf(o.getId()),
                o.getMealPlan() == null ? null : String.valueOf(o.getMealPlan().getId()),
                o.getMealPlan() == null ? null : o.getMealPlan().getTitle(),
                o.getStatusCode(),
                s != null ? s.getTitle() : o.getStatusCode(),
                s != null ? s.getDescription() : null,
                s != null && Boolean.TRUE.equals(s.getIsFinal()),
                o.getCartUrl(),
                o.getItemsCount(),
                o.getTotalCost(),
                o.getRepeatedFromId() == null ? null : String.valueOf(o.getRepeatedFromId()),
                o.getCreatedAt(),
                o.getUpdatedAt(),
                String.valueOf(u.getId()),
                u.getEmail(),
                items
        );
    }
}
