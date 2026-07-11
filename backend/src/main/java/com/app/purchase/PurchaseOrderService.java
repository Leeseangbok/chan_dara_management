package com.app.purchase;

import com.app.domain.entity.Product;
import com.app.domain.entity.PurchaseOrder;
import com.app.domain.entity.PurchaseOrderItem;
import com.app.domain.entity.Supplier;
import com.app.domain.entity.User;
import com.app.domain.enums.PurchaseOrderStatus;
import com.app.exception.ResourceNotFoundException;
import com.app.purchase.dto.CreatePurchaseOrderRequest;
import com.app.purchase.dto.PurchaseOrderItemRequest;
import com.app.purchase.dto.PurchaseOrderItemResponse;
import com.app.purchase.dto.PurchaseOrderResponse;
import com.app.repository.ProductRepository;
import com.app.repository.PurchaseOrderRepository;
import com.app.repository.SupplierRepository;
import com.app.repository.UserRepository;
import com.app.supplier.dto.SupplierResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PurchaseOrderService {

        private final PurchaseOrderRepository purchaseOrderRepository;
        private final SupplierRepository supplierRepository;
        private final ProductRepository productRepository;
        private final UserRepository userRepository;

        @Transactional(readOnly = true)
        public List<PurchaseOrderResponse> getAllPurchaseOrders() {
                return purchaseOrderRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                                .stream()
                                .map(this::toResponse)
                                .toList();
        }

        @Transactional(readOnly = true)
        public PurchaseOrderResponse getPurchaseOrderById(UUID id) {
                return toResponse(purchaseOrderRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found")));
        }

        @Transactional
        public PurchaseOrderResponse createPurchaseOrder(CreatePurchaseOrderRequest request) {
                Supplier supplier = supplierRepository.findById(request.supplierId())
                                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found"));

                String username = SecurityContextHolder.getContext().getAuthentication().getName();
                User currentUser = userRepository.findByUsername(username).orElse(null);

                PurchaseOrder po = PurchaseOrder.builder()
                                .poNumber(generatePoNumber())
                                .supplier(supplier)
                                .status(PurchaseOrderStatus.PENDING)
                                .notes(request.notes())
                                .createdBy(currentUser)
                                .totalAmount(BigDecimal.ZERO)
                                .build();

                BigDecimal total = BigDecimal.ZERO;

                for (PurchaseOrderItemRequest itemReq : request.items()) {
                        Product product = productRepository.findById(itemReq.productId())
                                        .orElseThrow(() -> new ResourceNotFoundException(
                                                        "Product not found: " + itemReq.productId()));

                        BigDecimal deliveryCost = itemReq.deliveryCost() != null ? itemReq.deliveryCost() : BigDecimal.ZERO;
                        BigDecimal subtotal = (itemReq.unitCost().add(deliveryCost)).multiply(BigDecimal.valueOf(itemReq.quantity()));
                        total = total.add(subtotal);

                        PurchaseOrderItem item = PurchaseOrderItem.builder()
                                        .product(product)
                                        .quantity(itemReq.quantity())
                                        .unitCost(itemReq.unitCost())
                                        .deliveryCost(deliveryCost)
                                        .subtotal(subtotal)
                                        .build();
                        po.addItem(item);
                }

                po.setTotalAmount(total);

                return toResponse(purchaseOrderRepository.save(po));
        }

        @Transactional
        public PurchaseOrderResponse markAsReceived(UUID id) {
                PurchaseOrder po = purchaseOrderRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found"));

                if (po.getStatus() != PurchaseOrderStatus.PENDING) {
                        throw new IllegalStateException("Only PENDING purchase orders can be marked as RECEIVED");
                }

                po.setStatus(PurchaseOrderStatus.RECEIVED);

                // Update product inventory and cost price
                for (PurchaseOrderItem item : po.getItems()) {
                        // Lock product to prevent concurrent updates
                        Product product = productRepository.findByIdForUpdate(item.getProduct().getId())
                                        .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

                        int oldQuantity = product.getStockQuantity();
                        int newQuantity = oldQuantity + item.getQuantity();

                        BigDecimal oldCost = product.getCostPrice() == null ? BigDecimal.ZERO : product.getCostPrice();

                        // Calculate new moving average cost
                        // (oldQty * oldCost + newQty * newCost) / totalQty
                        BigDecimal totalOldValue = oldCost.multiply(BigDecimal.valueOf(oldQuantity));
                        BigDecimal totalNewValue = (item.getUnitCost().add(item.getDeliveryCost())).multiply(BigDecimal.valueOf(item.getQuantity()));

                        BigDecimal averageCost = totalOldValue.add(totalNewValue)
                                        .divide(BigDecimal.valueOf(newQuantity), 2, RoundingMode.HALF_UP);

                        product.setStockQuantity(newQuantity);
                        product.setCostPrice(averageCost);

                        // Also adjust selling price if average cost goes above selling price?
                        // In a real system you might alert the user, for now we just update the cost
                        // price.

                        productRepository.save(product);
                }

                return toResponse(purchaseOrderRepository.save(po));
        }

        @Transactional
        public PurchaseOrderResponse markAsCancelled(UUID id) {
                PurchaseOrder po = purchaseOrderRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found"));

                if (po.getStatus() != PurchaseOrderStatus.PENDING) {
                        throw new IllegalStateException("Only PENDING purchase orders can be cancelled");
                }

                po.setStatus(PurchaseOrderStatus.CANCELLED);
                return toResponse(purchaseOrderRepository.save(po));
        }

        private String generatePoNumber() {
                return "PO-" + System.currentTimeMillis();
        }

        private PurchaseOrderResponse toResponse(PurchaseOrder po) {
                Supplier supplier = po.getSupplier();
                SupplierResponse supplierResponse = new SupplierResponse(
                                supplier.getId(),
                                supplier.getName(),
                                supplier.getContactName(),
                                supplier.getPhone(),
                                supplier.getEmail(),
                                supplier.getAddress(),
                                supplier.getNotes(),
                                supplier.getCreatedAt());

                List<PurchaseOrderItemResponse> itemResponses = po.getItems().stream()
                                .map(item -> new PurchaseOrderItemResponse(
                                                item.getProduct().getId(),
                                                item.getProduct().getName(),
                                                item.getQuantity(),
                                                item.getUnitCost(),
                                                item.getDeliveryCost(),
                                                item.getSubtotal()))
                                .collect(Collectors.toList());

                return new PurchaseOrderResponse(
                                po.getId(),
                                po.getPoNumber(),
                                supplierResponse,
                                po.getStatus(),
                                po.getTotalAmount(),
                                po.getNotes(),
                                itemResponses,
                                po.getCreatedAt(),
                                po.getCreatedBy() != null ? po.getCreatedBy().getUsername() : null);
        }
}
