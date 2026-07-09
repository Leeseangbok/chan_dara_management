package com.app.domain.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "transaction_items")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TransactionItem {

    @Id
    @GeneratedValue
    @Column(nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "transaction_id", nullable = false, updatable = false)
    private Transaction transaction;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false, updatable = false)
    private Product product;

    @Column(nullable = false, updatable = false)
    private int quantity;

    @Column(name = "unit_price", nullable = false, precision = 12, scale = 2, updatable = false)
    private BigDecimal unitPrice;

    @Column(name = "unit_cost", nullable = false, precision = 12, scale = 2, updatable = false)
    private BigDecimal unitCost;

    @Column(nullable = false, precision = 14, scale = 2, updatable = false)
    private BigDecimal subtotal;

    @Column(nullable = false, precision = 14, scale = 2, updatable = false)
    private BigDecimal profit;

    private TransactionItem(Product product, int quantity, BigDecimal unitPrice, BigDecimal unitCost) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("quantity must be positive");
        }
        this.product = product;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.unitCost = unitCost;
        this.subtotal = unitPrice.multiply(BigDecimal.valueOf(quantity));
        this.profit = unitPrice.subtract(unitCost).multiply(BigDecimal.valueOf(quantity));
    }

    public static TransactionItem of(Product product, int quantity, BigDecimal unitPrice, BigDecimal unitCost) {
        return new TransactionItem(product, quantity, unitPrice, unitCost);
    }

    void attachTo(Transaction transaction) {
        this.transaction = transaction;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof TransactionItem other)) return false;
        return id != null && id.equals(other.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
