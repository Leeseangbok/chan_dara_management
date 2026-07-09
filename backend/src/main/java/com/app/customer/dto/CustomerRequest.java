package com.app.customer.dto;

import jakarta.validation.constraints.NotBlank;

public record CustomerRequest(
                @NotBlank(message = "Name is required") String name,
                String phone,
                String address,
                String notes) {
}
