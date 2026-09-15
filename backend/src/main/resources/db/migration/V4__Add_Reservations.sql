-- V4__Add_Reservations.sql
-- Reservation system for library books

-- Create reservations table
CREATE TABLE reservations (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id BIGINT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'WAITING' CHECK (status IN ('WAITING', 'READY', 'FULFILLED', 'CANCELLED', 'EXPIRED')),
    reserved_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    notified_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient queries
CREATE INDEX idx_reservations_user ON reservations (user_id);
CREATE INDEX idx_reservations_book ON reservations (book_id);
CREATE INDEX idx_reservations_status ON reservations (status);
CREATE INDEX idx_reservations_expires ON reservations (expires_at) WHERE status IN ('WAITING', 'READY');

-- Unique constraint to prevent duplicate active reservations
CREATE UNIQUE INDEX idx_reservations_user_book_active
ON reservations (user_id, book_id)
WHERE status IN ('WAITING', 'READY');
