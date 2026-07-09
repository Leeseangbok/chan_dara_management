package com.app.service.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.app.domain.entity.PaymentMethod;
import com.app.domain.entity.PaymentStatus;

public record TransactionResponse (
        UUID id,
        UUID cashierId,
        BigDecimal totalAmount,
        Instant transactionDate,
        List<TransactionItemResponse> items,
        PaymentMethod paymentMethod,
        PaymentStatus paymentStatus,
        UUID customerId,
        String customerName
){}
