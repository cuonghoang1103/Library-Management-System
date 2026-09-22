package com.library.service;

import com.library.dto.BookDTO;
import com.library.dto.CopyDTO;
import com.library.entity.AuditLog;
import com.library.entity.Book;
import com.library.entity.BookCopy;
import com.library.entity.CopyStatus;
import com.library.exception.BadRequestException;
import com.library.exception.ResourceNotFoundException;
import com.library.repository.BookRepository;
import com.library.repository.BookCopyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookService {

 private final BookRepository bookRepository;
 private final BookCopyRepository copyRepository;
 private final AuditLogService auditLogService;

 private static final int DEFAULT_LOAN_DAYS = 14;
 private static final String ISBN_EXISTS = "ISBN already exists";
    
    public Page<BookDTO> getAllBooks(Pageable pageable) {
        return bookRepository.findAll(pageable).map(this::toDTO);
    }
    
    public BookDTO getBookById(Long id) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with id: " + id));
        return toDTO(book);
    }
    
    public Page<BookDTO> searchBooks(String query, Pageable pageable) {
        if (query == null || query.trim().isEmpty()) {
            return bookRepository.findAll(pageable).map(this::toDTO);
        }
        return bookRepository.searchByKeyword(query.trim(), pageable).map(this::toDTO);
    }
    
    @Transactional
    public BookDTO createBook(BookDTO dto) {
 Book book = Book.builder()
 .title(dto.getTitle())
 .description(dto.getDescription())
 .author(dto.getAuthor())
 .isbn(dto.getIsbn())
 .publisher(dto.getPublisher())
 .publishedDate(dto.getPublishedDate())
 .genre(dto.getGenre())
 .coverImage(dto.getCoverImage())
 .language(dto.getLanguage())
 .pages(dto.getPages())
 .totalCopies(0)
 .availableCopies(0)
 .build();
        
        if (dto.getIsbn() != null && bookRepository.existsByIsbn(dto.getIsbn())) {
            throw new BadRequestException(ISBN_EXISTS);
        }
        try {
            book = bookRepository.save(book);
        } catch (DataIntegrityViolationException e) {
            // The same ISBN was inserted concurrently, after the check above
            throw new BadRequestException(ISBN_EXISTS, e);
        }

 auditLogService.logCreate(null, AuditLog.Entities.BOOK, book.getId(), toDTO(book), null);

 // Create initial copies if specified
        if (dto.getTotalCopies() > 0) {
            for (int i = 1; i <= dto.getTotalCopies(); i++) {
                BookCopy copy = BookCopy.builder()
                        .book(book)
                        .copyNumber("BK-" + book.getId() + "-" + i)
                        .status(CopyStatus.ON_SHELF)
                        .location(dto.getGenre() != null ? "A-01-" : null)
                        .build();
                copyRepository.save(copy);
            }
            book.setTotalCopies(dto.getTotalCopies());
            book.setAvailableCopies(dto.getTotalCopies());
            book = bookRepository.save(book);
        }
        
        return toDTO(book);
    }
    
    @Transactional
    public BookDTO updateBook(Long id, BookDTO dto) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with id: " + id));

        // Changing the ISBN to one that another book already uses
        if (dto.getIsbn() != null && !dto.getIsbn().equals(book.getIsbn())
                && bookRepository.existsByIsbn(dto.getIsbn())) {
            throw new BadRequestException(ISBN_EXISTS);
        }
        
        book.setTitle(dto.getTitle());
        book.setDescription(dto.getDescription());
        book.setAuthor(dto.getAuthor());
        book.setIsbn(dto.getIsbn());
        book.setPublisher(dto.getPublisher());
 book.setPublishedDate(dto.getPublishedDate());
 book.setGenre(dto.getGenre());
 book.setCoverImage(dto.getCoverImage());
 book.setLanguage(dto.getLanguage());
 book.setPages(dto.getPages());

 return toDTO(bookRepository.save(book));
 }

 @Transactional
 public void deleteBook(Long id) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with id: " + id));
        // The delete cascades to the copies and their loans, so a book on loan must not be deleted
        if (book.getCopies().stream().anyMatch(BookCopy::isOnLoan)) {
            throw new BadRequestException("Cannot delete a book while a copy is on loan");
        }
        bookRepository.delete(book);
    }
    
    // Copy management
    public List<CopyDTO> getCopiesByBookId(Long bookId) {
        return copyRepository.findByBookId(bookId).stream()
                .map(this::toCopyDTO)
                .collect(Collectors.toList());
    }
    
    public CopyDTO getCopyById(Long copyId) {
        BookCopy copy = copyRepository.findById(copyId)
                .orElseThrow(() -> new ResourceNotFoundException("Copy not found with id: " + copyId));
        return toCopyDTO(copy);
    }
    
    @Transactional
    public CopyDTO addCopy(Long bookId, CopyDTO dto) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with id: " + bookId));
        
        if (copyRepository.findByBookIdAndCopyNumber(bookId, dto.getCopyNumber()).isPresent()) {
            throw new BadRequestException("Copy number already exists for this book");
        }
        
        BookCopy copy = BookCopy.builder()
                .book(book)
                .copyNumber(dto.getCopyNumber())
                .status(CopyStatus.ON_SHELF)
                .location(dto.getLocation())
                .notes(dto.getNotes())
                .build();
        
        copy = copyRepository.save(copy);
        
        book.getCopies().add(copy);
        book.setTotalCopies(book.getTotalCopies() + 1);
        book.setAvailableCopies(book.getAvailableCopies() + 1);
        bookRepository.save(book);
        
        return toCopyDTO(copy);
    }
    
    @Transactional
    public CopyDTO updateCopyStatus(Long copyId, CopyStatus status) {
        BookCopy copy = copyRepository.findById(copyId)
                .orElseThrow(() -> new ResourceNotFoundException("Copy not found with id: " + copyId));
        
        CopyStatus oldStatus = copy.getStatus();
        copy.setStatus(status);
        copy = copyRepository.save(copy);
        
        // Update book's available count
        Book book = copy.getBook();
        if (oldStatus == CopyStatus.ON_SHELF && status != CopyStatus.ON_SHELF) {
            book.setAvailableCopies(book.getAvailableCopies() - 1);
        } else if (oldStatus != CopyStatus.ON_SHELF && status == CopyStatus.ON_SHELF) {
            book.setAvailableCopies(book.getAvailableCopies() + 1);
        }
        bookRepository.save(book);
        
        return toCopyDTO(copy);
    }
    
 private BookDTO toDTO(Book book) {
 return BookDTO.builder()
 .id(book.getId())
 .title(book.getTitle())
 .description(book.getDescription())
 .author(book.getAuthor())
 .isbn(book.getIsbn())
 .publisher(book.getPublisher())
 .publishedDate(book.getPublishedDate())
 .genre(book.getGenre())
 .coverImage(book.getCoverImage())
 .language(book.getLanguage())
 .pages(book.getPages())
 .totalCopies(book.getTotalCopies())
 .availableCopies(book.getAvailableCopies())
 .build();
 }
    
    private CopyDTO toCopyDTO(BookCopy copy) {
        return CopyDTO.builder()
                .id(copy.getId())
                .bookId(copy.getBook().getId())
                .bookTitle(copy.getBook().getTitle())
                .copyNumber(copy.getCopyNumber())
                .status(copy.getStatus())
                .location(copy.getLocation())
                .notes(copy.getNotes())
                .build();
    }
}
