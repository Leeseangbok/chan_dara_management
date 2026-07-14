package com.app.service;

import com.app.domain.entity.Product;
import com.app.domain.entity.Transaction;
import com.app.domain.entity.TransactionItem;
import com.app.domain.entity.User;
import com.app.domain.enums.MovementType;
import com.app.domain.entity.Customer;
import com.app.domain.entity.PaymentMethod;
import com.app.domain.entity.PaymentStatus;
import com.app.domain.entity.DeliveryStatus;
import com.app.exception.ResourceNotFoundException;
import com.app.repository.CustomerRepository;
import com.app.repository.ProductRepository;
import com.app.repository.TransactionRepository;
import com.app.repository.TransactionPaymentRepository;
import com.app.service.dto.AddPaymentRequest;
import com.app.domain.entity.TransactionPayment;
import com.app.service.dto.CreateTransactionRequest;
import com.app.service.dto.SaleLineItemRequest;
import com.app.service.dto.TransactionItemResponse;
import com.app.service.dto.TransactionResponse;
import com.app.service.dto.UnpaidAnalyticsResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final TransactionPaymentRepository transactionPaymentRepository;
    private final InventoryService inventoryService;
    private final ActivityLogService activityLogService;

    @Transactional
    public TransactionResponse processSale(CreateTransactionRequest request, User cashier){
        List<SaleLineItemRequest> sortedLines = request.items().stream()
                .sorted(Comparator.comparing(SaleLineItemRequest::productId))
                .toList();

        List<TransactionItem> items = new ArrayList<>();

        for (SaleLineItemRequest line :  sortedLines) {
            Product product = productRepository.findByIdForUpdate(line.productId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Product not found: " + line.productId()));

            java.math.BigDecimal finalPrice = line.unitPrice() != null ? line.unitPrice() : product.getPrice();

            TransactionItem item = TransactionItem.of(
                    product,
                    line.quantity(),
                    finalPrice,
                    product.getCostPrice()
            );
            items.add(item);

            inventoryService.applyMovement(product, cashier, MovementType.SALE, -line.quantity());
        }

        Customer customer = null;
        if (request.customerId() != null) {
            customer = customerRepository.findById(request.customerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Customer not found: " + request.customerId()));
        }

        PaymentMethod method = request.paymentMethod() != null ? request.paymentMethod() : PaymentMethod.CASH;
        PaymentStatus status = request.paymentStatus() != null ? request.paymentStatus() : PaymentStatus.PAID;
        DeliveryStatus deliveryStatus = request.deliveryStatus() != null ? request.deliveryStatus() : DeliveryStatus.NONE;
        
        String deliveryLoc = request.deliveryLocation();

        if (customer != null && deliveryStatus != DeliveryStatus.NONE && deliveryLoc != null && !deliveryLoc.isBlank()) {
            if (customer.getAddress() == null || customer.getAddress().isBlank()) {
                customer.setAddress(deliveryLoc);
                customerRepository.save(customer);
            }
        }

        java.time.Instant txDate = request.transactionDate() != null ? request.transactionDate() : Instant.now();
        Transaction transaction = Transaction.createFinalized(cashier, items, txDate, method, status, customer, deliveryStatus, deliveryLoc);
        Transaction saved = transactionRepository.save(transaction);
        
        activityLogService.logActivity(cashier, "CREATE", "TRANSACTION", saved.getId().toString(), "Created sale of " + formatCurrency(saved.getTotalAmount()) + (deliveryStatus != DeliveryStatus.NONE ? " (Delivery)" : ""));

        return toResponse(saved);
    }
    
    private String formatCurrency(java.math.BigDecimal amount) {
        if (amount == null) return "$0.00";
        return "$" + String.format("%.2f", amount);
    }

    @Transactional(readOnly = true)
    public TransactionResponse getById(UUID id) {
        Transaction tx = transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found: " + id));
        return toResponse(tx);
    }

    @Transactional
    public TransactionResponse addPayment(UUID transactionId, AddPaymentRequest request, User cashier) {
        Transaction tx = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found: " + transactionId));

        TransactionPayment payment = TransactionPayment.of(tx, request.amount(), request.paymentMethod(), cashier);
        transactionPaymentRepository.save(payment);

        java.math.BigDecimal newPaidAmount = tx.getPaidAmount().add(request.amount());
        tx.setPaidAmount(newPaidAmount);

        if (newPaidAmount.compareTo(tx.getTotalAmount()) >= 0) {
            tx.setPaymentStatus(PaymentStatus.PAID);
        }

        transactionRepository.save(tx);
        
        activityLogService.logActivity(cashier, "UPDATE", "TRANSACTION_PAYMENT", tx.getId().toString(), "Added payment of " + formatCurrency(request.amount()) + " via " + request.paymentMethod());
        
        return toResponse(tx);
    }

    @Transactional
    public TransactionResponse updateItems(UUID id, CreateTransactionRequest request, User cashier) {
        Transaction tx = transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found: " + id));

        // Revert old inventory
        for (TransactionItem oldItem : tx.getItems()) {
            inventoryService.applyMovement(oldItem.getProduct(), cashier, MovementType.RETURN, oldItem.getQuantity());
        }

        // Clear existing items
        tx.getItems().clear();

        List<SaleLineItemRequest> sortedLines = request.items().stream()
                .sorted(Comparator.comparing(SaleLineItemRequest::productId))
                .toList();

        java.math.BigDecimal newTotal = java.math.BigDecimal.ZERO;

        for (SaleLineItemRequest line : sortedLines) {
            Product product = productRepository.findByIdForUpdate(line.productId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + line.productId()));

            java.math.BigDecimal finalPrice = line.unitPrice() != null ? line.unitPrice() : product.getPrice();

            TransactionItem item = TransactionItem.of(product, line.quantity(), finalPrice, product.getCostPrice());
            item.attachTo(tx);
            tx.getItems().add(item);
            newTotal = newTotal.add(item.getSubtotal());

            inventoryService.applyMovement(product, cashier, MovementType.SALE, -line.quantity());
        }

        tx.setTotalAmount(newTotal);
        if (tx.getPaidAmount().compareTo(newTotal) >= 0) {
            tx.setPaymentStatus(PaymentStatus.PAID);
        } else {
            tx.setPaymentStatus(PaymentStatus.UNPAID);
        }

        transactionRepository.save(tx);
        
        activityLogService.logActivity(cashier, "UPDATE", "TRANSACTION", tx.getId().toString(), "Updated items, new total " + formatCurrency(tx.getTotalAmount()));
        
        return toResponse(tx);
    }

    @Transactional
    public void deleteTransaction(UUID id, User cashier) {
        Transaction tx = transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found: " + id));

        for (TransactionItem item : tx.getItems()) {
            inventoryService.applyMovement(item.getProduct(), cashier, MovementType.RETURN, item.getQuantity());
        }

        transactionRepository.delete(tx);
        
        activityLogService.logActivity(cashier, "DELETE", "TRANSACTION", id.toString(), "Deleted transaction " + formatCurrency(tx.getTotalAmount()));
    }

    @Transactional(readOnly = true)
    public UnpaidAnalyticsResponse getUnpaidAnalytics() {
        long count = transactionRepository.countByPaymentStatus(PaymentStatus.UNPAID);
        java.math.BigDecimal totalAmount = transactionRepository.sumTotalAmountByPaymentStatus(PaymentStatus.UNPAID);
        long productsCount = transactionRepository.sumProductQuantityByPaymentStatus(PaymentStatus.UNPAID);
        return new UnpaidAnalyticsResponse(count, productsCount, totalAmount);
    }

    public TransactionResponse toResponse(Transaction tx) {
        List<TransactionItemResponse> itemResponses = tx.getItems().stream()
                .map(i -> new TransactionItemResponse(
                        i.getProduct().getId(),
                        i.getProduct().getName(),
                        i.getQuantity(),
                        i.getUnitPrice(),
                        i.getUnitCost(),
                        i.getSubtotal(),
                        i.getProfit()
                ))
                .toList();

        List<com.app.service.dto.TransactionPaymentResponse> payments = transactionPaymentRepository
                .findByTransactionIdOrderByPaymentDateDesc(tx.getId())
                .stream()
                .map(p -> new com.app.service.dto.TransactionPaymentResponse(
                        p.getId(),
                        p.getAmount(),
                        p.getPaymentMethod(),
                        p.getPaymentDate(),
                        p.getLoggedBy() != null ? p.getLoggedBy().getUsername() : null
                ))
                .toList();

        return new TransactionResponse(
                tx.getId(),
                tx.getUser().getId(),
                tx.getTotalAmount(),
                tx.getPaidAmount(),
                tx.getTransactionDate(),
                itemResponses,
                tx.getPaymentMethod(),
                tx.getPaymentStatus(),
                tx.getCustomer() != null ? tx.getCustomer().getId() : null,
                tx.getCustomer() != null ? tx.getCustomer().getName() : null,
                tx.getCustomer() != null ? tx.getCustomer().getAddress() : null,
                tx.getDeliveryStatus(),
                tx.getDeliveryLocation(),
                payments
        );
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> getTransactionsByCustomerId(UUID customerId) {
        return transactionRepository.findByCustomerIdOrderByTransactionDateDesc(customerId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> getAllTransactions() {
        return transactionRepository.findAllByOrderByTransactionDateDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> getPendingDeliveries() {
        return transactionRepository.findByDeliveryStatusInOrderByTransactionDateAsc(
                List.of(DeliveryStatus.PENDING, DeliveryStatus.PREPARING, DeliveryStatus.READY, DeliveryStatus.IN_TRANSIT)
        ).stream().map(this::toResponse).toList();
    }

    @Transactional
    public TransactionResponse updateDeliveryStatus(UUID id, DeliveryStatus status, User cashier) {
        Transaction tx = transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found: " + id));

        tx.setDeliveryStatus(status);
        transactionRepository.save(tx);

        activityLogService.logActivity(cashier, "UPDATE", "DELIVERY_STATUS", tx.getId().toString(), "Updated delivery status to " + status.name());

        return toResponse(tx);
    }
}