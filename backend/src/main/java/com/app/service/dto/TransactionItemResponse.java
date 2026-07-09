package com.app.service.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record TransactionItemResponse (
        UUID productId,
        String productName,
        int quantity,
        BigDecimal unitPrice,
        BigDecimal unitCost,
        BigDecimal subtotal,
        BigDecimal profit
){}
