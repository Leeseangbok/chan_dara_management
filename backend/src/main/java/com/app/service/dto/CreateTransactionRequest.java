package com.app.service.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

import com.app.domain.entity.PaymentMethod;
import com.app.domain.entity.PaymentStatus;
import java.util.UUID;

public record CreateTransactionRequest (
        @NotEmpty @Valid List<SaleLineItemRequest> items,
        PaymentMethod paymentMethod,
        PaymentStatus paymentStatus,
        UUID customerId
){}
