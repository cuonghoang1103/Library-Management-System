package com.library.entity;

/**
 * Possible states for a BookCopy.
 * ON_SHELF → LOANED → RETURNED → ON_SHELF (cycle continues)
 * LOST is terminal - copy is permanently unavailable.
 */
public enum CopyStatus {
    ON_SHELF,   // Available for borrowing
    LOANED,     // Currently borrowed by a member
    RETURNED,   // Recently returned, pending reshelving
    LOST        // Lost/damaged beyond repair
}
