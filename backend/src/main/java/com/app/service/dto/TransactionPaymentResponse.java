package com.app.service.dto;

import com.app.domain.entity.PaymentMethod;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record TransactionPaymentResponse(
        UUID id,
        BigDecimal amount,
        PaymentMethod paymentMethod,
        Instant paymentDate,
        String loggedByUsername
) {}
