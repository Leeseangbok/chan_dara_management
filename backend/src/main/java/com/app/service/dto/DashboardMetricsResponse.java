package com.app.service.dto;

import java.math.BigDecimal;
import java.util.List;

public record DashboardMetricsResponse(
        // Revenue
        BigDecimal todayRevenue,
        BigDecimal thisMonthRevenue,
        BigDecimal thisYearRevenue,

        // Expense (Operational expenses from Expense entity)
        BigDecimal todayExpense,
        BigDecimal thisMonthExpense,
        BigDecimal thisYearExpense,

        // Purchases (Cost of Goods from PurchaseOrder entity)
        BigDecimal todayPurchases,
        BigDecimal thisMonthPurchases,
        BigDecimal thisYearPurchases,

        // Profit (Revenue - Expense - Purchases)
        BigDecimal todayProfit,
        BigDecimal thisMonthProfit,
        BigDecimal thisYearProfit,

        // Inventory Metrics
        long totalProducts,
        long lowStockProductsCount,
        long outOfStockProductsCount,
        BigDecimal totalInventoryValue,

        // Customer Metrics
        long totalCustomers,
        long newCustomersThisMonth,

        // Supplier Metrics
        long totalSuppliers,

        // Transaction Metrics
        long todayTransactionsCount,
        long thisMonthTransactionsCount,
        long thisYearTransactionsCount,

        // Outstanding
        BigDecimal totalUnpaidSales,
        BigDecimal totalUnpaidPurchases,

        List<TransactionResponse> recentTransactions
) {}
