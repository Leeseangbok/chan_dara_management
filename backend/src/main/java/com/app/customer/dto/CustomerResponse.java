package com.app.customer.dto;

import java.time.Instant;
import java.util.UUID;

public record CustomerResponse(
        UUID id,
        String name,
        String phone,
        String address,
        String notes,
        java.math.BigDecimal totalUnpaid,
        Instant createdAt
) {}
