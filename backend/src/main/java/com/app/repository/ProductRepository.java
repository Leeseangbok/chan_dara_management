package com.app.repository;

import jakarta.persistence.LockModeType;
import com.app.domain.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID> {
    Optional<Product> findBySku(String sku);
    boolean existsBySku(String sku);
    Optional<Product> findTopBySkuStartingWithOrderBySkuDesc(String prefix);


    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Product p where p.id = :id")
    Optional<Product> findByIdForUpdate(UUID id);

    long countByStockQuantityLessThanEqual(int quantity);

    @Query("SELECT COALESCE(SUM(p.stockQuantity * p.price), 0) FROM Product p")
    java.math.BigDecimal sumTotalInventoryValue();

    long countByStockQuantity(int quantity);
}
