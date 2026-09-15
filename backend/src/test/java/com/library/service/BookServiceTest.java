package com.library.service;

import com.library.dto.BookDTO;
import com.library.dto.CopyDTO;
import com.library.entity.Book;
import com.library.entity.BookCopy;
import com.library.entity.CopyStatus;
import com.library.exception.BadRequestException;
import com.library.exception.ResourceNotFoundException;
import com.library.repository.BookCopyRepository;
import com.library.repository.BookRepository;
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
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookServiceTest {

    @Mock
    private BookRepository bookRepository;

    @Mock
    private BookCopyRepository copyRepository;

    @InjectMocks
    private BookService bookService;

    private Book testBook;
    private BookDTO testBookDTO;
    private BookCopy testCopy;

    @BeforeEach
    void setUp() {
        testBook = Book.builder()
                .id(1L)
                .title("Test Book")
                .description("Test Description")
                .author("Test Author")
                .isbn("1234567890")
                .publisher("Test Publisher")
                .publishedDate(LocalDate.of(2023, 1, 1))
                .genre("Technology")
                .totalCopies(0) // Default to 0 for create without copies test
                .availableCopies(3)
                .copies(new ArrayList<>())
                .build();

        testBookDTO = BookDTO.builder()
                .title("Test Book")
                .description("Test Description")
                .author("Test Author")
                .isbn("1234567890")
                .publisher("Test Publisher")
                .publishedDate(LocalDate.of(2023, 1, 1))
                .genre("Technology")
                .totalCopies(0) // Default to 0 for create without copies test
                .build();

        testCopy = BookCopy.builder()
                .id(1L)
                .book(testBook)
                .copyNumber("BK-1-1")
                .status(CopyStatus.ON_SHELF)
                .location("A-01-01")
                .build();
    }

    @Nested
    @DisplayName("getAllBooks Tests")
    class GetAllBooksTests {

        @Test
        @DisplayName("Should return paginated books")
        void shouldReturnPaginatedBooks() {
            List<Book> books = List.of(testBook);
            Page<Book> bookPage = new PageImpl<>(books, PageRequest.of(0, 10), 1);
            when(bookRepository.findAll(any(Pageable.class))).thenReturn(bookPage);

            Page<BookDTO> result = bookService.getAllBooks(PageRequest.of(0, 10));

            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getTitle()).isEqualTo("Test Book");
            verify(bookRepository, times(1)).findAll(any(Pageable.class));
        }

        @Test
        @DisplayName("Should return empty page when no books exist")
        void shouldReturnEmptyPageWhenNoBooks() {
            Page<Book> emptyPage = new PageImpl<>(List.of(), PageRequest.of(0, 10), 0);
            when(bookRepository.findAll(any(Pageable.class))).thenReturn(emptyPage);

            Page<BookDTO> result = bookService.getAllBooks(PageRequest.of(0, 10));

            assertThat(result.getContent()).isEmpty();
        }
    }

    @Nested
    @DisplayName("getBookById Tests")
    class GetBookByIdTests {

        @Test
        @DisplayName("Should return book when exists")
        void shouldReturnBookWhenExists() {
            when(bookRepository.findById(1L)).thenReturn(Optional.of(testBook));

            BookDTO result = bookService.getBookById(1L);

            assertThat(result.getId()).isEqualTo(1L);
            assertThat(result.getTitle()).isEqualTo("Test Book");
            assertThat(result.getAuthor()).isEqualTo("Test Author");
        }

        @Test
        @DisplayName("Should throw exception when book not found")
        void shouldThrowExceptionWhenBookNotFound() {
            when(bookRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> bookService.getBookById(999L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Book not found");
        }
    }

    @Nested
    @DisplayName("searchBooks Tests")
    class SearchBooksTests {

        @Test
        @DisplayName("Should return all books when query is empty")
        void shouldReturnAllBooksWhenQueryEmpty() {
            List<Book> books = List.of(testBook);
            Page<Book> bookPage = new PageImpl<>(books);
            when(bookRepository.findAll(any(Pageable.class))).thenReturn(bookPage);

            Page<BookDTO> result = bookService.searchBooks("", PageRequest.of(0, 10));

            assertThat(result.getContent()).hasSize(1);
            verify(bookRepository, times(1)).findAll(any(Pageable.class));
            verify(bookRepository, never()).searchByKeyword(any(), any());
        }

        @Test
        @DisplayName("Should return all books when query is null")
        void shouldReturnAllBooksWhenQueryNull() {
            List<Book> books = List.of(testBook);
            Page<Book> bookPage = new PageImpl<>(books);
            when(bookRepository.findAll(any(Pageable.class))).thenReturn(bookPage);

            Page<BookDTO> result = bookService.searchBooks(null, PageRequest.of(0, 10));

            assertThat(result.getContent()).hasSize(1);
        }

        @Test
        @DisplayName("Should perform keyword search when query provided")
        void shouldPerformFullTextSearch() {
            List<Book> books = List.of(testBook);
            Page<Book> bookPage = new PageImpl<>(books);
            when(bookRepository.searchByKeyword(eq("Test"), any(Pageable.class))).thenReturn(bookPage);

            Page<BookDTO> result = bookService.searchBooks("Test", PageRequest.of(0, 10));

            assertThat(result.getContent()).hasSize(1);
            verify(bookRepository, times(1)).searchByKeyword(eq("Test"), any(Pageable.class));
        }
    }

    @Nested
    @DisplayName("createBook Tests")
    class CreateBookTests {

        @Test
        @DisplayName("Should create book without copies")
        void shouldCreateBookWithoutCopies() {
            when(bookRepository.save(any(Book.class))).thenAnswer(invocation -> {
                Book book = invocation.getArgument(0);
                book.setId(1L);
                return book;
            });

            BookDTO result = bookService.createBook(testBookDTO);

            assertThat(result.getId()).isEqualTo(1L);
            assertThat(result.getTotalCopies()).isEqualTo(0);
            verify(bookRepository, times(1)).save(any(Book.class));
        }

        @Test
        @DisplayName("Should create book with initial copies")
        void shouldCreateBookWithCopies() {
            testBookDTO.setTotalCopies(3);
            when(bookRepository.save(any(Book.class))).thenAnswer(invocation -> {
                Book book = invocation.getArgument(0);
                book.setId(1L);
                return book;
            });
            when(copyRepository.save(any(BookCopy.class))).thenAnswer(invocation -> {
                BookCopy copy = invocation.getArgument(0);
                copy.setId(1L);
                return copy;
            });

            BookDTO result = bookService.createBook(testBookDTO);

            assertThat(result.getTotalCopies()).isEqualTo(3);
            assertThat(result.getAvailableCopies()).isEqualTo(3);
            verify(copyRepository, times(3)).save(any(BookCopy.class));
        }
    }

    @Nested
    @DisplayName("updateBook Tests")
    class UpdateBookTests {

        @Test
        @DisplayName("Should update book successfully")
        void shouldUpdateBookSuccessfully() {
            when(bookRepository.findById(1L)).thenReturn(Optional.of(testBook));
            when(bookRepository.save(any(Book.class))).thenReturn(testBook);

            BookDTO updateDTO = BookDTO.builder()
                    .title("Updated Title")
                    .description("Updated Description")
                    .author("Updated Author")
                    .build();

            BookDTO result = bookService.updateBook(1L, updateDTO);

            assertThat(result.getTitle()).isEqualTo("Updated Title");
            verify(bookRepository, times(1)).save(any(Book.class));
        }

        @Test
        @DisplayName("Should throw exception when updating non-existent book")
        void shouldThrowExceptionWhenUpdatingNonExistentBook() {
            when(bookRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> bookService.updateBook(999L, testBookDTO))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("deleteBook Tests")
    class DeleteBookTests {

        @Test
        @DisplayName("Should delete book successfully")
        void shouldDeleteBookSuccessfully() {
            when(bookRepository.findById(1L)).thenReturn(Optional.of(testBook));
            doNothing().when(bookRepository).delete(testBook);

            bookService.deleteBook(1L);

            verify(bookRepository, times(1)).delete(testBook);
        }

        @Test
        @DisplayName("Should throw exception when deleting non-existent book")
        void shouldThrowExceptionWhenDeletingNonExistentBook() {
            when(bookRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> bookService.deleteBook(999L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("Copy Management Tests")
    class CopyManagementTests {

        @Test
        @DisplayName("Should get copies by book ID")
        void shouldGetCopiesByBookId() {
            when(copyRepository.findByBookId(1L)).thenReturn(List.of(testCopy));

            List<CopyDTO> result = bookService.getCopiesByBookId(1L);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getCopyNumber()).isEqualTo("BK-1-1");
        }

        @Test
        @DisplayName("Should get copy by ID")
        void shouldGetCopyById() {
            when(copyRepository.findById(1L)).thenReturn(Optional.of(testCopy));

            CopyDTO result = bookService.getCopyById(1L);

            assertThat(result.getId()).isEqualTo(1L);
            assertThat(result.getCopyNumber()).isEqualTo("BK-1-1");
        }

        @Test
        @DisplayName("Should throw exception when copy not found")
        void shouldThrowExceptionWhenCopyNotFound() {
            when(copyRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> bookService.getCopyById(999L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("Should add copy to book")
        void shouldAddCopyToBook() {
            when(bookRepository.findById(1L)).thenReturn(Optional.of(testBook));
            when(copyRepository.findByBookIdAndCopyNumber(1L, "BK-1-2")).thenReturn(Optional.empty());
            when(copyRepository.save(any(BookCopy.class))).thenAnswer(invocation -> {
                BookCopy copy = invocation.getArgument(0);
                copy.setId(2L);
                return copy;
            });
            when(bookRepository.save(any(Book.class))).thenReturn(testBook);

            CopyDTO copyDTO = CopyDTO.builder()
                    .copyNumber("BK-1-2")
                    .location("A-01-02")
                    .build();

            CopyDTO result = bookService.addCopy(1L, copyDTO);

            assertThat(result.getId()).isEqualTo(2L);
            verify(bookRepository, times(1)).save(any(Book.class));
        }

        @Test
        @DisplayName("Should throw exception when adding duplicate copy")
        void shouldThrowExceptionWhenAddingDuplicateCopy() {
            when(bookRepository.findById(1L)).thenReturn(Optional.of(testBook));
            when(copyRepository.findByBookIdAndCopyNumber(1L, "BK-1-1")).thenReturn(Optional.of(testCopy));

            CopyDTO copyDTO = CopyDTO.builder()
                    .copyNumber("BK-1-1")
                    .build();

            assertThatThrownBy(() -> bookService.addCopy(1L, copyDTO))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("already exists");
        }

        @Test
        @DisplayName("Should update copy status to LOANED")
        void shouldUpdateCopyStatusToLoaned() {
            when(copyRepository.findById(1L)).thenReturn(Optional.of(testCopy));
            when(copyRepository.save(any(BookCopy.class))).thenReturn(testCopy);
            when(bookRepository.save(any(Book.class))).thenReturn(testBook);

            CopyDTO result = bookService.updateCopyStatus(1L, CopyStatus.LOANED);

            assertThat(result.getStatus()).isEqualTo(CopyStatus.LOANED);
            verify(bookRepository, times(1)).save(any(Book.class));
        }

        @Test
        @DisplayName("Should update copy status to ON_SHELF")
        void shouldUpdateCopyStatusToOnShelf() {
            testCopy.setStatus(CopyStatus.LOANED);
            when(copyRepository.findById(1L)).thenReturn(Optional.of(testCopy));
            when(copyRepository.save(any(BookCopy.class))).thenReturn(testCopy);
            when(bookRepository.save(any(Book.class))).thenReturn(testBook);

            CopyDTO result = bookService.updateCopyStatus(1L, CopyStatus.ON_SHELF);

            assertThat(result.getStatus()).isEqualTo(CopyStatus.ON_SHELF);
        }
    }
}
