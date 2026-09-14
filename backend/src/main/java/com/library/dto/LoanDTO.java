package com.library.dto;

import com.library.entity.LoanStatus;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class LoanDTO {
    private Long id;
    private Long userId;
    private String userName;
    private Long copyId;
    private String copyNumber;
    private String bookTitle;
    private LocalDate borrowedDate;
    private LocalDate dueDate;
    private LocalDate returnedDate;
    private LoanStatus status;
    private int renewalCount;
    private long daysOverdue;
    private boolean canRenew;
    private LocalDateTime createdAt;
}
