package com.app.service;

import com.app.domain.entity.Product;
import com.app.domain.entity.Transaction;
import com.app.domain.entity.TransactionItem;
import com.app.domain.entity.User;
import com.app.domain.enums.MovementType;
import com.app.domain.entity.Customer;
import com.app.domain.entity.PaymentMethod;
import com.app.domain.entity.PaymentStatus;
import com.app.exception.ResourceNotFoundException;
import com.app.repository.CustomerRepository;
import com.app.repository.ProductRepository;
import com.app.repository.TransactionRepository;
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
    private final InventoryService inventoryService;

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

        Transaction transaction = Transaction.createFinalized(cashier, items, Instant.now(), method, status, customer);
        Transaction saved = transactionRepository.save(transaction);

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public TransactionResponse getById(UUID id) {
        Transaction tx = transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found: " + id));
        return toResponse(tx);
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

        return new TransactionResponse(
                tx.getId(),
                tx.getUser().getId(),
                tx.getTotalAmount(),
                tx.getTransactionDate(),
                itemResponses,
                tx.getPaymentMethod(),
                tx.getPaymentStatus(),
                tx.getCustomer() != null ? tx.getCustomer().getId() : null,
                tx.getCustomer() != null ? tx.getCustomer().getName() : null
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
}