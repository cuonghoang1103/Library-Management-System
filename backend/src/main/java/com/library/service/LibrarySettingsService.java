package com.library.service;

import com.library.entity.LibrarySettings;
import com.library.repository.LibrarySettingsRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class LibrarySettingsService {

    private final LibrarySettingsRepository settingsRepository;
    
    // Cache for performance
    private Map<String, String> settingsCache = new HashMap<>();
    
    @PostConstruct
    public void initDefaultSettings() {
        // Only initialize if no settings exist
        if (settingsRepository.count() == 0) {
            createDefaultSettings();
        }
        loadSettingsCache();
    }
    
    private void createDefaultSettings() {
        // Loan settings
        saveSetting(LibrarySettings.Keys.DEFAULT_LOAN_DAYS, "14", "Default loan duration in days", "LOAN");
        saveSetting(LibrarySettings.Keys.MAX_RENEWALS, "2", "Maximum number of renewals per loan", "LOAN");
        saveSetting(LibrarySettings.Keys.OVERDUE_FEE_PER_DAY, "1000", "Overdue fee per day (VND)", "FEE");
        saveSetting(LibrarySettings.Keys.MAX_RESERVATIONS_PER_USER, "3", "Maximum reservations per user", "RESERVATION");
        saveSetting(LibrarySettings.Keys.RESERVATION_EXPIRY_DAYS, "7", "Days before reservation expires", "RESERVATION");
        saveSetting(LibrarySettings.Keys.RESERVATION_PICKUP_DAYS, "3", "Days to pick up reserved book", "RESERVATION");
        
        // Notification settings
        saveSetting(LibrarySettings.Keys.DUE_REMINDER_DAYS, "3", "Days before due date to send reminder", "NOTIFICATION");
        saveSetting(LibrarySettings.Keys.NOTIFICATION_ENABLED, "true", "Enable notifications", "NOTIFICATION");
    }
    
    private void loadSettingsCache() {
        List<LibrarySettings> allSettings = settingsRepository.findAll();
        settingsCache.clear();
        for (LibrarySettings setting : allSettings) {
            settingsCache.put(setting.getSettingKey(), setting.getSettingValue());
        }
    }
    
    private void saveSetting(String key, String value, String description, String category) {
        LibrarySettings setting = LibrarySettings.builder()
            .settingKey(key)
            .settingValue(value)
            .description(description)
            .category(category)
            .build();
        settingsRepository.save(setting);
    }
    
    public String getSetting(String key) {
        return settingsCache.getOrDefault(key, null);
    }
    
    public int getIntSetting(String key, int defaultValue) {
        try {
            String value = getSetting(key);
            return value != null ? Integer.parseInt(value) : defaultValue;
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }
    
    public BigDecimal getDecimalSetting(String key, BigDecimal defaultValue) {
        try {
            String value = getSetting(key);
            return value != null ? new BigDecimal(value) : defaultValue;
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }
    
    public boolean getBooleanSetting(String key, boolean defaultValue) {
        String value = getSetting(key);
        return value != null ? Boolean.parseBoolean(value) : defaultValue;
    }
    
    public List<LibrarySettings> getAllSettings() {
        return settingsRepository.findAll();
    }
    
    public List<LibrarySettings> getSettingsByCategory(String category) {
        return settingsRepository.findByCategory(category);
    }
    
    @Transactional
    public LibrarySettings updateSetting(String key, String value) {
        Optional<LibrarySettings> settingOpt = settingsRepository.findBySettingKey(key);
        if (settingOpt.isPresent()) {
            LibrarySettings setting = settingOpt.get();
            setting.setSettingValue(value);
            settingsRepository.save(setting);
            settingsCache.put(key, value);
            return setting;
        }
        return null;
    }
    
    // Convenience methods for common settings
    public int getDefaultLoanDays() {
        return getIntSetting(LibrarySettings.Keys.DEFAULT_LOAN_DAYS, 14);
    }
    
    public int getMaxRenewals() {
        return getIntSetting(LibrarySettings.Keys.MAX_RENEWALS, 2);
    }
    
    public BigDecimal getOverdueFeePerDay() {
        return getDecimalSetting(LibrarySettings.Keys.OVERDUE_FEE_PER_DAY, new BigDecimal("1000"));
    }
    
    public int getMaxReservationsPerUser() {
        return getIntSetting(LibrarySettings.Keys.MAX_RESERVATIONS_PER_USER, 3);
    }
    
    public int getDueReminderDays() {
        return getIntSetting(LibrarySettings.Keys.DUE_REMINDER_DAYS, 3);
    }
}
