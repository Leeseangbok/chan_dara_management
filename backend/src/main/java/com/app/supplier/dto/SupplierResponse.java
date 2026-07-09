package com.app.supplier.dto;

import java.time.Instant;
import java.util.UUID;

public record SupplierResponse(
        UUID id,
        String name,
        String contactName,
        String phone,
        String email,
        String address,
        String notes,
        Instant createdAt
) {}
