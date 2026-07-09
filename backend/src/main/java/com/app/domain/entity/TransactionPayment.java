package com.app.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "transaction_payments")
@Getter
@Setter
public class TransactionPayment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transaction_id", nullable = false)
    private Transaction transaction;

    @Column(nullable = false)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false)
    private PaymentMethod paymentMethod;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "logged_by")
    private User loggedBy;

    @Column(name = "payment_date", nullable = false, updatable = false)
    private Instant paymentDate = Instant.now();
    
    protected TransactionPayment() {}

    public static TransactionPayment of(Transaction transaction, BigDecimal amount, PaymentMethod paymentMethod, User loggedBy) {
        TransactionPayment p = new TransactionPayment();
        p.setTransaction(transaction);
        p.setAmount(amount);
        p.setPaymentMethod(paymentMethod);
        p.setLoggedBy(loggedBy);
        return p;
    }
}
