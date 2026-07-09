package com.app.supplier.dto;

import jakarta.validation.constraints.NotBlank;

public record SupplierRequest(
        @NotBlank(message = "Supplier name is required")
        String name,
        String contactName,
        String phone,
        String email,
        String address,
        String notes
) {}
