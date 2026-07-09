package com.app.user.dto;

import com.app.domain.enums.Role;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateUserRequest(
        @Size(min = 6, message = "Password must be at least 6 characters")
        String password,
        
        @NotNull(message = "Role is required")
        Role role,
        
        Boolean active
) {}
