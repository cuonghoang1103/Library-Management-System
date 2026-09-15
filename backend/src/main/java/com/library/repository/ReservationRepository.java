package com.library.repository;

import com.library.entity.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    List<Reservation> findByUserIdOrderByReservedAtDesc(Long userId);

    List<Reservation> findByBookIdOrderByReservedAtAsc(Long bookId);

    List<Reservation> findByStatusOrderByReservedAtAsc(Reservation.ReservationStatus status);

    @Query("SELECT r FROM Reservation r WHERE r.book.id = :bookId AND r.status = 'WAITING' ORDER BY r.reservedAt ASC")
    List<Reservation> findWaitingReservationsByBookId(@Param("bookId") Long bookId);

    @Query("SELECT r FROM Reservation r WHERE r.user.id = :userId AND r.status IN ('WAITING', 'READY') ORDER BY r.reservedAt DESC")
    List<Reservation> findActiveReservationsByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(r) FROM Reservation r WHERE r.book.id = :bookId AND r.status = 'WAITING'")
    long countWaitingByBookId(@Param("bookId") Long bookId);

    @Query("SELECT r FROM Reservation r WHERE r.status = 'WAITING' AND r.expiresAt < :now")
    List<Reservation> findExpiredReservations(@Param("now") java.time.LocalDateTime now);

    Optional<Reservation> findByUserIdAndBookIdAndStatusIn(
        Long userId,
        Long bookId,
        List<Reservation.ReservationStatus> statuses
    );
}
