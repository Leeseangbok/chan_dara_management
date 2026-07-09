package com.app.user.dto;

import com.app.domain.enums.Role;
import java.time.Instant;
import java.util.UUID;

public record UserResponse(
        UUID id,
        String username,
        Role role,
        boolean active,
        Instant createAt
) {}
