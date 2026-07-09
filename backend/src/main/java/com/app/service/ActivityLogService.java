package com.app.service;

import com.app.domain.entity.ActivityLog;
import com.app.domain.entity.User;
import com.app.repository.ActivityLogRepository;
import com.app.service.dto.ActivityLogResponse;
import com.app.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ActivityLogService {

    private final ActivityLogRepository activityLogRepository;

    @Transactional
    public void logActivity(User user, String action, String entityType, String entityId, String details) {
        if (user == null) {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.getPrincipal() instanceof UserPrincipal principal) {
                user = principal.getUser();
            }
        }
        
        ActivityLog log = ActivityLog.builder()
                .user(user)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .details(details)
                .build();
        
        activityLogRepository.save(log);
    }

    @Transactional(readOnly = true)
    public List<ActivityLogResponse> getRecentActivityLogs() {
        return activityLogRepository.findTop200ByOrderByCreatedAtDesc()
                .stream()
                .map(log -> new ActivityLogResponse(
                        log.getId(),
                        log.getUser() != null ? log.getUser().getUsername() : "System",
                        log.getAction(),
                        log.getEntityType(),
                        log.getEntityId(),
                        log.getDetails(),
                        log.getCreatedAt()
                ))
                .toList();
    }
}
