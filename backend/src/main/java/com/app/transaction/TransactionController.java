package com.app.transaction;

import com.app.security.UserPrincipal;
import com.app.service.TransactionService;
import com.app.service.dto.CreateTransactionRequest;
import com.app.service.dto.TransactionResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    @PostMapping
    public ResponseEntity<TransactionResponse> create(
            @Valid @RequestBody CreateTransactionRequest request,
            @AuthenticationPrincipal UserPrincipal user) {
        TransactionResponse response = transactionService.processSale(request, user.getUser());
        return ResponseEntity.status(201).body(response);
    }

    @GetMapping
    public ResponseEntity<java.util.List<TransactionResponse>> getAllTransactions() {
        return ResponseEntity.ok(transactionService.getAllTransactions());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TransactionResponse> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(transactionService.getById(id));
    }

    @GetMapping("/analytics/unpaid")
    public ResponseEntity<com.app.service.dto.UnpaidAnalyticsResponse> getUnpaidAnalytics() {
        return ResponseEntity.ok(transactionService.getUnpaidAnalytics());
    }

    @GetMapping("/deliveries/pending")
    public ResponseEntity<java.util.List<TransactionResponse>> getPendingDeliveries() {
        return ResponseEntity.ok(transactionService.getPendingDeliveries());
    }

    @PatchMapping("/{id}/delivery-status")
    public ResponseEntity<TransactionResponse> updateDeliveryStatus(
            @PathVariable UUID id,
            @RequestBody java.util.Map<String, String> request,
            @AuthenticationPrincipal UserPrincipal user) {
        com.app.domain.entity.DeliveryStatus status = com.app.domain.entity.DeliveryStatus.valueOf(request.get("status"));
        return ResponseEntity.ok(transactionService.updateDeliveryStatus(id, status, user.getUser()));
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<java.util.List<TransactionResponse>> getByCustomer(@PathVariable UUID customerId) {
        return ResponseEntity.ok(transactionService.getTransactionsByCustomerId(customerId));
    }

    @PostMapping("/{id}/payments")
    public ResponseEntity<TransactionResponse> addPayment(
            @PathVariable UUID id,
            @Valid @RequestBody com.app.service.dto.AddPaymentRequest request,
            @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(transactionService.addPayment(id, request, user.getUser()));
    }

    @PutMapping("/{id}/items")
    public ResponseEntity<TransactionResponse> updateItems(
            @PathVariable UUID id,
            @Valid @RequestBody CreateTransactionRequest request,
            @AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(transactionService.updateItems(id, request, user.getUser()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTransaction(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal user) {
        transactionService.deleteTransaction(id, user.getUser());
        return ResponseEntity.noContent().build();
    }
}
