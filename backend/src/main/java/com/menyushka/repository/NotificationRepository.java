package com.menyushka.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.menyushka.domain.Notification;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Integer> {

    List<Notification> findTop50ByUserIdOrderByCreatedAtDesc(Integer userId);

    long countByUserIdAndIsReadFalse(Integer userId);

    List<Notification> findByUserIdAndIsReadFalse(Integer userId);
}
