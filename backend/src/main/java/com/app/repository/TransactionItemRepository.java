package com.app.repository;

import com.app.domain.entity.TransactionItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TransactionItemRepository extends JpaRepository<TransactionItem, UUID> {
    List<TransactionItem> findByProductId(UUID productId);
}
