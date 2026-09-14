package com.library.controller;

import com.library.dto.ApiResponse;
import com.library.dto.CreateLoanRequest;
import com.library.dto.LoanDTO;
import com.library.security.CustomUserDetails;
import com.library.service.LoanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/loans")
@RequiredArgsConstructor
public class LoanController {
    
    private final LoanService loanService;
    
    @GetMapping
    @PreAuthorize("hasRole('LIBRARIAN')")
    public ResponseEntity<ApiResponse<Page<LoanDTO>>> getAllLoans(
            @PageableDefault(size = 10) Pageable pageable) {
        Page<LoanDTO> loans = loanService.getAllLoans(pageable);
        return ResponseEntity.ok(ApiResponse.success(loans));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<LoanDTO>> getLoanById(@PathVariable Long id) {
        LoanDTO loan = loanService.getLoanById(id);
        return ResponseEntity.ok(ApiResponse.success(loan));
    }
    
    @GetMapping("/user/{userId}")
    @PreAuthorize("hasRole('LIBRARIAN')")
    public ResponseEntity<ApiResponse<Page<LoanDTO>>> getLoansByUserId(
            @PathVariable Long userId,
            @PageableDefault(size = 10) Pageable pageable) {
        Page<LoanDTO> loans = loanService.getLoansByUserId(userId, pageable);
        return ResponseEntity.ok(ApiResponse.success(loans));
    }
    
    @GetMapping("/my-loans")
    public ResponseEntity<ApiResponse<List<LoanDTO>>> getMyLoans(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<LoanDTO> loans = loanService.getActiveLoansByUserId(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success(loans));
    }
    
    @GetMapping("/overdue")
    @PreAuthorize("hasRole('LIBRARIAN')")
    public ResponseEntity<ApiResponse<List<LoanDTO>>> getOverdueLoans() {
        List<LoanDTO> loans = loanService.getOverdueList();
        return ResponseEntity.ok(ApiResponse.success(loans));
    }
    
    @GetMapping("/copy/{copyId}/history")
    @PreAuthorize("hasRole('LIBRARIAN')")
    public ResponseEntity<ApiResponse<List<LoanDTO>>> getLoanHistoryByCopyId(@PathVariable Long copyId) {
        List<LoanDTO> loans = loanService.getLoanHistoryByCopyId(copyId);
        return ResponseEntity.ok(ApiResponse.success(loans));
    }
    
    @PostMapping
    @PreAuthorize("hasRole('LIBRARIAN')")
    public ResponseEntity<ApiResponse<LoanDTO>> createLoan(@Valid @RequestBody CreateLoanRequest request) {
        LoanDTO loan = loanService.createLoan(request);
        return ResponseEntity.ok(ApiResponse.success("Book borrowed successfully", loan));
    }
    
    @PostMapping("/{id}/return")
    public ResponseEntity<ApiResponse<LoanDTO>> returnBook(@PathVariable Long id) {
        LoanDTO loan = loanService.returnBook(id);
        return ResponseEntity.ok(ApiResponse.success("Book returned successfully", loan));
    }
    
    @PostMapping("/{id}/renew")
    public ResponseEntity<ApiResponse<LoanDTO>> renewLoan(@PathVariable Long id) {
        LoanDTO loan = loanService.renewLoan(id);
        return ResponseEntity.ok(ApiResponse.success("Loan renewed successfully", loan));
    }
}
