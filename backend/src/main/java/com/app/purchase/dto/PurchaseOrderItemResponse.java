package com.app.purchase.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record PurchaseOrderItemResponse(
        UUID productId,
        String productName,
        Integer quantity,
        BigDecimal unitCost,
        BigDecimal deliveryCost,
        BigDecimal subtotal
) {}
