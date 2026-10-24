package com.vkusplan.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.vkusplan.dto.OrderDtos.NotificationRead;
import com.vkusplan.dto.OrderDtos.NotificationsResponse;
import com.vkusplan.dto.OrderDtos.OrderRead;
import com.vkusplan.dto.OrderDtos.OrderStatusRead;
import com.vkusplan.repository.OrderStatusRepository;
import com.vkusplan.security.CurrentUser;
import com.vkusplan.service.NotificationService;
import com.vkusplan.service.OrderService;

/** Заказ во ВкусВилл, история заказов, статусы и уведомления клиента. */
@RestController
public class OrderController {

    private final OrderService orderService;
    private final NotificationService notificationService;
    private final OrderStatusRepository statusRepository;

    public OrderController(
            OrderService orderService,
            NotificationService notificationService,
            OrderStatusRepository statusRepository
    ) {
        this.orderService = orderService;
        this.notificationService = notificationService;
        this.statusRepository = statusRepository;
    }

    /** Отправить список покупок во ВкусВилл: в ответе ссылка корзины, на которую нужно перейти. */
    @PostMapping("/api/meal-plans/{planId}/order")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public OrderRead checkout(@PathVariable Integer planId) {
        return orderService.toRead(orderService.checkout(planId, CurrentUser.id()));
    }

    @GetMapping("/api/orders")
    @Transactional(readOnly = true)
    public List<OrderRead> history() {
        return orderService.history(CurrentUser.id()).stream().map(orderService::toRead).toList();
    }

    @GetMapping("/api/orders/{id}")
    @Transactional(readOnly = true)
    public OrderRead get(@PathVariable Integer id) {
        return orderService.toRead(orderService.requireOwned(id, CurrentUser.id()));
    }

    @PostMapping("/api/orders/{id}/confirm")
    @Transactional
    public OrderRead confirm(@PathVariable Integer id) {
        return orderService.toRead(orderService.confirm(id, CurrentUser.id()));
    }

    @PostMapping("/api/orders/{id}/repeat")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public OrderRead repeat(@PathVariable Integer id) {
        return orderService.toRead(orderService.repeat(id, CurrentUser.id()));
    }

    @GetMapping("/api/order-statuses")
    public List<OrderStatusRead> statuses() {
        return statusRepository.findAllByOrderBySortOrderAsc().stream()
                .map(s -> new OrderStatusRead(
                        s.getCode(), s.getTitle(), s.getDescription(), s.getSortOrder(),
                        Boolean.TRUE.equals(s.getIsFinal())))
                .toList();
    }

    @GetMapping("/api/notifications")
    public NotificationsResponse notifications() {
        return notificationService.list(CurrentUser.id());
    }

    @PostMapping("/api/notifications/{id}/read")
    public NotificationRead markRead(@PathVariable Integer id) {
        return notificationService.markRead(CurrentUser.id(), id);
    }

    @PostMapping("/api/notifications/read-all")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markAllRead() {
        notificationService.markAllRead(CurrentUser.id());
    }
}
