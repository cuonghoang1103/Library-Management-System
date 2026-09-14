package com.library.controller;

import com.library.dto.ApiResponse;
import com.library.dto.BookDTO;
import com.library.dto.CopyDTO;
import com.library.entity.CopyStatus;
import com.library.service.BookService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/books")
@RequiredArgsConstructor
public class BookController {
    
    private final BookService bookService;
    
    @GetMapping
    public ResponseEntity<ApiResponse<Page<BookDTO>>> getAllBooks(
            @PageableDefault(size = 10) Pageable pageable) {
        Page<BookDTO> books = bookService.getAllBooks(pageable);
        return ResponseEntity.ok(ApiResponse.success(books));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BookDTO>> getBookById(@PathVariable Long id) {
        BookDTO book = bookService.getBookById(id);
        return ResponseEntity.ok(ApiResponse.success(book));
    }
    
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<BookDTO>>> searchBooks(
            @RequestParam(required = false) String q,
            @PageableDefault(size = 10) Pageable pageable) {
        Page<BookDTO> books = bookService.searchBooks(q, pageable);
        return ResponseEntity.ok(ApiResponse.success(books));
    }
    
    @PostMapping
    @PreAuthorize("hasRole('LIBRARIAN')")
    public ResponseEntity<ApiResponse<BookDTO>> createBook(@Valid @RequestBody BookDTO dto) {
        BookDTO book = bookService.createBook(dto);
        return ResponseEntity.ok(ApiResponse.success("Book created successfully", book));
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('LIBRARIAN')")
    public ResponseEntity<ApiResponse<BookDTO>> updateBook(
            @PathVariable Long id, 
            @Valid @RequestBody BookDTO dto) {
        BookDTO book = bookService.updateBook(id, dto);
        return ResponseEntity.ok(ApiResponse.success("Book updated successfully", book));
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('LIBRARIAN')")
    public ResponseEntity<ApiResponse<Void>> deleteBook(@PathVariable Long id) {
        bookService.deleteBook(id);
        return ResponseEntity.ok(ApiResponse.success("Book deleted successfully", null));
    }
    
    // Copy management endpoints
    @GetMapping("/{bookId}/copies")
    public ResponseEntity<ApiResponse<List<CopyDTO>>> getCopiesByBookId(@PathVariable Long bookId) {
        List<CopyDTO> copies = bookService.getCopiesByBookId(bookId);
        return ResponseEntity.ok(ApiResponse.success(copies));
    }
    
    @PostMapping("/{bookId}/copies")
    @PreAuthorize("hasRole('LIBRARIAN')")
    public ResponseEntity<ApiResponse<CopyDTO>> addCopy(
            @PathVariable Long bookId, 
            @Valid @RequestBody CopyDTO dto) {
        CopyDTO copy = bookService.addCopy(bookId, dto);
        return ResponseEntity.ok(ApiResponse.success("Copy added successfully", copy));
    }
    
    @GetMapping("/copies/{copyId}")
    public ResponseEntity<ApiResponse<CopyDTO>> getCopyById(@PathVariable Long copyId) {
        CopyDTO copy = bookService.getCopyById(copyId);
        return ResponseEntity.ok(ApiResponse.success(copy));
    }
    
    @PatchMapping("/copies/{copyId}/status")
    @PreAuthorize("hasRole('LIBRARIAN')")
    public ResponseEntity<ApiResponse<CopyDTO>> updateCopyStatus(
            @PathVariable Long copyId,
            @RequestParam CopyStatus status) {
        CopyDTO copy = bookService.updateCopyStatus(copyId, status);
        return ResponseEntity.ok(ApiResponse.success("Copy status updated", copy));
    }
}
