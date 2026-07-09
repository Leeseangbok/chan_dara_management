package com.app.service.dto;

import com.app.domain.entity.PaymentMethod;
import java.math.BigDecimal;

public record AddPaymentRequest(
    BigDecimal amount,
    PaymentMethod paymentMethod
) {}
