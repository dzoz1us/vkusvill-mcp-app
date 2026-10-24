package com.menyushka.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.menyushka.domain.OrderStatus;

@Repository
public interface OrderStatusRepository extends JpaRepository<OrderStatus, Integer> {

    Optional<OrderStatus> findByCode(String code);

    List<OrderStatus> findAllByOrderBySortOrderAsc();
}
