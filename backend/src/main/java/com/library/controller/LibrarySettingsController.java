package com.library.controller;

import com.library.dto.ApiResponse;
import com.library.entity.LibrarySettings;
import com.library.service.LibrarySettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class LibrarySettingsController {

    private final LibrarySettingsService settingsService;

    @GetMapping
    @PreAuthorize("hasRole('LIBRARIAN')")
    public ResponseEntity<ApiResponse<List<LibrarySettings>>> getAllSettings() {
        List<LibrarySettings> settings = settingsService.getAllSettings();
        return ResponseEntity.ok(ApiResponse.success(settings));
    }

    @GetMapping("/category/{category}")
    @PreAuthorize("hasRole('LIBRARIAN')")
    public ResponseEntity<ApiResponse<List<LibrarySettings>>> getSettingsByCategory(
            @PathVariable String category) {
        List<LibrarySettings> settings = settingsService.getSettingsByCategory(category);
        return ResponseEntity.ok(ApiResponse.success(settings));
    }

    @PutMapping("/{key}")
    @PreAuthorize("hasRole('LIBRARIAN')")
    public ResponseEntity<ApiResponse<LibrarySettings>> updateSetting(
            @PathVariable String key,
            @RequestBody Map<String, String> body) {
        String value = body.get("value");
        LibrarySettings setting = settingsService.updateSetting(key, value);
        if (setting != null) {
            return ResponseEntity.ok(ApiResponse.success("Setting updated", setting));
        }
        return ResponseEntity.badRequest().body(ApiResponse.error("Setting not found"));
    }

    @GetMapping("/public")
    public ResponseEntity<ApiResponse<Map<String, String>>> getPublicSettings() {
        // Return non-sensitive settings that can be accessed by anyone
        return ResponseEntity.ok(ApiResponse.success(Map.of(
            "defaultLoanDays", String.valueOf(settingsService.getDefaultLoanDays()),
            "maxRenewals", String.valueOf(settingsService.getMaxRenewals())
        )));
    }
}
