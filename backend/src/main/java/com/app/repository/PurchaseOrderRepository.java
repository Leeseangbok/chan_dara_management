package com.app.repository;

import com.app.domain.entity.PurchaseOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, UUID> {
    boolean existsByPoNumber(String poNumber);
    java.util.List<PurchaseOrder> findByCreatedAtBetweenOrderByCreatedAtDesc(java.time.Instant start, java.time.Instant end);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(po.totalAmount), 0) FROM PurchaseOrder po WHERE po.createdAt >= :startDate AND po.createdAt <= :endDate AND po.status != 'CANCELLED'")
    java.math.BigDecimal sumAmountByDateRange(@org.springframework.data.repository.query.Param("startDate") java.time.Instant startDate, @org.springframework.data.repository.query.Param("endDate") java.time.Instant endDate);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(po.totalAmount), 0) FROM PurchaseOrder po WHERE po.status = 'PENDING'")
    java.math.BigDecimal sumUnpaidPurchases();
}
