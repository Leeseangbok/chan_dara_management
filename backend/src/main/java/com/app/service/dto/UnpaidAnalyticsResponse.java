package com.app.service.dto;

import java.math.BigDecimal;

public record UnpaidAnalyticsResponse(
    long unpaidTransactionsCount,
    long unpaidProductsCount,
    BigDecimal totalUnpaidAmount
) {}
