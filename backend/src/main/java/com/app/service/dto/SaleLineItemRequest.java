package com.app.service.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record SaleLineItemRequest(
        @NotNull UUID productId,
        @Min(1) int quantity,
        java.math.BigDecimal unitPrice
) {}
