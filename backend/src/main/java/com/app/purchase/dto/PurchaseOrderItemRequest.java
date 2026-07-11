package com.app.purchase.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

public record PurchaseOrderItemRequest(
        @NotNull(message = "Product ID is required")
        UUID productId,
        
        @NotNull(message = "Quantity is required")
        @Min(value = 1, message = "Quantity must be at least 1")
        Integer quantity,
        
        @NotNull(message = "Unit cost is required")
        @Min(value = 0, message = "Unit cost cannot be negative")
        BigDecimal unitCost,

        @Min(value = 0, message = "Delivery cost cannot be negative")
        BigDecimal deliveryCost
) {}
