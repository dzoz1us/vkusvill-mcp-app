package com.menyushka.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.menyushka.domain.PurchaseOrder;

@Repository
public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Integer> {

    List<PurchaseOrder> findByUserIdOrderByCreatedAtDesc(Integer userId);

    List<PurchaseOrder> findAllByOrderByCreatedAtDesc();

    boolean existsByStatusCode(String statusCode);
}
