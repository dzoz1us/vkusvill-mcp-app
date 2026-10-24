package com.menyushka.repository;

import java.time.Instant;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.menyushka.domain.MCPProductCache;

@Repository
public interface MCPProductCacheRepository extends JpaRepository<MCPProductCache, Integer> {

    Optional<MCPProductCache> findFirstByQueryOrderByCreatedAtDesc(String query);

    long deleteByExpiresAtBefore(Instant threshold);
}