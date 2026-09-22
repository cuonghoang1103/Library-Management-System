package com.library;

import com.library.dto.ApiResponse;
import com.library.dto.BookDTO;
import com.library.dto.CreateLoanRequest;
import com.library.dto.LoanDTO;
import com.library.dto.UserDTO;
import com.library.entity.*;
import com.library.exception.BadRequestException;
import com.library.repository.*;
import com.library.security.CustomUserDetails;
import com.library.security.CustomUserDetailsService;
import com.library.security.JwtAuthenticationFilter;
import com.library.security.JwtTokenProvider;
import com.library.service.*;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.catchThrowable;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * SWT301 - Lab "Project + Tool": tests of the CORRECT behaviour for 11 known defects.
 *
 * <p>Each test states what the system MUST do. On the current code they are RED - that is
 * the "tool reports the defect" evidence (JUnit 5 + Maven from the command line). Once a
 * defect is fixed, its test turns GREEN - that is the "after fix" evidence.</p>
 *
 * <p>Tagged {@code known-defect}, so a plain {@code mvn test} skips them (the pom sets
 * {@code excludedGroups}). Run them explicitly:</p>
 * <pre>
 *   mvn test -Dgroups=known-defect -DexcludedGroups=
 *   mvn test -Dgroups=known-defect -DexcludedGroups= -Dtest=KnownDefectsTest$TV4_BUG11_LibrarianCannotCancelReservation
 * </pre>
 * The two database-level defects (BUG-04, BUG-05) are in {@link KnownDefectsDbTest}.
 */
@Tag("known-defect")
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("Known defects - tests of the CORRECT behaviour (currently RED)")
class KnownDefectsTest {

    @Mock private BookRepository bookRepository;
    @Mock private BookCopyRepository copyRepository;
    @Mock private LoanRepository loanRepository;
    @Mock private UserRepository userRepository;
    @Mock private FeeRepository feeRepository;
    @Mock private ReservationRepository reservationRepository;
    @Mock private ReviewRepository reviewRepository;
    @Mock private NotificationRepository notificationRepository;
    @Mock private LibrarySettingsRepository settingsRepository;
    @Mock private AuditLogService auditLogService;
    @Mock private JwtTokenProvider tokenProvider;
    @Mock private CustomUserDetailsService userDetailsService;

    private static final LocalDate TODAY = LocalDate.now();

    private static User member(long id) {
        return User.builder().id(id).username("member" + id).password("x").fullName("Member " + id)
                .email("m" + id + "@example.com").role(Role.MEMBER).active(true).build();
    }

    private static User librarian(long id) {
        return User.builder().id(id).username("librarian" + id).password("x").fullName("Librarian " + id)
                .email("l" + id + "@example.com").role(Role.LIBRARIAN).active(true).build();
    }

    private static Book book() {
        return Book.builder().id(1L).title("Clean Code").author("Robert C. Martin")
                .totalCopies(1).availableCopies(1).build();
    }

    private LoanService loanService() {
        return new LoanService(loanRepository, copyRepository, bookRepository, userRepository,
                new FeeService(feeRepository, userRepository, loanRepository),
                new LibrarySettingsService(settingsRepository),
                new ReservationService(reservationRepository, bookRepository, userRepository, copyRepository));
    }

    /** A loan that is 3 days overdue and not returned yet. */
    private Loan overdueLoan(BookCopy copy) {
        return Loan.builder().id(100L).user(member(1L)).copy(copy)
                .borrowedDate(TODAY.minusDays(17)).dueDate(TODAY.minusDays(3))
                .status(LoanStatus.ACTIVE).renewalCount(0).build();
    }

    /** Borrows a copy that is on the shelf, without a due date. */
    private LoanDTO borrow(int openLoans) {
        BookCopy copy = BookCopy.builder().id(3L).book(book()).copyNumber("BK-1-1").status(CopyStatus.ON_SHELF).build();
        when(copyRepository.findById(3L)).thenReturn(Optional.of(copy));
        when(loanRepository.findActiveLoanByCopyId(3L)).thenReturn(Optional.empty());
        when(userRepository.findById(1L)).thenReturn(Optional.of(member(1L)));
        when(loanRepository.countActiveLoansByUserId(1L)).thenReturn(openLoans);
        when(loanRepository.save(any(Loan.class))).thenAnswer(i -> i.getArgument(0));
        CreateLoanRequest req = new CreateLoanRequest();
        req.setUserId(1L);
        req.setCopyId(3L);
        return loanService().createLoan(req);
    }

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    // ===== TV1 (group leader) - Loan + Fee =====

    @Nested
    @DisplayName("TV1 · BUG-01 - A late-returned copy can never be borrowed again")
    class TV1_BUG01_LateReturnBlocksReborrow {
        @Test
        @DisplayName("Returning a book (even late) closes the loan")
        void returningABookClosesTheLoan() {
            BookCopy copy = BookCopy.builder().id(42L).book(book()).copyNumber("BK-1-42").status(CopyStatus.LOANED).build();
            Loan loan = overdueLoan(copy);
            when(loanRepository.findById(100L)).thenReturn(Optional.of(loan));
            when(loanRepository.save(any(Loan.class))).thenAnswer(i -> i.getArgument(0));

            loanService().returnBook(100L);

            assertThat(loan.getStatus())
                    .as("After return the loan must be CLOSED - an OVERDUE loan is still treated as on loan and blocks the next borrow")
                    .isEqualTo(LoanStatus.CLOSED);
        }
    }

    @Nested
    @DisplayName("TV1 · BUG-02 - Overdue fees are never charged")
    class TV1_BUG02_OverdueFeeNeverCharged {
        @Test
        @DisplayName("Returning 3 days late creates a fee of 3 x 1000 = 3000 VND")
        void lateReturnCreatesOverdueFee() {
            BookCopy copy = BookCopy.builder().id(42L).book(book()).copyNumber("BK-1-42").status(CopyStatus.LOANED).build();
            when(loanRepository.findById(100L)).thenReturn(Optional.of(overdueLoan(copy)));
            when(loanRepository.save(any(Loan.class))).thenAnswer(i -> i.getArgument(0));

            loanService().returnBook(100L);

            verify(feeRepository).save(argThat(f -> f.getAmount() != null && f.getAmount().intValue() == 3000));
        }
    }

    @Nested
    @DisplayName("TV1 · BUG-03 - The borrow limit is never enforced")
    class TV1_BUG03_BorrowLimitNotEnforced {
        @Test
        @DisplayName("A member holding 99 books cannot borrow another one")
        void borrowingOverTheLimitIsRejected() {
            Throwable error = catchThrowable(() -> borrow(99));
            assertThat(error)
                    .as("A member holding 99 open loans is still allowed to borrow (no error at all)")
                    .isInstanceOf(BadRequestException.class);
        }
    }

    // ===== TV2 - Book + Copy =====

    @Nested
    @DisplayName("TV2 · BUG-06 - A duplicate ISBN returns HTTP 500 and leaks SQL details")
    class TV2_BUG06_DuplicateIsbnGives500 {
        @Test
        @DisplayName("Adding a book with an existing ISBN returns 400 \"ISBN already exists\"")
        void duplicateIsbnIsRejectedWith400() {
            BookService bookService = new BookService(bookRepository, copyRepository, auditLogService);
            when(bookRepository.save(any(Book.class))).thenThrow(new DataIntegrityViolationException(
                    "could not execute statement [Unique index or primary key violation: "
                            + "\"PUBLIC.UK_BOOKS_ISBN ON PUBLIC.BOOKS(ISBN)\"]"));
            BookDTO dto = BookDTO.builder().title("Clean Code").author("Robert C. Martin")
                    .isbn("9780132350884").totalCopies(0).build();

            assertThatThrownBy(() -> bookService.createBook(dto))
                    .as("A duplicate ISBN must be rejected with BadRequestException (HTTP 400)")
                    .isInstanceOf(BadRequestException.class);
        }
    }

    // ===== TV3 - Auth + User + Security =====

    @Nested
    @DisplayName("TV3 · BUG-07 - A locked account keeps working with its old token")
    class TV3_BUG07_LockedAccountKeepsAccess {
        @Test
        @DisplayName("A token of an account with active=false is not authenticated")
        void lockedAccountIsNotAuthenticated() throws Exception {
            User locked = member(7L);
            locked.setActive(false);
            when(tokenProvider.validateToken("token-cu")).thenReturn(true);
            when(tokenProvider.getUsernameFromToken("token-cu")).thenReturn(locked.getUsername());
            when(userDetailsService.loadUserByUsername(locked.getUsername())).thenReturn(new CustomUserDetails(locked));

            MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/loans/my");
            req.addHeader("Authorization", "Bearer token-cu");
            new JwtAuthenticationFilter(tokenProvider, userDetailsService)
                    .doFilter(req, new MockHttpServletResponse(), new MockFilterChain());

            assertThat(SecurityContextHolder.getContext().getAuthentication())
                    .as("A locked account (active=false) is still authenticated")
                    .isNull();
        }
    }

    @Nested
    @DisplayName("TV3 · BUG-08 - Accounts created without a password get \"password123\"")
    class TV3_BUG08_DefaultPassword {
        @Test
        @DisplayName("Creating an account without a password is rejected")
        void creatingUserWithoutPasswordIsRejected() {
            UserService userService = new UserService(userRepository, new BCryptPasswordEncoder());
            when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));
            UserDTO dto = UserDTO.builder().username("sv_moi").fullName("New Student")
                    .email("svmoi@example.com").role(Role.MEMBER).active(true).build();   // no password

            Throwable error = catchThrowable(() -> userService.createUser(dto));
            assertThat(error)
                    .as("The account is still created, with the default password 'password123'")
                    .isInstanceOf(BadRequestException.class);
        }
    }

    // ===== TV4 - Reservation + Review =====

    @Nested
    @DisplayName("TV4 · BUG-10 - The reservation queue never moves")
    class TV4_BUG10_ReservationQueueNeverMoves {
        @Test
        @DisplayName("Returning a book moves the first waiting reservation to READY")
        void returnPromotesFirstReservationToReady() {
            BookCopy copy = BookCopy.builder().id(42L).book(book()).copyNumber("BK-1-42").status(CopyStatus.LOANED).build();
            Loan loan = Loan.builder().id(100L).user(member(1L)).copy(copy)
                    .borrowedDate(TODAY.minusDays(5)).dueDate(TODAY.plusDays(9))
                    .status(LoanStatus.ACTIVE).renewalCount(0).build();
            Reservation waiting = Reservation.builder().id(5L).user(member(2L)).book(copy.getBook())
                    .status(Reservation.ReservationStatus.WAITING).reservedAt(LocalDateTime.now().minusDays(2)).build();
            when(loanRepository.findById(100L)).thenReturn(Optional.of(loan));
            when(loanRepository.save(any(Loan.class))).thenAnswer(i -> i.getArgument(0));
            when(reservationRepository.findWaitingReservationsByBookId(1L)).thenReturn(List.of(waiting));

            loanService().returnBook(100L);

            verify(reservationRepository).save(argThat(r -> r.getStatus() == Reservation.ReservationStatus.READY));
        }
    }

    @Nested
    @DisplayName("TV4 · BUG-11 - Librarians cannot cancel a member's reservation")
    class TV4_BUG11_LibrarianCannotCancelReservation {
        @Test
        @DisplayName("A librarian can cancel a member's reservation")
        void librarianCanCancelMemberReservation() {
            ReservationService rs = new ReservationService(reservationRepository, bookRepository, userRepository, copyRepository);
            Reservation membersReservation = Reservation.builder().id(10L).user(member(1L)).book(book())
                    .status(Reservation.ReservationStatus.WAITING).reservedAt(LocalDateTime.now()).build();
            when(reservationRepository.findById(10L)).thenReturn(Optional.of(membersReservation));
            when(userRepository.findById(99L)).thenReturn(Optional.of(librarian(99L)));
            when(reservationRepository.save(any(Reservation.class))).thenAnswer(i -> i.getArgument(0));

            assertThatCode(() -> rs.cancelReservation(10L, 99L))
                    .as("Librarian (id 99) cancels the reservation of member (id 1)")
                    .doesNotThrowAnyException();
        }
    }

    @Nested
    @DisplayName("TV4 · BUG-12 - A review without a rating crashes with HTTP 500")
    class TV4_BUG12_ReviewWithoutRatingGives500 {
        @Test
        @DisplayName("A missing rating returns 400 \"Rating must be between 1 and 5\"")
        void missingRatingIsRejectedWith400() {
            ReviewService reviewService = new ReviewService(reviewRepository, bookRepository, userRepository);
            assertThatThrownBy(() -> reviewService.createReview(1L, 1L, null, "Great book"))
                    .as("rating = null must raise BadRequestException (HTTP 400)")
                    .isInstanceOf(BadRequestException.class);
        }
    }

    // ===== TV5 - Notification + Settings =====

    @Nested
    @DisplayName("TV5 · BUG-13 - The system never creates a notification")
    class TV5_BUG13_NoNotificationIsCreated {
        @Test
        @DisplayName("Borrowing a book creates a \"Book Borrowed\" notification")
        void borrowingCreatesNotification() {
            borrow(0);
            verify(notificationRepository).save(argThat(n -> n.getType() == Notification.NotificationType.LOAN_CREATED));
        }
    }

    @Nested
    @DisplayName("TV5 · BUG-15 - Changing \"default loan days\" in Settings has no effect")
    class TV5_BUG15_SettingsAreIgnored {
        @Test
        @DisplayName("With 21 days in Settings, a new loan is due in 21 days")
        void dueDateFollowsSettings() {
            LibrarySettingsService settings = new LibrarySettingsService(settingsRepository);
            LibrarySettings s = LibrarySettings.builder().settingKey(LibrarySettings.Keys.DEFAULT_LOAN_DAYS)
                    .settingValue("14").category("LOAN").build();
            when(settingsRepository.findBySettingKey(LibrarySettings.Keys.DEFAULT_LOAN_DAYS)).thenReturn(Optional.of(s));
            settings.updateSetting(LibrarySettings.Keys.DEFAULT_LOAN_DAYS, "21");
            assertThat(settings.getDefaultLoanDays()).isEqualTo(21);   // the Settings page shows 21

            LoanDTO loan = borrow(0);

            assertThat(loan.getDueDate())
                    .as("Librarian set 21 days in Settings, but the due date still uses the hard-coded 14 in LoanService")
                    .isEqualTo(TODAY.plusDays(21));
        }
    }
}
