package com.library.entity;

/**
 * Lifecycle of a Loan.
 * ACTIVE → RETURNED (or overdue, then returned) → CLOSED
 */
public enum LoanStatus {
    ACTIVE,     // Currently out, not yet due
    OVERDUE,    // Past due date, still out
    RETURNED,   // Returned but not yet closed
    CLOSED      // Fully settled (all fees paid, if any)
}
