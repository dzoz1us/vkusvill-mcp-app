package com.menyushka.dto;

import java.time.Instant;
import java.util.List;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Заказы, статусы заказов и уведомления. */
public final class OrderDtos {

    private OrderDtos() {}

    public record OrderItemRead(
            String productXmlId,
            String productName,
            String productUrl,
            Integer packageCount,
            Double cartQuantity,
            Boolean soldByWeight,
            Double pricePerPackage,
            Double totalPrice
    ) {}

    public record OrderRead(
            String id,
            String planId,
            String planTitle,
            String statusCode,
            String statusTitle,
            String statusDescription,
            boolean statusFinal,
            String cartUrl,
            Integer itemsCount,
            Double totalCost,
            String repeatedFromId,
            Instant createdAt,
            Instant updatedAt,
            String userId,
            String userEmail,
            List<OrderItemRead> items
    ) {}

    public record OrderStatusRead(
            String code,
            String title,
            String description,
            Integer sortOrder,
            boolean isFinal
    ) {}

    public record OrderStatusUpsert(
            @NotBlank @Size(max = 50) String code,
            @NotBlank @Size(max = 100) String title,
            @Size(max = 300) String description,
            @Min(0) Integer sortOrder,
            Boolean isFinal
    ) {}

    public record UpdateOrderStatusRequest(@NotBlank String statusCode) {}

    public record NotificationRead(
            String id,
            String orderId,
            String title,
            String body,
            boolean isRead,
            Instant createdAt
    ) {}

    public record NotificationsResponse(List<NotificationRead> items, long unread) {}
}
