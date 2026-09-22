package com.library.service;

import com.library.dto.CreateLoanRequest;
import com.library.dto.LoanDTO;
import com.library.entity.*;
import com.library.exception.BadRequestException;
import com.library.exception.ResourceNotFoundException;
import com.library.repository.BookCopyRepository;
import com.library.repository.BookRepository;
import com.library.repository.LoanRepository;
import com.library.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LoanServiceTest {

    @Mock
    private LoanRepository loanRepository;

    @Mock
    private BookCopyRepository copyRepository;

    @Mock
    private BookRepository bookRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private FeeService feeService;

    @Mock
    private LibrarySettingsService settingsService;

    @Mock
    private ReservationService reservationService;

    @InjectMocks
    private LoanService loanService;

    private User testUser;
    private Book testBook;
    private BookCopy testCopy;
    private Loan testLoan;

    @BeforeEach
    void setUp() {
        // Library settings at their default values
        lenient().when(settingsService.getMaxLoansPerUser()).thenReturn(5);

        testUser = User.builder()
                .id(1L)
                .username("john_doe")
                .fullName("John Doe")
                .email("john@example.com")
                .role(Role.MEMBER)
                .active(true)
                .build();

        testBook = Book.builder()
                .id(1L)
                .title("Test Book")
                .author("Test Author")
                .totalCopies(5)
                .availableCopies(3)
                .build();

        testCopy = BookCopy.builder()
                .id(1L)
                .book(testBook)
                .copyNumber("BK-1-1")
                .status(CopyStatus.ON_SHELF)
                .build();

        testLoan = Loan.builder()
                .id(1L)
                .user(testUser)
                .copy(testCopy)
                .borrowedDate(LocalDate.now())
                .dueDate(LocalDate.now().plusDays(14))
                .status(LoanStatus.ACTIVE)
                .renewalCount(0)
                .build();
    }

    @Nested
    @DisplayName("getAllLoans Tests")
    class GetAllLoansTests {

        @Test
        @DisplayName("Should return paginated loans")
        void shouldReturnPaginatedLoans() {
            List<Loan> loans = List.of(testLoan);
            Page<Loan> loanPage = new PageImpl<>(loans, PageRequest.of(0, 10), 1);
            when(loanRepository.findAll(any(Pageable.class))).thenReturn(loanPage);

            Page<LoanDTO> result = loanService.getAllLoans(PageRequest.of(0, 10));

            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getUserName()).isEqualTo("John Doe");
        }

        @Test
        @DisplayName("Should return empty page when no loans")
        void shouldReturnEmptyPageWhenNoLoans() {
            Page<Loan> emptyPage = new PageImpl<>(List.of(), PageRequest.of(0, 10), 0);
            when(loanRepository.findAll(any(Pageable.class))).thenReturn(emptyPage);

            Page<LoanDTO> result = loanService.getAllLoans(PageRequest.of(0, 10));

            assertThat(result.getContent()).isEmpty();
        }
    }

    @Nested
    @DisplayName("getLoanById Tests")
    class GetLoanByIdTests {

        @Test
        @DisplayName("Should return loan when exists")
        void shouldReturnLoanWhenExists() {
            when(loanRepository.findById(1L)).thenReturn(Optional.of(testLoan));

            LoanDTO result = loanService.getLoanById(1L);

            assertThat(result.getId()).isEqualTo(1L);
            assertThat(result.getUserName()).isEqualTo("John Doe");
        }

        @Test
        @DisplayName("Should throw exception when loan not found")
        void shouldThrowExceptionWhenLoanNotFound() {
            when(loanRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> loanService.getLoanById(999L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Loan not found");
        }
    }

    @Nested
    @DisplayName("createLoan Tests")
    class CreateLoanTests {

        @Test
        @DisplayName("Should create loan successfully")
        void shouldCreateLoanSuccessfully() {
            CreateLoanRequest request = CreateLoanRequest.builder()
                    .userId(1L)
                    .copyId(1L)
                    .build();

            when(copyRepository.findById(1L)).thenReturn(Optional.of(testCopy));
            when(loanRepository.findActiveLoanByCopyId(1L)).thenReturn(Optional.empty());
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(copyRepository.save(any(BookCopy.class))).thenReturn(testCopy);
            when(bookRepository.save(any(Book.class))).thenReturn(testBook);
            when(loanRepository.save(any(Loan.class))).thenAnswer(invocation -> {
                Loan loan = invocation.getArgument(0);
                loan.setId(1L);
                return loan;
            });

            LoanDTO result = loanService.createLoan(request);

            assertThat(result.getId()).isEqualTo(1L);
            assertThat(result.getStatus()).isEqualTo(LoanStatus.ACTIVE);
            verify(copyRepository, times(1)).save(any(BookCopy.class));
        }

        @Test
        @DisplayName("Should throw exception when copy not found")
        void shouldThrowExceptionWhenCopyNotFound() {
            CreateLoanRequest request = CreateLoanRequest.builder()
                    .userId(1L)
                    .copyId(999L)
                    .build();

            when(copyRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> loanService.createLoan(request))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Copy not found");
        }

        @Test
        @DisplayName("Should throw exception when copy not available")
        void shouldThrowExceptionWhenCopyNotAvailable() {
            testCopy.setStatus(CopyStatus.LOANED);
            CreateLoanRequest request = CreateLoanRequest.builder()
                    .userId(1L)
                    .copyId(1L)
                    .build();

            when(copyRepository.findById(1L)).thenReturn(Optional.of(testCopy));

            assertThatThrownBy(() -> loanService.createLoan(request))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("not available");
        }

        @Test
        @DisplayName("Should throw exception when copy already on loan")
        void shouldThrowExceptionWhenCopyAlreadyOnLoan() {
            CreateLoanRequest request = CreateLoanRequest.builder()
                    .userId(1L)
                    .copyId(1L)
                    .build();

            when(copyRepository.findById(1L)).thenReturn(Optional.of(testCopy));
            when(loanRepository.findActiveLoanByCopyId(1L)).thenReturn(Optional.of(testLoan));

            assertThatThrownBy(() -> loanService.createLoan(request))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("already on loan");
        }

        @Test
        @DisplayName("Should throw exception when user is not a member")
        void shouldThrowExceptionWhenUserIsNotMember() {
            testUser.setRole(Role.LIBRARIAN);
            CreateLoanRequest request = CreateLoanRequest.builder()
                    .userId(1L)
                    .copyId(1L)
                    .build();

            when(copyRepository.findById(1L)).thenReturn(Optional.of(testCopy));
            when(loanRepository.findActiveLoanByCopyId(1L)).thenReturn(Optional.empty());
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

            assertThatThrownBy(() -> loanService.createLoan(request))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Only members");
        }
    }

    @Nested
    @DisplayName("returnBook Tests")
    class ReturnBookTests {

        @Test
        @DisplayName("Should return book successfully on time")
        void shouldReturnBookSuccessfullyOnTime() {
            testLoan.setDueDate(LocalDate.now().plusDays(1)); // Not overdue
            when(loanRepository.findById(1L)).thenReturn(Optional.of(testLoan));
            when(loanRepository.save(any(Loan.class))).thenReturn(testLoan);
            when(copyRepository.save(any(BookCopy.class))).thenReturn(testCopy);
            when(bookRepository.save(any(Book.class))).thenReturn(testBook);

            LoanDTO result = loanService.returnBook(1L);

            assertThat(result.getReturnedDate()).isEqualTo(LocalDate.now());
            verify(copyRepository, times(1)).save(any(BookCopy.class));
        }

        @Test
        @DisplayName("Should close the loan when returned late")
        void shouldCloseLoanWhenReturnedLate() {
            testLoan.setDueDate(LocalDate.now().minusDays(1)); // Overdue
            when(loanRepository.findById(1L)).thenReturn(Optional.of(testLoan));
            when(loanRepository.save(any(Loan.class))).thenAnswer(invocation -> invocation.getArgument(0));
            when(copyRepository.save(any(BookCopy.class))).thenReturn(testCopy);
            when(bookRepository.save(any(Book.class))).thenReturn(testBook);

            LoanDTO result = loanService.returnBook(1L);

            assertThat(result.getStatus()).isEqualTo(LoanStatus.CLOSED);
        }

        @Test
        @DisplayName("Should throw exception when loan already returned")
        void shouldThrowExceptionWhenLoanAlreadyReturned() {
            testLoan.setStatus(LoanStatus.RETURNED);
            when(loanRepository.findById(1L)).thenReturn(Optional.of(testLoan));

            assertThatThrownBy(() -> loanService.returnBook(1L))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("already been returned");
        }

        @Test
        @DisplayName("Should throw exception when loan not found")
        void shouldThrowExceptionWhenLoanNotFound() {
            when(loanRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> loanService.returnBook(999L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("renewLoan Tests")
    class RenewLoanTests {

        @Test
        @DisplayName("Should renew loan successfully")
        void shouldRenewLoanSuccessfully() {
            when(loanRepository.findById(1L)).thenReturn(Optional.of(testLoan));
            when(loanRepository.save(any(Loan.class))).thenReturn(testLoan);

            LoanDTO result = loanService.renewLoan(1L);

            assertThat(result.getRenewalCount()).isEqualTo(1);
            assertThat(testLoan.getDueDate()).isEqualTo(LocalDate.now().plusDays(28));
        }

        @Test
        @DisplayName("Should throw exception when max renewals reached")
        void shouldThrowExceptionWhenMaxRenewalsReached() {
            testLoan.setRenewalCount(2); // Max is 2
            when(loanRepository.findById(1L)).thenReturn(Optional.of(testLoan));

            assertThatThrownBy(() -> loanService.renewLoan(1L))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Maximum renewal limit");
        }

        @Test
        @DisplayName("Should throw exception when loan is overdue")
        void shouldThrowExceptionWhenLoanIsOverdue() {
            testLoan.setDueDate(LocalDate.now().minusDays(1)); // Overdue
            when(loanRepository.findById(1L)).thenReturn(Optional.of(testLoan));

            assertThatThrownBy(() -> loanService.renewLoan(1L))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Cannot renew overdue loan");
        }

        @Test
        @DisplayName("Should throw exception when loan not found")
        void shouldThrowExceptionWhenLoanNotFound() {
            when(loanRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> loanService.renewLoan(999L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("getOverdueList Tests")
    class GetOverdueListTests {

        @Test
        @DisplayName("Should return overdue loans")
        void shouldReturnOverdueLoans() {
            testLoan.setDueDate(LocalDate.now().minusDays(1));
            when(loanRepository.findOverdueLoans(eq(LocalDate.now()), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(testLoan)));

            List<LoanDTO> result = loanService.getOverdueList();

            assertThat(result).hasSize(1);
        }
    }
}
