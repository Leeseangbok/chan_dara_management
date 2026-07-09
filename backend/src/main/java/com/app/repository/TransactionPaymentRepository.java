package com.app.repository;

import com.app.domain.entity.TransactionPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TransactionPaymentRepository extends JpaRepository<TransactionPayment, UUID> {
    List<TransactionPayment> findByTransactionIdOrderByPaymentDateDesc(UUID transactionId);
}
