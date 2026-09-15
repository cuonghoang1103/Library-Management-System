package com.library.service;

import com.library.entity.AuditLog;
import com.library.entity.User;
import com.library.repository.AuditLogRepository;
import com.library.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public void log(User user, String action, String entityType, Long entityId, 
                     Object oldValue, Object newValue, String ipAddress) {
        AuditLog log = AuditLog.builder()
            .user(user)
            .action(action)
            .entityType(entityType)
            .entityId(entityId)
            .oldValue(toJson(oldValue))
            .newValue(toJson(newValue))
            .ipAddress(ipAddress)
            .build();
        auditLogRepository.save(log);
    }

    @Transactional
    public void log(Long userId, String action, String entityType, Long entityId, 
                     Object oldValue, Object newValue, String ipAddress) {
        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;
        log(user, action, entityType, entityId, oldValue, newValue, ipAddress);
    }

    // Convenience methods
    @Transactional
    public void logCreate(Long userId, String entityType, Long entityId, Object data, String ipAddress) {
        log(userId, AuditLog.Actions.CREATE, entityType, entityId, null, data, ipAddress);
    }

    @Transactional
    public void logUpdate(Long userId, String entityType, Long entityId, Object oldData, Object newData, String ipAddress) {
        log(userId, AuditLog.Actions.UPDATE, entityType, entityId, oldData, newData, ipAddress);
    }

    @Transactional
    public void logDelete(Long userId, String entityType, Long entityId, Object data, String ipAddress) {
        log(userId, AuditLog.Actions.DELETE, entityType, entityId, data, null, ipAddress);
    }

    public Page<AuditLog> getAllLogs(Pageable pageable) {
        return auditLogRepository.findAllByOrderByCreatedAtDesc(pageable);
    }

    public Page<AuditLog> getLogsByEntityType(String entityType, Pageable pageable) {
        return auditLogRepository.findByEntityTypeOrderByCreatedAtDesc(entityType, pageable);
    }

    public Page<AuditLog> getLogsByAction(String action, Pageable pageable) {
        return auditLogRepository.findByActionOrderByCreatedAtDesc(action, pageable);
    }

    public Page<AuditLog> getLogsByDateRange(LocalDateTime start, LocalDateTime end, Pageable pageable) {
        return auditLogRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(start, end, pageable);
    }

    public List<AuditLog> getRecentLogs(int limit) {
        return auditLogRepository.findTop100ByOrderByCreatedAtDesc().subList(0, Math.min(limit, 100));
    }

    private String toJson(Object obj) {
        if (obj == null) return null;
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return obj.toString();
        }
    }
}
