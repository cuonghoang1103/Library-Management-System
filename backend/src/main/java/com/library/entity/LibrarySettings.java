package com.library.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "library_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LibrarySettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "setting_key", unique = true, nullable = false)
    private String settingKey;

    @Column(name = "setting_value", nullable = false)
    private String settingValue;

    @Column(name = "description")
    private String description;

    @Column(name = "category")
    private String category; // LOAN, FEE, NOTIFICATION, etc.

    public static class Keys {
        // Loan settings
        public static final String DEFAULT_LOAN_DAYS = "default_loan_days";
        public static final String MAX_RENEWALS = "max_renewals";
        public static final String MAX_LOANS_PER_USER = "max_loans_per_user";
        public static final String OVERDUE_FEE_PER_DAY = "overdue_fee_per_day";
        public static final String MAX_RESERVATIONS_PER_USER = "max_reservations_per_user";
        public static final String RESERVATION_EXPIRY_DAYS = "reservation_expiry_days";
        public static final String RESERVATION_PICKUP_DAYS = "reservation_pickup_days";
        
        // Notification settings
        public static final String DUE_REMINDER_DAYS = "due_reminder_days";
        public static final String NOTIFICATION_ENABLED = "notification_enabled";
    }
}
