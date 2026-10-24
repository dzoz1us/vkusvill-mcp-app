package com.vkusplan.controller.admin;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.vkusplan.domain.OrderStatus;
import com.vkusplan.dto.OrderDtos.OrderRead;
import com.vkusplan.dto.OrderDtos.OrderStatusRead;
import com.vkusplan.dto.OrderDtos.OrderStatusUpsert;
import com.vkusplan.dto.OrderDtos.UpdateOrderStatusRequest;
import com.vkusplan.exception.ApiException;
import com.vkusplan.repository.OrderStatusRepository;
import com.vkusplan.repository.PurchaseOrderRepository;
import com.vkusplan.service.OrderService;

import jakarta.validation.Valid;

/** Администратор: заказы клиентов и справочник статусов заказов. */
@RestController
@RequestMapping("/api/admin")
public class AdminOrderController {

    private final OrderService orderService;
    private final OrderStatusRepository statuses;
    private final PurchaseOrderRepository orders;

    public AdminOrderController(
            OrderService orderService,
            OrderStatusRepository statuses,
            PurchaseOrderRepository orders
    ) {
        this.orderService = orderService;
        this.statuses = statuses;
        this.orders = orders;
    }

    @GetMapping("/orders")
    @Transactional(readOnly = true)
    public List<OrderRead> allOrders() {
        return orderService.all().stream().map(orderService::toRead).toList();
    }

    /** Смена статуса заказа; клиент получает уведомление. */
    @PatchMapping("/orders/{id}/status")
    @Transactional
    public OrderRead setStatus(@PathVariable Integer id, @Valid @RequestBody UpdateOrderStatusRequest request) {
        return orderService.toRead(orderService.setStatus(id, request.statusCode()));
    }

    // ------------------------------------------------------------------
    // Order statuses
    // ------------------------------------------------------------------

    @PostMapping("/order-statuses")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public OrderStatusRead createStatus(@Valid @RequestBody OrderStatusUpsert request) {
        String code = request.code().trim().toUpperCase();
        if (statuses.findByCode(code).isPresent()) {
            throw ApiException.conflict("Статус с кодом " + code + " уже есть");
        }
        int sort = request.sortOrder() != null
                ? request.sortOrder()
                : statuses.findAll().stream().mapToInt(OrderStatus::getSortOrder).max().orElse(0) + 10;
        OrderStatus saved = statuses.save(OrderStatus.builder()
                .code(code)
                .title(request.title().trim())
                .description(request.description())
                .sortOrder(sort)
                .isFinal(Boolean.TRUE.equals(request.isFinal()))
                .build());
        return toRead(saved);
    }

    /** Код статуса не меняется (на него ссылаются заказы); правятся название, описание и порядок. */
    @PutMapping("/order-statuses/{code}")
    @Transactional
    public OrderStatusRead updateStatus(@PathVariable String code, @Valid @RequestBody OrderStatusUpsert request) {
        OrderStatus s = statuses.findByCode(code)
                .orElseThrow(() -> ApiException.notFound("Статус не найден"));
        s.setTitle(request.title().trim());
        s.setDescription(request.description());
        if (request.sortOrder() != null) {
            s.setSortOrder(request.sortOrder());
        }
        if (request.isFinal() != null) {
            s.setIsFinal(request.isFinal());
        }
        return toRead(statuses.save(s));
    }

    @DeleteMapping("/order-statuses/{code}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void deleteStatus(@PathVariable String code) {
        OrderStatus s = statuses.findByCode(code)
                .orElseThrow(() -> ApiException.notFound("Статус не найден"));
        if (orders.existsByStatusCode(code)) {
            throw ApiException.conflict("Статус используется в заказах — удалить нельзя");
        }
        statuses.delete(s);
    }

    private static OrderStatusRead toRead(OrderStatus s) {
        return new OrderStatusRead(
                s.getCode(), s.getTitle(), s.getDescription(), s.getSortOrder(),
                Boolean.TRUE.equals(s.getIsFinal()));
    }
}
