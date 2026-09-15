package com.library.controller;

import com.library.dto.ApiResponse;
import com.library.dto.ReservationDTO;
import com.library.security.CustomUserDetails;
import com.library.service.ReservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/reservations")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationService reservationService;

    /**
     * Get current user's reservations
     */
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<ReservationDTO>>> getMyReservations(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<ReservationDTO> reservations = reservationService.getUserReservations(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success(reservations));
    }

    /**
     * Create a new reservation
     */
    @PostMapping("/book/{bookId}")
    public ResponseEntity<ApiResponse<ReservationDTO>> createReservation(
            @PathVariable Long bookId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        ReservationDTO reservation = reservationService.createReservation(bookId, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Book reserved successfully", reservation));
    }

    /**
     * Cancel a reservation
     */
    @DeleteMapping("/{reservationId}")
    public ResponseEntity<ApiResponse<Void>> cancelReservation(
            @PathVariable Long reservationId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        reservationService.cancelReservation(reservationId, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success("Reservation cancelled", null));
    }

    // Librarian endpoints

    /**
     * Get all reservations (librarian only)
     */
    @GetMapping
    @PreAuthorize("hasRole('LIBRARIAN')")
    public ResponseEntity<ApiResponse<List<ReservationDTO>>> getAllReservations() {
        List<ReservationDTO> reservations = reservationService.getAllReservations();
        return ResponseEntity.ok(ApiResponse.success(reservations));
    }

    /**
     * Get reservations for a specific book (librarian only)
     */
    @GetMapping("/book/{bookId}")
    @PreAuthorize("hasRole('LIBRARIAN')")
    public ResponseEntity<ApiResponse<List<ReservationDTO>>> getBookReservations(
            @PathVariable Long bookId) {
        List<ReservationDTO> reservations = reservationService.getBookReservations(bookId);
        return ResponseEntity.ok(ApiResponse.success(reservations));
    }

    /**
     * Fulfill a reservation (librarian only)
     */
    @PostMapping("/{reservationId}/fulfill")
    @PreAuthorize("hasRole('LIBRARIAN')")
    public ResponseEntity<ApiResponse<ReservationDTO>> fulfillReservation(
            @PathVariable Long reservationId) {
        ReservationDTO reservation = reservationService.fulfillReservation(reservationId);
        return ResponseEntity.ok(ApiResponse.success("Reservation fulfilled", reservation));
    }

    /**
     * Clean up expired reservations (librarian only)
     */
    @PostMapping("/cleanup")
    @PreAuthorize("hasRole('LIBRARIAN')")
    public ResponseEntity<ApiResponse<Integer>> cleanupExpiredReservations() {
        int count = reservationService.markExpiredReservations();
        return ResponseEntity.ok(ApiResponse.success(count + " reservations expired", count));
    }
}
