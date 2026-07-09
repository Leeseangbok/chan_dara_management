package com.app.domain.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.app.domain.enums.MovementType;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "inventory_movements")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class InventoryMovement {

    @Id
    @GeneratedValue
    @Column(nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false, updatable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, updatable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.NAMED_ENUM)
    @Column(nullable = false, updatable = false)
    private MovementType type;

    @Column(name = "quantity_changed", nullable = false, updatable = false)
    private int quantityChanged;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createAt;

    private InventoryMovement(Product product, User user, MovementType type, int quantityChanged) {
        this.product = product;
        this.user = user;
        this.type = type;
        this.quantityChanged = quantityChanged;
    }

    public static InventoryMovement of(Product product, User user, MovementType type, int quantityChanged) {
        if (quantityChanged == 0) {
            throw new IllegalArgumentException("quantityChanged cannot be zero");
        }

        boolean isOutBound = type == MovementType.SALE
                || type == MovementType.DAMAGE
                || type == MovementType.THIEF;
        boolean isInBound = type == MovementType.RESTOCK || type == MovementType.RETURN;

        if (isOutBound && quantityChanged > 0) {
            throw new IllegalArgumentException(type + " must have a negative quantityChanged");
        }
        if (isInBound && quantityChanged < 0) {
            throw new IllegalArgumentException(type + " must have a positive quantityChanged");
        }

        return new InventoryMovement(product, user, type, quantityChanged);
    }

    @PrePersist
    void onCreate() {
        this.createAt = Instant.now();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof InventoryMovement other)) return false;
        return id != null && id.equals(other.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
