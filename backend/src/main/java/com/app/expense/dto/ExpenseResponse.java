package com.app.expense.dto;

import com.app.domain.enums.ExpenseCategory;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record ExpenseResponse(
        UUID id,
        ExpenseCategory category,
        BigDecimal amount,
        String description,
        LocalDate expenseDate,
        Instant createdAt,
        String loggedBy
) {}
