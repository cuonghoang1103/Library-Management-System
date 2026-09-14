package com.library.entity;

/**
 * Two distinct roles in the library system.
 * MEMBERS can borrow/return/renew - basic book operations.
 * LIBRARIANS manage the catalogue, copies, and override fees.
 */
public enum Role {
    MEMBER,
    LIBRARIAN
}
