package com.library.dto;

import com.library.entity.AuditLog;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class AuditLogDTO {
    private Long id;
    private Long userId;
    private String userName;
    private String action;
    private String entityType;
    private Long entityId;
    private String oldValue;
    private String newValue;
    private String ipAddress;
    private LocalDateTime createdAt;

    public static AuditLogDTO fromEntity(AuditLog log) {
        return AuditLogDTO.builder()
            .id(log.getId())
            .userId(log.getUser() != null ? log.getUser().getId() : null)
            .userName(log.getUser() != null ? log.getUser().getFullName() : "System")
            .action(log.getAction())
            .entityType(log.getEntityType())
            .entityId(log.getEntityId())
            .oldValue(log.getOldValue())
            .newValue(log.getNewValue())
            .ipAddress(log.getIpAddress())
            .createdAt(log.getCreatedAt())
            .build();
    }
}
