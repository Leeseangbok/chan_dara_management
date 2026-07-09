package com.app.domain.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "transactions")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Transaction {

    @Id
    @GeneratedValue
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, updatable = false)
    private User user;

    @Column(name = "total_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "paid_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal paidAmount = BigDecimal.ZERO;

    @Column(name = "transaction_date", nullable = false, updatable = false)
    private Instant transactionDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method")
    private PaymentMethod paymentMethod = PaymentMethod.CASH;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status")
    private PaymentStatus paymentStatus = PaymentStatus.PAID;

    @Enumerated(EnumType.STRING)
    @Column(name = "delivery_status", nullable = false)
    private DeliveryStatus deliveryStatus = DeliveryStatus.NONE;

    @Column(name = "delivery_location", columnDefinition = "TEXT")
    private String deliveryLocation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @OneToMany(mappedBy = "transaction", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TransactionItem> items = new ArrayList<>();

    private Transaction(User user, BigDecimal totalAmount, BigDecimal paidAmount, Instant transactionDate, PaymentMethod method, PaymentStatus status, Customer customer, DeliveryStatus deliveryStatus, String deliveryLocation) {
        this.user = user;
        this.totalAmount = totalAmount;
        this.paidAmount = paidAmount;
        this.transactionDate = transactionDate;
        this.paymentMethod = method;
        this.paymentStatus = status;
        this.customer = customer;
        this.deliveryStatus = deliveryStatus != null ? deliveryStatus : DeliveryStatus.NONE;
        this.deliveryLocation = deliveryLocation;
    }

    public static Transaction createFinalized(User user, List<TransactionItem> items, Instant transactionDate, PaymentMethod method, PaymentStatus status, Customer customer, DeliveryStatus deliveryStatus, String deliveryLocation) {
        if (items == null || items.isEmpty()) {
            throw new IllegalArgumentException("A transaction must have at least one item");
        }
        BigDecimal total = items.stream()
                .map(TransactionItem::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal paid = status == PaymentStatus.PAID ? total : BigDecimal.ZERO;

        Transaction tx = new Transaction(user, total, paid, transactionDate, method, status, customer, deliveryStatus, deliveryLocation);
        for (TransactionItem item : items) {
            item.attachTo(tx);
            tx.items.add(item);
        }

        return tx;
    }

    public List<TransactionItem> getItems() {
        return Collections.unmodifiableList(items);
    }

    @PrePersist
    void onCreate() {
        if (transactionDate == null) {
            transactionDate = Instant.now();
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Transaction other)) return false;
        return id != null && id.equals(other.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
