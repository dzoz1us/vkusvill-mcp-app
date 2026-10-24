package com.vkusplan.service;

import java.time.Instant;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vkusplan.domain.Notification;
import com.vkusplan.domain.User;
import com.vkusplan.dto.OrderDtos.NotificationRead;
import com.vkusplan.dto.OrderDtos.NotificationsResponse;
import com.vkusplan.exception.ApiException;
import com.vkusplan.repository.NotificationRepository;

/** Уведомления клиента: изменения статуса заказа и другие события. */
@Service
public class NotificationService {

    private final NotificationRepository notifications;

    public NotificationService(NotificationRepository notifications) {
        this.notifications = notifications;
    }

    @Transactional
    public void push(User user, Integer orderId, String title, String body) {
        notifications.save(Notification.builder()
                .user(user)
                .orderId(orderId)
                .title(title)
                .body(body)
                .isRead(false)
                .createdAt(Instant.now())
                .build());
    }

    @Transactional(readOnly = true)
    public NotificationsResponse list(Integer userId) {
        List<NotificationRead> items = notifications.findTop50ByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(NotificationService::toRead)
                .toList();
        return new NotificationsResponse(items, notifications.countByUserIdAndIsReadFalse(userId));
    }

    @Transactional
    public NotificationRead markRead(Integer userId, Integer id) {
        Notification n = notifications.findById(id)
                .filter(x -> x.getUser().getId().equals(userId))
                .orElseThrow(() -> ApiException.notFound("Уведомление не найдено"));
        n.setIsRead(true);
        return toRead(notifications.save(n));
    }

    @Transactional
    public void markAllRead(Integer userId) {
        List<Notification> unread = notifications.findByUserIdAndIsReadFalse(userId);
        unread.forEach(n -> n.setIsRead(true));
        notifications.saveAll(unread);
    }

    private static NotificationRead toRead(Notification n) {
        return new NotificationRead(
                String.valueOf(n.getId()),
                n.getOrderId() == null ? null : String.valueOf(n.getOrderId()),
                n.getTitle(),
                n.getBody(),
                Boolean.TRUE.equals(n.getIsRead()),
                n.getCreatedAt()
        );
    }
}
