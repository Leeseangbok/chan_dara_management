package com.app.service;

import com.app.domain.entity.Expense;
import com.app.domain.entity.Product;
import com.app.domain.entity.PurchaseOrder;
import com.app.domain.entity.Transaction;
import com.app.repository.ExpenseRepository;
import com.app.repository.ProductRepository;
import com.app.repository.PurchaseOrderRepository;
import com.app.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final TransactionRepository transactionRepository;
    private final ExpenseRepository expenseRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final ProductRepository productRepository;

    private static final ZoneId ZONE = ZoneId.of("Asia/Phnom_Penh");
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")
            .withZone(ZONE);
    private static final DateTimeFormatter LOCAL_DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    @Transactional(readOnly = true)
    public byte[] generateComprehensiveExcelReport(Instant start, Instant end, String title) throws IOException {
        LocalDate startDate = start.atZone(ZONE).toLocalDate();
        LocalDate endDate = end.atZone(ZONE).toLocalDate();

        List<Transaction> transactions = transactionRepository
                .findByTransactionDateBetweenOrderByTransactionDateDesc(start, end);
        List<Expense> expenses = expenseRepository.findByExpenseDateBetween(startDate, endDate);
        List<PurchaseOrder> purchaseOrders = purchaseOrderRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(start,
                end);
        List<Product> products = productRepository.findAll();

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            // Common Styles
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle titleStyle = createTitleStyle(workbook);
            CellStyle boldStyle = createBoldStyle(workbook);

            CellStyle currencyStyle = workbook.createCellStyle();
            currencyStyle.setDataFormat(workbook.createDataFormat().getFormat("#,##0\" ៛\""));

            CellStyle dateStyle = workbook.createCellStyle();
            dateStyle.setAlignment(HorizontalAlignment.LEFT);

            // Calculations for Summary
            double totalRevenue = transactions.stream()
                    .filter(t -> t.getPaymentStatus() == com.app.domain.entity.PaymentStatus.PAID)
                    .mapToDouble(t -> t.getTotalAmount().doubleValue())
                    .sum();

            double totalExpense = expenses.stream()
                    .mapToDouble(e -> e.getAmount().doubleValue())
                    .sum();

            double totalPurchases = purchaseOrders.stream()
                    .filter(p -> p.getStatus() != com.app.domain.enums.PurchaseOrderStatus.CANCELLED)
                    .mapToDouble(p -> p.getTotalAmount().doubleValue())
                    .sum();

            double netProfit = totalRevenue - totalExpense - totalPurchases;

            double inventoryValue = products.stream()
                    .mapToDouble(p -> p.getPrice().multiply(BigDecimal.valueOf(p.getStockQuantity())).doubleValue())
                    .sum();

            // 1. Summary Sheet
            Sheet summarySheet = workbook.createSheet("Summary");
            createTitle(summarySheet, titleStyle, "Comprehensive Financial Report: " + title);

            int sRow = 2;
            createSummaryRow(summarySheet, sRow++, "Total Revenue (Paid):", totalRevenue, boldStyle, currencyStyle);
            createSummaryRow(summarySheet, sRow++, "Total Expenses:", totalExpense, boldStyle, currencyStyle);
            createSummaryRow(summarySheet, sRow++, "Total Purchases:", totalPurchases, boldStyle, currencyStyle);
            sRow++;
            createSummaryRow(summarySheet, sRow++, "Net Profit:", netProfit, boldStyle, currencyStyle);
            sRow++;
            createSummaryRow(summarySheet, sRow++, "Total Inventory Value:", inventoryValue, boldStyle, currencyStyle);

            summarySheet.autoSizeColumn(0);
            summarySheet.autoSizeColumn(1);

            // 2. Transactions Sheet
            Sheet txSheet = workbook.createSheet("Transactions");
            createTitle(txSheet, titleStyle, "Sales Transactions");
            String[] txHeaders = { "ID", "Date", "Customer", "Items", "Method", "Status", "Total Amount" };
            createHeaders(txSheet, txHeaders, headerStyle);

            int rowIdx = 3;
            for (Transaction tx : transactions) {
                Row row = txSheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(tx.getId().toString());
                row.createCell(1).setCellValue(DATE_FORMATTER.format(tx.getTransactionDate()));
                row.createCell(2).setCellValue(tx.getCustomer() != null ? tx.getCustomer().getName() : "Walk-in");
                row.createCell(3).setCellValue(
                        tx.getItems().stream().mapToInt(com.app.domain.entity.TransactionItem::getQuantity).sum());
                row.createCell(4).setCellValue(tx.getPaymentMethod().name());
                row.createCell(5).setCellValue(tx.getPaymentStatus().name());
                Cell cell = row.createCell(6);
                cell.setCellValue(tx.getTotalAmount().doubleValue());
                cell.setCellStyle(currencyStyle);
            }
            autoSize(txSheet, txHeaders.length);

            // 3. Expenses Sheet
            Sheet expSheet = workbook.createSheet("Expenses");
            createTitle(expSheet, titleStyle, "Expenses");
            String[] expHeaders = { "ID", "Date", "Category", "Description", "Amount" };
            createHeaders(expSheet, expHeaders, headerStyle);

            rowIdx = 3;
            for (Expense exp : expenses) {
                Row row = expSheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(exp.getId().toString());
                row.createCell(1).setCellValue(LOCAL_DATE_FORMATTER.format(exp.getExpenseDate()));
                row.createCell(2).setCellValue(exp.getCategory() != null ? exp.getCategory().name() : "");
                row.createCell(3).setCellValue(exp.getDescription());
                Cell cell = row.createCell(4);
                cell.setCellValue(exp.getAmount().doubleValue());
                cell.setCellStyle(currencyStyle);
            }
            autoSize(expSheet, expHeaders.length);

            // 4. Purchases Sheet
            Sheet poSheet = workbook.createSheet("Purchases");
            createTitle(poSheet, titleStyle, "Purchase Orders");
            String[] poHeaders = { "PO Number", "Date", "Supplier", "Status", "Total Amount" };
            createHeaders(poSheet, poHeaders, headerStyle);

            rowIdx = 3;
            for (PurchaseOrder po : purchaseOrders) {
                Row row = poSheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(po.getPoNumber());
                row.createCell(1).setCellValue(DATE_FORMATTER.format(po.getCreatedAt()));
                row.createCell(2).setCellValue(po.getSupplier().getName());
                row.createCell(3).setCellValue(po.getStatus().name());
                Cell cell = row.createCell(4);
                cell.setCellValue(po.getTotalAmount().doubleValue());
                cell.setCellStyle(currencyStyle);
            }
            autoSize(poSheet, poHeaders.length);

            // 5. Inventory Sheet
            Sheet invSheet = workbook.createSheet("Inventory Status");
            createTitle(invSheet, titleStyle, "Current Inventory Status");
            String[] invHeaders = { "SKU", "Name", "Category", "Cost Price", "Selling Price", "Stock Qty",
                    "Total Value" };
            createHeaders(invSheet, invHeaders, headerStyle);

            rowIdx = 3;
            for (Product p : products) {
                Row row = invSheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(p.getSku());
                row.createCell(1).setCellValue(p.getName());
                row.createCell(2).setCellValue(p.getCategory() != null ? p.getCategory().getName() : "");

                Cell costCell = row.createCell(3);
                costCell.setCellValue(p.getCostPrice() != null ? p.getCostPrice().doubleValue() : 0);
                costCell.setCellStyle(currencyStyle);

                Cell priceCell = row.createCell(4);
                priceCell.setCellValue(p.getPrice() != null ? p.getPrice().doubleValue() : 0);
                priceCell.setCellStyle(currencyStyle);

                row.createCell(5).setCellValue(p.getStockQuantity());

                Cell valueCell = row.createCell(6);
                double val = (p.getPrice() != null ? p.getPrice().doubleValue() : 0) * p.getStockQuantity();
                valueCell.setCellValue(val);
                valueCell.setCellStyle(currencyStyle);
            }
            autoSize(invSheet, invHeaders.length);

            workbook.write(out);
            return out.toByteArray();
        }
    }

    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.CENTER);
        return style;
    }

    private CellStyle createTitleStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 14);
        style.setFont(font);
        return style;
    }

    private CellStyle createBoldStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        style.setFont(font);
        return style;
    }

    private void createTitle(Sheet sheet, CellStyle style, String text) {
        Row row = sheet.createRow(0);
        Cell cell = row.createCell(0);
        cell.setCellValue(text);
        cell.setCellStyle(style);
    }

    private void createHeaders(Sheet sheet, String[] headers, CellStyle style) {
        Row row = sheet.createRow(2);
        for (int i = 0; i < headers.length; i++) {
            Cell cell = row.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(style);
        }
    }

    private void createSummaryRow(Sheet sheet, int rowIdx, String label, double value, CellStyle labelStyle,
            CellStyle valueStyle) {
        Row row = sheet.createRow(rowIdx);
        Cell labelCell = row.createCell(0);
        labelCell.setCellValue(label);
        labelCell.setCellStyle(labelStyle);

        Cell valCell = row.createCell(1);
        valCell.setCellValue(value);
        valCell.setCellStyle(valueStyle);
    }

    private void autoSize(Sheet sheet, int cols) {
        for (int i = 0; i < cols; i++) {
            sheet.autoSizeColumn(i);
        }
    }
}
