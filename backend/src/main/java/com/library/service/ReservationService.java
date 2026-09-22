package com.library.service;

import com.library.dto.ReservationDTO;
import com.library.entity.*;
import com.library.exception.BadRequestException;
import com.library.exception.ResourceNotFoundException;
import com.library.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final BookCopyRepository copyRepository;

    /**
     * Create a new reservation
     */
    @Transactional
    public ReservationDTO createReservation(Long bookId, Long userId) {
        Book book = bookRepository.findById(bookId)
            .orElseThrow(() -> new ResourceNotFoundException("Book not found"));

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getRole() != Role.MEMBER) {
            throw new BadRequestException("Only members can make reservations");
        }

        // Check if user already has active reservation for this book
        List<Reservation.ReservationStatus> activeStatuses = List.of(
            Reservation.ReservationStatus.WAITING,
            Reservation.ReservationStatus.READY
        );
        
        if (reservationRepository.findByUserIdAndBookIdAndStatusIn(userId, bookId, activeStatuses).isPresent()) {
            throw new BadRequestException("You already have an active reservation for this book");
        }

        // Check if user already has max reservations (limit to 3)
        List<Reservation> userActiveReservations = reservationRepository.findActiveReservationsByUserId(userId);
        if (userActiveReservations.size() >= 3) {
            throw new BadRequestException("Maximum reservation limit reached (3)");
        }

        // Create reservation
        Reservation reservation = Reservation.builder()
            .user(user)
            .book(book)
            .status(Reservation.ReservationStatus.WAITING)
            .expiresAt(LocalDateTime.now().plusDays(7))
            .build();

        return ReservationDTO.fromEntity(reservationRepository.save(reservation));
    }

    /**
     * Get user's active reservations
     */
    public List<ReservationDTO> getUserReservations(Long userId) {
        return reservationRepository.findActiveReservationsByUserId(userId).stream()
            .map(this::toDTOWithPosition)
            .collect(Collectors.toList());
    }

    /**
     * Get reservations for a book (for librarians)
     */
    public List<ReservationDTO> getBookReservations(Long bookId) {
        return reservationRepository.findByBookIdOrderByReservedAtAsc(bookId).stream()
            .map(this::toDTOWithPosition)
            .collect(Collectors.toList());
    }

    /**
     * Cancel a reservation
     */
    @Transactional
    public ReservationDTO cancelReservation(Long reservationId, Long userId) {
        Reservation reservation = reservationRepository.findById(reservationId)
            .orElseThrow(() -> new ResourceNotFoundException("Reservation not found"));
        User caller = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Check the caller's role, not the owner's: the owner or a librarian may cancel
        if (!reservation.getUser().getId().equals(userId) &&
            caller.getRole() != Role.LIBRARIAN) {
            throw new BadRequestException("You can only cancel your own reservations");
        }

        if (reservation.getStatus() == Reservation.ReservationStatus.FULFILLED ||
            reservation.getStatus() == Reservation.ReservationStatus.CANCELLED ||
            reservation.getStatus() == Reservation.ReservationStatus.EXPIRED) {
            throw new BadRequestException("Cannot cancel this reservation");
        }

        reservation.setStatus(Reservation.ReservationStatus.CANCELLED);
        return ReservationDTO.fromEntity(reservationRepository.save(reservation));
    }

    /**
     * Check for ready reservations when a book is returned
     * Called from LoanService when a copy becomes available
     */
    @Transactional
    public List<ReservationDTO> checkAndNotifyReadyReservations(Long bookId) {
        List<Reservation> waitingReservations = reservationRepository.findWaitingReservationsByBookId(bookId);
        
        if (waitingReservations.isEmpty()) {
            return List.of();
        }

        // Get first reservation
        Reservation firstReservation = waitingReservations.get(0);
        
        // Mark as ready and notify
        firstReservation.setStatus(Reservation.ReservationStatus.READY);
        firstReservation.setNotifiedAt(LocalDateTime.now());
        firstReservation.setExpiresAt(LocalDateTime.now().plusDays(3)); // 3 days to pick up
        
        reservationRepository.save(firstReservation);
        
        return List.of(ReservationDTO.fromEntity(firstReservation));
    }

    /**
     * Get all reservations for librarian dashboard
     */
    public List<ReservationDTO> getAllReservations() {
        return reservationRepository.findAll().stream()
            .map(this::toDTOWithPosition)
            .collect(Collectors.toList());
    }

    /**
     * Fulfill a reservation (when book is picked up)
     */
    @Transactional
    public ReservationDTO fulfillReservation(Long reservationId) {
        Reservation reservation = reservationRepository.findById(reservationId)
            .orElseThrow(() -> new ResourceNotFoundException("Reservation not found"));

        if (reservation.getStatus() != Reservation.ReservationStatus.READY) {
            throw new BadRequestException("Reservation is not in READY status");
        }

        reservation.setStatus(Reservation.ReservationStatus.FULFILLED);
        return ReservationDTO.fromEntity(reservationRepository.save(reservation));
    }

    /**
     * Mark expired reservations
     */
    @Transactional
    public int markExpiredReservations() {
        List<Reservation> expired = reservationRepository.findExpiredReservations(LocalDateTime.now());
        
        for (Reservation reservation : expired) {
            reservation.setStatus(Reservation.ReservationStatus.EXPIRED);
            reservationRepository.save(reservation);
        }
        
        return expired.size();
    }

    private ReservationDTO toDTOWithPosition(Reservation reservation) {
        ReservationDTO dto = ReservationDTO.fromEntity(reservation);
        
        if (reservation.getStatus() == Reservation.ReservationStatus.WAITING) {
            // Calculate position in queue
            List<Reservation> waiting = reservationRepository.findWaitingReservationsByBookId(reservation.getBook().getId());
            int position = 1;
            for (Reservation r : waiting) {
                if (r.getId().equals(reservation.getId())) {
                    dto.setPosition(position);
                    break;
                }
                position++;
            }
        }
        
        return dto;
    }
}
