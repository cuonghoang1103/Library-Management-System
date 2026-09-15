# TEST PLAN DOCUMENT
## Library Management System - SWT301

---

## 1. INTRODUCTION

### 1.1 Project Overview
| Field | Description |
|-------|-------------|
| **Project Name** | Library Management System |
| **Project Type** | Full-stack Web Application |
| **Technology Stack** | Spring Boot 3.2.0 (Backend), React 18 (Frontend), PostgreSQL 16 (Database) |
| **Test Scope** | Backend Unit Tests, Integration Tests, API Testing |
| **Testing Tool** | JUnit 5, Mockito, Spring Boot Test, MockMvc |
| **Documentation Date** | 2024 |

### 1.2 Objectives
- Verify all core business functionalities work as expected
- Ensure API endpoints return correct responses
- Validate authentication and authorization mechanisms
- Achieve minimum 70% code coverage

### 1.3 Testing Environment
| Component | Version |
|-----------|---------|
| Java | 17 |
| Spring Boot | 3.2.0 |
| JUnit | 5 (Jupiter) |
| Mockito | Included in spring-boot-starter-test |
| H2 Database | For testing |
| Maven | 3.9+ |

---

## 2. TESTING STRATEGY

### 2.1 Testing Levels

```
┌─────────────────────────────────────────────────────────────┐
│                    TESTING PYRAMID                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    ┌───────────┐                             │
│                    │   E2E     │                             │
│                    │  (None)   │                             │
│                    └─────┬─────┘                             │
│                          │                                   │
│              ┌───────────┴───────────┐                       │
│              │   INTEGRATION TESTS   │                       │
│              │  (API Endpoint Tests) │                       │
│              └───────────┬───────────┘                       │
│                          │                                   │
│              ┌───────────┴───────────┐                       │
│              │     UNIT TESTS        │                       │
│              │   (Service Tests)     │                       │
│              └───────────────────────┘                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Test Types

| Type | Coverage | Tool |
|------|----------|------|
| Unit Testing | Service Layer | JUnit 5 + Mockito |
| Integration Testing | REST Controllers | Spring Boot Test + MockMvc |
| Code Coverage | All Java Classes | JaCoCo |

---

## 3. TEST CASES

### 3.1 Authentication Module (AuthService, AuthController)

#### 3.1.1 Login Tests

| TC ID | Test Case | Expected Result | Priority |
|-------|-----------|-----------------|----------|
| AUTH-001 | Login with valid member credentials | Returns JWT token, role MEMBER | HIGH |
| AUTH-002 | Login with valid librarian credentials | Returns JWT token, role LIBRARIAN | HIGH |
| AUTH-003 | Login with invalid password | Returns 401 Unauthorized | HIGH |
| AUTH-004 | Login with non-existent username | Returns 401 Unauthorized | HIGH |
| AUTH-005 | Login with missing username | Returns 400 Bad Request | MEDIUM |
| AUTH-006 | Get current user with valid token | Returns user details | HIGH |
| AUTH-007 | Access protected endpoint without token | Returns 401 Unauthorized | HIGH |

#### 3.1.2 Registration Tests

| TC ID | Test Case | Expected Result | Priority |
|-------|-----------|-----------------|----------|
| AUTH-010 | Register with unique username and email | User created successfully | HIGH |
| AUTH-011 | Register with existing username | Returns 400 Bad Request | HIGH |
| AUTH-012 | Register with existing email | Returns 400 Bad Request | HIGH |
| AUTH-013 | Register with default password when not provided | Password set to "password123" | LOW |

---

### 3.2 Book Management Module (BookService, BookController)

#### 3.2.1 Book CRUD Tests

| TC ID | Test Case | Expected Result | Priority |
|-------|-----------|-----------------|----------|
| BOOK-001 | Get all books (paginated) | Returns page of books | HIGH |
| BOOK-002 | Get book by valid ID | Returns book details | HIGH |
| BOOK-003 | Get book by non-existent ID | Returns 404 Not Found | HIGH |
| BOOK-004 | Create book with valid data (librarian) | Book created successfully | HIGH |
| BOOK-005 | Create book with initial copies | Copies created with correct count | HIGH |
| BOOK-006 | Create book as member | Returns 403 Forbidden | HIGH |
| BOOK-007 | Update book with valid data (librarian) | Book updated successfully | HIGH |
| BOOK-008 | Update non-existent book | Returns 404 Not Found | HIGH |
| BOOK-009 | Delete book (librarian) | Book deleted successfully | HIGH |
| BOOK-010 | Delete non-existent book | Returns 404 Not Found | HIGH |
| BOOK-011 | Member attempts to delete book | Returns 403 Forbidden | HIGH |

#### 3.2.2 Book Search Tests

| TC ID | Test Case | Expected Result | Priority |
|-------|-----------|-----------------|----------|
| BOOK-020 | Search with empty query | Returns all books | MEDIUM |
| BOOK-021 | Search with null query | Returns all books | MEDIUM |
| BOOK-022 | Search with valid keyword | Returns matching books | HIGH |
| BOOK-023 | Search with no matching results | Returns empty page | MEDIUM |

#### 3.2.3 Copy Management Tests

| TC ID | Test Case | Expected Result | Priority |
|-------|-----------|-----------------|----------|
| COPY-001 | Get copies by book ID | Returns list of copies | HIGH |
| COPY-002 | Get copy by valid ID | Returns copy details | HIGH |
| COPY-003 | Get copy by non-existent ID | Returns 404 Not Found | HIGH |
| COPY-004 | Add copy to book (librarian) | Copy created successfully | HIGH |
| COPY-005 | Add duplicate copy number | Returns 400 Bad Request | HIGH |
| COPY-006 | Update copy status to LOANED | Status updated, book available count decremented | HIGH |
| COPY-007 | Update copy status to ON_SHELF | Status updated, book available count incremented | HIGH |

---

### 3.3 Loan Management Module (LoanService, LoanController)

#### 3.3.1 Loan Creation Tests

| TC ID | Test Case | Expected Result | Priority |
|-------|-----------|-----------------|----------|
| LOAN-001 | Create loan with valid copy (librarian) | Loan created, copy status LOANED | HIGH |
| LOAN-002 | Create loan for unavailable copy | Returns 400 Bad Request | HIGH |
| LOAN-003 | Create loan for already loaned copy | Returns 400 Bad Request | HIGH |
| LOAN-004 | Create loan for non-member user | Returns 400 Bad Request | HIGH |
| LOAN-005 | Create loan with invalid copy ID | Returns 404 Not Found | HIGH |
| LOAN-006 | Member attempts to create loan | Returns 403 Forbidden | HIGH |

#### 3.3.2 Return Book Tests

| TC ID | Test Case | Expected Result | Priority |
|-------|-----------|-----------------|----------|
| LOAN-020 | Return book on time | Status RETURNED, copy ON_SHELF | HIGH |
| LOAN-021 | Return book late | Status OVERDUE | HIGH |
| LOAN-022 | Return already returned book | Returns 400 Bad Request | HIGH |
| LOAN-023 | Return non-existent loan | Returns 404 Not Found | HIGH |

#### 3.3.3 Renew Loan Tests

| TC ID | Test Case | Expected Result | Priority |
|-------|-----------|-----------------|----------|
| LOAN-030 | Renew active loan | Due date extended, renewal count incremented | HIGH |
| LOAN-031 | Renew when max renewals reached | Returns 400 Bad Request | HIGH |
| LOAN-032 | Renew overdue loan | Returns 400 Bad Request | HIGH |
| LOAN-033 | Renew non-existent loan | Returns 404 Not Found | HIGH |

#### 3.3.4 Loan Query Tests

| TC ID | Test Case | Expected Result | Priority |
|-------|-----------|-----------------|----------|
| LOAN-040 | Get all loans (librarian) | Returns paginated loans | HIGH |
| LOAN-041 | Get user's loans | Returns user's active loans | HIGH |
| LOAN-042 | Get overdue loans (librarian) | Returns overdue loans list | HIGH |
| LOAN-043 | Member accesses all loans | Returns 403 Forbidden | HIGH |

---

### 3.4 User Management Module (UserService, UserController)

| TC ID | Test Case | Expected Result | Priority |
|-------|-----------|-----------------|----------|
| USER-001 | Get all users (librarian) | Returns paginated users | HIGH |
| USER-002 | Get user by ID | Returns user details | HIGH |
| USER-003 | Get non-existent user | Returns 404 Not Found | HIGH |
| USER-004 | Create user with unique data | User created successfully | HIGH |
| USER-005 | Create user with duplicate username | Returns 400 Bad Request | HIGH |
| USER-006 | Create user with duplicate email | Returns 400 Bad Request | HIGH |
| USER-007 | Update user | User updated successfully | HIGH |
| USER-008 | Update password when provided | Password updated | MEDIUM |
| USER-009 | Delete user | User deleted successfully | HIGH |
| USER-010 | Toggle user status | Active status toggled | MEDIUM |

---

### 3.5 Fee Management Module (FeeService, FeeController)

| TC ID | Test Case | Expected Result | Priority |
|-------|-----------|-----------------|----------|
| FEE-001 | Get fees by user ID | Returns list of fees | MEDIUM |
| FEE-002 | Get unpaid fees by user ID | Returns unpaid fees only | MEDIUM |
| FEE-003 | Calculate total unpaid fees | Returns sum of unpaid fees | MEDIUM |
| FEE-004 | Create fee for user | Fee created successfully | MEDIUM |
| FEE-005 | Mark fee as paid | Fee status updated, paidDate set | MEDIUM |
| FEE-006 | Mark already paid fee as paid | Returns 400 Bad Request | MEDIUM |
| FEE-007 | Delete unpaid fee | Fee deleted successfully | MEDIUM |
| FEE-008 | Delete paid fee | Returns 400 Bad Request | MEDIUM |

---

## 4. TEST DATA

### 4.1 Test Users

| Username | Password | Role | Purpose |
|----------|----------|------|---------|
| librarian | librarian123 | LIBRARIAN | Admin operations |
| john_doe | password123 | MEMBER | Member operations |

### 4.2 Test Books

| Title | Author | ISBN | Copies |
|-------|--------|------|--------|
| Test Book 1 | Author A | 1111111111 | 5 |
| Test Book 2 | Author B | 2222222222 | 3 |
| Java Programming | John Smith | 3333333333 | 2 |

---

## 5. TEST EXECUTION

### 5.1 Running Tests

```bash
# Run all tests
cd backend
mvn test

# Run specific test class
mvn test -Dtest=BookServiceTest

# Run with coverage report
mvn test jacoco:report

# View coverage report
open target/site/jacoco/index.html
```

### 5.2 Expected Test Results

| Test Type | Count | Status |
|-----------|-------|--------|
| BookServiceTest | 18 tests | PASS |
| LoanServiceTest | 14 tests | PASS |
| UserServiceTest | 14 tests | PASS |
| AuthServiceTest | 9 tests | PASS |
| FeeServiceTest | 10 tests | PASS |
| AuthControllerIntegrationTest | 6 tests | PASS |
| BookControllerIntegrationTest | 12 tests | PASS |
| LoanControllerIntegrationTest | 12 tests | PASS |
| **Total** | **95 tests** | **ALL PASS** |

---

## 6. COVERAGE TARGETS

| Component | Target Coverage |
|-----------|-----------------|
| Service Layer | 80%+ |
| Controller Layer | 70%+ |
| Overall | 70%+ |

---

## 7. RISKS AND MITIGATION

| Risk | Impact | Mitigation |
|------|--------|------------|
| Database state affecting tests | HIGH | Use @Transactional for rollback |
| Test data dependencies | MEDIUM | Use @BeforeEach to setup fresh data |
| Concurrent test execution | LOW | Use unique identifiers |

---

## 8. APPENDIX

### 8.1 Test Class Structure

```
backend/src/test/java/com/library/
├── service/
│   ├── BookServiceTest.java
│   ├── LoanServiceTest.java
│   ├── UserServiceTest.java
│   ├── AuthServiceTest.java
│   └── FeeServiceTest.java
├── controller/
│   ├── AuthControllerIntegrationTest.java
│   ├── BookControllerIntegrationTest.java
│   └── LoanControllerIntegrationTest.java
└── TestSecurityConfig.java
```

### 8.2 Test Configuration

```
backend/src/test/resources/
└── application-test.yml
```

### 8.3 Dependencies Added

```xml
<!-- H2 Database for Testing -->
<dependency>
    <groupId>com.h2database</groupId>
    <artifactId>h2</artifactId>
    <scope>test</scope>
</dependency>

<!-- JaCoCo for Test Coverage -->
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <version>0.8.11</version>
</plugin>
```

---

**Document Version:** 1.0
**Author:** Claude Code
**Date:** 2024
