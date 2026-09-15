package com.library.dto;

import com.library.entity.Reservation;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class ReservationDTO {
    private Long id;
    private Long userId;
    private String userName;
    private Long bookId;
    private String bookTitle;
    private String status;
    private LocalDateTime reservedAt;
    private LocalDateTime expiresAt;
    private LocalDateTime notifiedAt;
    private int position; // Position in waiting list

    public static ReservationDTO fromEntity(Reservation reservation) {
        return ReservationDTO.builder()
            .id(reservation.getId())
            .userId(reservation.getUser().getId())
            .userName(reservation.getUser().getFullName())
            .bookId(reservation.getBook().getId())
            .bookTitle(reservation.getBook().getTitle())
            .status(reservation.getStatus().name())
            .reservedAt(reservation.getReservedAt())
            .expiresAt(reservation.getExpiresAt())
            .notifiedAt(reservation.getNotifiedAt())
            .build();
    }
}
