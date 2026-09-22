package com.library;

import com.library.entity.*;
import com.library.exception.BadRequestException;
import com.library.repository.BookCopyRepository;
import com.library.repository.BookRepository;
import com.library.repository.LoanRepository;
import com.library.repository.UserRepository;
import com.library.service.AuditLogService;
import com.library.service.BookService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowable;
import static org.mockito.Mockito.mock;

/**
 * SWT301 - tests of the CORRECT behaviour for the two TV2 (Book + Copy) defects that live in
 * the QUERY and the JPA MAPPING. A mocked repository cannot see them, so these run against
 * Hibernate on H2 (profile "test"). RED on the current code; GREEN once fixed.
 *
 * <pre>mvn test -Dgroups=known-defect -DexcludedGroups= -Dtest=KnownDefectsDbTest</pre>
 */
@Tag("known-defect")
@DataJpaTest
@ActiveProfiles("test")
@DisplayName("Known defects - database level (currently RED)")
class KnownDefectsDbTest {

    @Autowired private BookRepository bookRepository;
    @Autowired private BookCopyRepository copyRepository;
    @Autowired private LoanRepository loanRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private TestEntityManager em;

    @Nested
    @DisplayName("TV2 · BUG-04 - The search box promises ISBN search, but an ISBN finds nothing")
    class TV2_BUG04_IsbnSearchFindsNothing {
        @Test
        @DisplayName("Searching the exact ISBN of a book returns that book")
        void searchingByIsbnFindsTheBook() {
            bookRepository.save(Book.builder().title("Clean Code").author("Robert C. Martin")
                    .isbn("9780132350884").totalCopies(0).availableCopies(0).build());
            em.flush();

            assertThat(bookRepository.searchByKeyword("clean", PageRequest.of(0, 10)).getTotalElements())
                    .as("Search by title").isEqualTo(1);
            assertThat(bookRepository.searchByKeyword("9780132350884", PageRequest.of(0, 10)).getTotalElements())
                    .as("Search by ISBN 9780132350884 (the UI says: 'Search by title, author, or ISBN')")
                    .isEqualTo(1);
        }
    }

    @Nested
    @DisplayName("TV2 · BUG-05 - Deleting a book also deletes its open loans")
    class TV2_BUG05_DeleteBookWipesLoans {
        @Test
        @DisplayName("A book with a copy on loan cannot be deleted")
        void deletingABookOnLoanIsBlocked() {
            User member = userRepository.save(User.builder().username("member1").password("x").fullName("Member 1")
                    .email("member1@example.com").role(Role.MEMBER).active(true).build());
            Book book = Book.builder().title("Refactoring").author("Martin Fowler").isbn("9780134757599")
                    .totalCopies(1).availableCopies(0).build();
            BookCopy copy = BookCopy.builder().book(book).copyNumber("BK-1-1").status(CopyStatus.LOANED).build();
            book.getCopies().add(copy);
            bookRepository.save(book);
            Loan activeLoan = Loan.builder().user(member).copy(copy).borrowedDate(LocalDate.now())
                    .dueDate(LocalDate.now().plusDays(14)).status(LoanStatus.ACTIVE).renewalCount(0).build();
            copy.getLoans().add(activeLoan);
            loanRepository.save(activeLoan);
            em.flush();
            em.clear();

            BookService bookService = new BookService(bookRepository, copyRepository, mock(AuditLogService.class));
            Long bookId = book.getId();

            Throwable error = catchThrowable(() -> {
                bookService.deleteBook(bookId);
                em.flush();
            });
            assertThat(error)
                    .as("Deleting a book that is on loan is not blocked - loans left after delete: "
                            + loanRepository.count() + " (before: 1). CascadeType.ALL removes the loan history")
                    .isInstanceOf(BadRequestException.class);
        }
    }
}
