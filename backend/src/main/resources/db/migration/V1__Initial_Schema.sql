-- V1__Initial_Schema.sql
-- Library Management System Database Schema

-- Users table
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone_number VARCHAR(20),
    role VARCHAR(20) NOT NULL CHECK (role IN ('MEMBER', 'LIBRARIAN')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Books table
CREATE TABLE books (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    author VARCHAR(200) NOT NULL,
    isbn VARCHAR(20) UNIQUE,
    publisher VARCHAR(200),
    published_date DATE,
    genre VARCHAR(100),
    total_copies INTEGER NOT NULL DEFAULT 0,
    available_copies INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Full-text search index on books
CREATE INDEX idx_books_search ON books USING GIN (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(author, '') || ' ' || coalesce(description, '') || ' ' || coalesce(genre, ''))
);

-- Book copies table
CREATE TABLE book_copies (
    id BIGSERIAL PRIMARY KEY,
    book_id BIGINT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    copy_number VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ON_SHELF' CHECK (status IN ('ON_SHELF', 'LOANED', 'RETURNED', 'LOST')),
    location VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (book_id, copy_number)
);

-- Loans table
CREATE TABLE loans (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    copy_id BIGINT NOT NULL REFERENCES book_copies(id) ON DELETE RESTRICT,
    borrowed_date DATE NOT NULL,
    due_date DATE NOT NULL,
    returned_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'OVERDUE', 'RETURNED', 'CLOSED')),
    renewal_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CRITICAL: Partial unique index to prevent double-lending
-- Only creates index entries for copies that are currently LOANED
CREATE UNIQUE INDEX idx_loans_copy_active 
ON loans (copy_id) 
WHERE status IN ('ACTIVE', 'OVERDUE');

-- Index for efficient queries
CREATE INDEX idx_loans_user ON loans (user_id);
CREATE INDEX idx_loans_copy ON loans (copy_id);
CREATE INDEX idx_loans_status ON loans (status);
CREATE INDEX idx_loans_due_date ON loans (due_date);

-- Fees table
CREATE TABLE fees (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    loan_id BIGINT REFERENCES loans(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    paid BOOLEAN NOT NULL DEFAULT FALSE,
    paid_date TIMESTAMP,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fees_user ON fees (user_id);
CREATE INDEX idx_fees_paid ON fees (paid);
