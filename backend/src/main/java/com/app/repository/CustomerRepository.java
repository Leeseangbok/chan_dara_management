package com.app.repository;

import com.app.domain.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, UUID> {
    @org.springframework.data.jpa.repository.Query("SELECT COUNT(c) FROM Customer c WHERE c.createdAt >= :startDate")
    long countNewCustomersSince(@org.springframework.data.repository.query.Param("startDate") java.time.Instant startDate);
}
