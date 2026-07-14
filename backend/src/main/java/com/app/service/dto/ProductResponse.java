package com.app.service.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record ProductResponse(
        UUID id,
        String sku,
        String name,
        String nameKh,
        String description,
        String imageUrl,
        CategoryResponse category,
        BigDecimal price,
        BigDecimal costPrice,
        BigDecimal costPriceDollar,
        BigDecimal exchangeRate,
        BigDecimal deliveryPrice,
        int stockQuantity,
        UUID parentProductId,
        Integer piecesPerParent
) {}
