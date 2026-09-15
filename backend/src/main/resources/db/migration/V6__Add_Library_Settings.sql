-- V6__Add_Library_Settings.sql
-- Configurable library settings

CREATE TABLE library_settings (
    id BIGSERIAL PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value VARCHAR(500) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_settings_key ON library_settings (setting_key);
CREATE INDEX idx_settings_category ON library_settings (category);

-- Insert default settings
INSERT INTO library_settings (setting_key, setting_value, description, category) VALUES
('default_loan_days', '14', 'Default loan duration in days', 'LOAN'),
('max_renewals', '2', 'Maximum number of renewals per loan', 'LOAN'),
('overdue_fee_per_day', '1000', 'Overdue fee per day (VND)', 'FEE'),
('max_reservations_per_user', '3', 'Maximum reservations per user', 'RESERVATION'),
('reservation_expiry_days', '7', 'Days before reservation expires', 'RESERVATION'),
('reservation_pickup_days', '3', 'Days to pick up reserved book', 'RESERVATION'),
('due_reminder_days', '3', 'Days before due date to send reminder', 'NOTIFICATION'),
('notification_enabled', 'true', 'Enable notifications', 'NOTIFICATION');
