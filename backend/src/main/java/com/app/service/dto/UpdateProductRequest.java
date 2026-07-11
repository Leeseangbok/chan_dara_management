package com.app.service.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.UUID;

public record UpdateProductRequest(
        @NotBlank(message = "Name is required")
        @Size(max = 255, message = "Name must be at most 255 characters")
        String name,

        @Size(max = 255)
        String nameKh,

        String description,

        UUID categoryId,

        @NotNull(message = "Price is required")
        @DecimalMin(value = "0.00", message = "Price must be >= 0")
        BigDecimal price,

        @NotNull(message = "Cost price is required")
        @DecimalMin(value = "0.00", message = "Cost price must be >= 0")
        BigDecimal costPrice,

        BigDecimal costPriceDollar,
        BigDecimal exchangeRate,
        BigDecimal deliveryPrice,

        @Min(value = 0, message = "Stock quantity must be >= 0")
        int stockQuantity
) {}
