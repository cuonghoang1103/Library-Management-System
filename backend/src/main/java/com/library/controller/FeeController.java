package com.library.controller;

import com.library.dto.ApiResponse;
import com.library.dto.FeeDTO;
import com.library.security.CustomUserDetails;
import com.library.service.FeeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/fees")
@RequiredArgsConstructor
public class FeeController {
    
    private final FeeService feeService;
    
    @GetMapping("/user/{userId}")
    @PreAuthorize("hasRole('LIBRARIAN')")
    public ResponseEntity<ApiResponse<List<FeeDTO>>> getFeesByUserId(@PathVariable Long userId) {
        List<FeeDTO> fees = feeService.getFeesByUserId(userId);
        return ResponseEntity.ok(ApiResponse.success(fees));
    }
    
    @GetMapping("/my-fees")
    public ResponseEntity<ApiResponse<List<FeeDTO>>> getMyFees(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<FeeDTO> fees = feeService.getUnpaidFeesByUserId(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success(fees));
    }
    
    @GetMapping("/my-fees/total")
    public ResponseEntity<ApiResponse<BigDecimal>> getMyTotalUnpaidFees(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        BigDecimal total = feeService.getTotalUnpaidFees(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success(total));
    }
    
    @PostMapping
    @PreAuthorize("hasRole('LIBRARIAN')")
    public ResponseEntity<ApiResponse<FeeDTO>> createFee(
            @RequestParam Long userId,
            @RequestParam String type,
            @RequestParam BigDecimal amount,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) Long loanId) {
        FeeDTO fee = feeService.createFee(userId, type, amount, description, loanId);
        return ResponseEntity.ok(ApiResponse.success("Fee created successfully", fee));
    }
    
    @PostMapping("/{id}/pay")
    @PreAuthorize("hasRole('LIBRARIAN')")
    public ResponseEntity<ApiResponse<FeeDTO>> markAsPaid(@PathVariable Long id) {
        FeeDTO fee = feeService.markAsPaid(id);
        return ResponseEntity.ok(ApiResponse.success("Fee marked as paid", fee));
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('LIBRARIAN')")
    public ResponseEntity<ApiResponse<Void>> deleteFee(@PathVariable Long id) {
        feeService.deleteFee(id);
        return ResponseEntity.ok(ApiResponse.success("Fee deleted successfully", null));
    }
}
