package com.app.service;

import com.app.repository.CustomerRepository;
import com.app.repository.ProductRepository;
import com.app.repository.TransactionRepository;
import com.app.repository.ExpenseRepository;
import com.app.repository.PurchaseOrderRepository;
import com.app.repository.SupplierRepository;
import com.app.service.dto.DashboardMetricsResponse;
import com.app.service.dto.TransactionResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final TransactionRepository transactionRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final ExpenseRepository expenseRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final SupplierRepository supplierRepository;
    private final TransactionService transactionService;

    @Transactional(readOnly = true)
    public DashboardMetricsResponse getDashboardMetrics() {
        ZoneId zone = ZoneId.of("Asia/Phnom_Penh");
        ZonedDateTime now = ZonedDateTime.now(zone);
        LocalDate todayDate = now.toLocalDate();

        // Daily
        Instant startOfDay = now.truncatedTo(ChronoUnit.DAYS).toInstant();
        Instant endOfDay = startOfDay.plus(1, ChronoUnit.DAYS).minusNanos(1);

        // Monthly
        ZonedDateTime startOfMonthZdt = now.with(TemporalAdjusters.firstDayOfMonth()).truncatedTo(ChronoUnit.DAYS);
        Instant startOfMonth = startOfMonthZdt.toInstant();
        Instant endOfMonth = startOfMonthZdt.plusMonths(1).minusNanos(1).toInstant();
        LocalDate startOfMonthDate = startOfMonthZdt.toLocalDate();
        LocalDate endOfMonthDate = startOfMonthZdt.plusMonths(1).minusDays(1).toLocalDate();

        // Yearly
        ZonedDateTime startOfYearZdt = now.with(TemporalAdjusters.firstDayOfYear()).truncatedTo(ChronoUnit.DAYS);
        Instant startOfYear = startOfYearZdt.toInstant();
        Instant endOfYear = startOfYearZdt.plusYears(1).minusNanos(1).toInstant();
        LocalDate startOfYearDate = startOfYearZdt.toLocalDate();
        LocalDate endOfYearDate = startOfYearZdt.plusYears(1).minusDays(1).toLocalDate();

        // Revenue
        BigDecimal todayRevenue = transactionRepository.sumPaidSalesByDateRange(startOfDay, endOfDay);
        BigDecimal thisMonthRevenue = transactionRepository.sumPaidSalesByDateRange(startOfMonth, endOfMonth);
        BigDecimal thisYearRevenue = transactionRepository.sumPaidSalesByDateRange(startOfYear, endOfYear);

        // Expense
        BigDecimal todayExpense = expenseRepository.sumAmountByDateRange(todayDate, todayDate);
        BigDecimal thisMonthExpense = expenseRepository.sumAmountByDateRange(startOfMonthDate, endOfMonthDate);
        BigDecimal thisYearExpense = expenseRepository.sumAmountByDateRange(startOfYearDate, endOfYearDate);

        // Purchases
        BigDecimal todayPurchases = purchaseOrderRepository.sumAmountByDateRange(startOfDay, endOfDay);
        BigDecimal thisMonthPurchases = purchaseOrderRepository.sumAmountByDateRange(startOfMonth, endOfMonth);
        BigDecimal thisYearPurchases = purchaseOrderRepository.sumAmountByDateRange(startOfYear, endOfYear);

        // Profit
        BigDecimal todayProfit = todayRevenue.subtract(todayExpense).subtract(todayPurchases);
        BigDecimal thisMonthProfit = thisMonthRevenue.subtract(thisMonthExpense).subtract(thisMonthPurchases);
        BigDecimal thisYearProfit = thisYearRevenue.subtract(thisYearExpense).subtract(thisYearPurchases);

        // Inventory
        long totalProducts = productRepository.count();
        long lowStock = productRepository.countByStockQuantityLessThanEqual(5);
        long outOfStock = productRepository.countByStockQuantity(0);
        BigDecimal inventoryValue = productRepository.sumTotalInventoryValue();

        // Customers & Suppliers
        long totalCustomers = customerRepository.count();
        long newCustomersThisMonth = customerRepository.countNewCustomersSince(startOfMonth);
        long totalSuppliers = supplierRepository.count();

        // Transactions Count
        long todayTxCount = transactionRepository.countTransactionsByDateRange(startOfDay, endOfDay);
        long thisMonthTxCount = transactionRepository.countTransactionsByDateRange(startOfMonth, endOfMonth);
        long thisYearTxCount = transactionRepository.countTransactionsByDateRange(startOfYear, endOfYear);

        // Outstanding
        BigDecimal totalUnpaidSales = transactionRepository.sumTotalAmountByPaymentStatus(com.app.domain.entity.PaymentStatus.UNPAID);
        BigDecimal totalUnpaidPurchases = purchaseOrderRepository.sumUnpaidPurchases();

        List<TransactionResponse> recent = transactionRepository.findTop5ByOrderByTransactionDateDesc()
                .stream()
                .map(transactionService::toResponse)
                .toList();

        return new DashboardMetricsResponse(
                todayRevenue, thisMonthRevenue, thisYearRevenue,
                todayExpense, thisMonthExpense, thisYearExpense,
                todayPurchases, thisMonthPurchases, thisYearPurchases,
                todayProfit, thisMonthProfit, thisYearProfit,
                totalProducts, lowStock, outOfStock, inventoryValue,
                totalCustomers, newCustomersThisMonth, totalSuppliers,
                todayTxCount, thisMonthTxCount, thisYearTxCount,
                totalUnpaidSales, totalUnpaidPurchases,
                recent
        );
    }
}
