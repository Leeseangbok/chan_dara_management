package com.app.service;

import com.app.domain.entity.InventoryMovement;
import com.app.domain.entity.Product;
import com.app.domain.entity.User;
import com.app.domain.enums.MovementType;
import com.app.exception.InsufficientStockException;
import com.app.repository.InventoryMovementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final InventoryMovementRepository inventoryMovementRepository;

    @Transactional(propagation = Propagation.MANDATORY)
    public InventoryMovement applyMovement(Product product, User actor, MovementType type, int quantityChanged) {
        int newQuantity = product.getStockQuantity() + quantityChanged;

        if (newQuantity < 0) {
            throw new InsufficientStockException(
                    product.getSku(),
                    -quantityChanged,
                    product.getStockQuantity()
            );
        }
        product.setStockQuantity(newQuantity);

        InventoryMovement movement = InventoryMovement.of(product, actor, type, quantityChanged);
        return inventoryMovementRepository.save(movement);
    }

    @Transactional
    public InventoryMovement restock(Product  product, User actor, int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Restock quantity must be greater than zero");
        }
        return applyMovement(product, actor, MovementType.RESTOCK, quantity);
    }

    @Transactional
    public InventoryMovement writeOff(Product product, User actor, MovementType type, int quantity) {
        if (type != MovementType.DAMAGE && type != MovementType.THIEF) {
            throw new IllegalArgumentException("Only DAMAGE or THIEF movement can be used");
        }
        if (quantity <= 0) {
            throw new IllegalArgumentException("Write off quantity must be greater than zero");
        }
        return applyMovement(product, actor, type, -quantity);
    }

    @Transactional
    public void unpack(Product childProduct, User actor, int parentQuantityToUnpack) {
        if (parentQuantityToUnpack <= 0) {
            throw new IllegalArgumentException("Unpack quantity must be greater than zero");
        }
        Product parentProduct = childProduct.getParentProduct();
        if (parentProduct == null) {
            throw new IllegalArgumentException("Product is not a child product");
        }
        Integer pieces = childProduct.getPiecesPerParent();
        if (pieces == null || pieces <= 0) {
            throw new IllegalArgumentException("Pieces per parent must be defined and greater than zero");
        }

        // 1. Deduct from parent
        applyMovement(parentProduct, actor, MovementType.UNPACK, -parentQuantityToUnpack);
        
        // 2. Add to child
        applyMovement(childProduct, actor, MovementType.UNPACK, parentQuantityToUnpack * pieces);
    }
}
