package com.app.repository;

import com.app.domain.entity.Transaction;
import com.app.domain.entity.PaymentStatus;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface TransactionRepository extends CrudRepository<Transaction, UUID> {

    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.paymentStatus = :status")
    long countByPaymentStatus(PaymentStatus status);

    @Query("SELECT COALESCE(SUM(t.totalAmount - COALESCE(t.paidAmount, 0)), 0) FROM Transaction t WHERE t.paymentStatus = :status")
    BigDecimal sumTotalAmountByPaymentStatus(PaymentStatus status);

    @Query("SELECT COALESCE(SUM(i.quantity), 0) FROM Transaction t JOIN t.items i WHERE t.paymentStatus = :status")
    long sumProductQuantityByPaymentStatus(PaymentStatus status);

    List<Transaction> findByDeliveryStatusInOrderByTransactionDateAsc(List<com.app.domain.entity.DeliveryStatus> statuses);

    List<Transaction> findByCustomerIdOrderByTransactionDateDesc(UUID customerId);

    List<Transaction> findByTransactionDateBetweenOrderByTransactionDateDesc(java.time.Instant startOfDay, java.time.Instant endOfDay);

    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.transactionDate >= :startOfDay AND t.transactionDate <= :endOfDay")
    long countTransactionsByDateRange(java.time.Instant startOfDay, java.time.Instant endOfDay);

    @Query("SELECT COALESCE(SUM(t.totalAmount), 0) FROM Transaction t WHERE t.transactionDate >= :startOfDay AND t.transactionDate <= :endOfDay AND t.paymentStatus = 'PAID'")
    BigDecimal sumPaidSalesByDateRange(java.time.Instant startOfDay, java.time.Instant endOfDay);

    @Query("SELECT t FROM Transaction t ORDER BY t.transactionDate DESC LIMIT 5")
    List<Transaction> findTop5ByOrderByTransactionDateDesc();

    List<Transaction> findAllByOrderByTransactionDateDesc();
}
