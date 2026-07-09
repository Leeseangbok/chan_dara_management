package com.app.purchase.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;

public record CreatePurchaseOrderRequest(
        @NotNull(message = "Supplier ID is required")
        UUID supplierId,
        
        String notes,
        
        @NotEmpty(message = "Order must have at least one item")
        @Valid
        List<PurchaseOrderItemRequest> items
) {}
