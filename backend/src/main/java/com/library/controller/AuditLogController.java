package com.library.controller;

import com.library.dto.ApiResponse;
import com.library.dto.AuditLogDTO;
import com.library.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping
    @PreAuthorize("hasRole('LIBRARIAN')")
    public ResponseEntity<ApiResponse<Page<AuditLogDTO>>> getAllLogs(
            @PageableDefault(size = 20) Pageable pageable) {
        Page<AuditLogDTO> logs = auditLogService.getAllLogs(pageable)
            .map(AuditLogDTO::fromEntity);
        return ResponseEntity.ok(ApiResponse.success(logs));
    }

    @GetMapping("/recent")
    @PreAuthorize("hasRole('LIBRARIAN')")
    public ResponseEntity<ApiResponse<List<AuditLogDTO>>> getRecentLogs(
            @RequestParam(defaultValue = "20") int limit) {
        List<AuditLogDTO> logs = auditLogService.getRecentLogs(limit).stream()
            .map(AuditLogDTO::fromEntity)
            .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(logs));
    }

    @GetMapping("/entity/{entityType}")
    @PreAuthorize("hasRole('LIBRARIAN')")
    public ResponseEntity<ApiResponse<Page<AuditLogDTO>>> getLogsByEntityType(
            @PathVariable String entityType,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<AuditLogDTO> logs = auditLogService.getLogsByEntityType(entityType, pageable)
            .map(AuditLogDTO::fromEntity);
        return ResponseEntity.ok(ApiResponse.success(logs));
    }

    @GetMapping("/action/{action}")
    @PreAuthorize("hasRole('LIBRARIAN')")
    public ResponseEntity<ApiResponse<Page<AuditLogDTO>>> getLogsByAction(
            @PathVariable String action,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<AuditLogDTO> logs = auditLogService.getLogsByAction(action, pageable)
            .map(AuditLogDTO::fromEntity);
        return ResponseEntity.ok(ApiResponse.success(logs));
    }

    @GetMapping("/date-range")
    @PreAuthorize("hasRole('LIBRARIAN')")
    public ResponseEntity<ApiResponse<Page<AuditLogDTO>>> getLogsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<AuditLogDTO> logs = auditLogService.getLogsByDateRange(start, end, pageable)
            .map(AuditLogDTO::fromEntity);
        return ResponseEntity.ok(ApiResponse.success(logs));
    }
}
