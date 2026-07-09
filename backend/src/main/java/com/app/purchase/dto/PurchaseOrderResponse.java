package com.app.purchase.dto;

import com.app.domain.enums.PurchaseOrderStatus;
import com.app.supplier.dto.SupplierResponse;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record PurchaseOrderResponse(
        UUID id,
        String poNumber,
        SupplierResponse supplier,
        PurchaseOrderStatus status,
        BigDecimal totalAmount,
        String notes,
        List<PurchaseOrderItemResponse> items,
        Instant createdAt,
        String createdBy
) {}
