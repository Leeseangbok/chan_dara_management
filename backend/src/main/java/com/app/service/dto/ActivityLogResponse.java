package com.app.service.dto;

import java.time.Instant;
import java.util.UUID;

public record ActivityLogResponse(
        UUID id,
        String username,
        String action,
        String entityType,
        String entityId,
        String details,
        Instant createdAt
) {
}
