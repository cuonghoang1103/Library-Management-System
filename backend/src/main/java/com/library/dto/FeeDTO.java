package com.library.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class FeeDTO {
    private Long id;
    private Long userId;
    private String userName;
    private Long loanId;
    private String type;
    private BigDecimal amount;
    private boolean paid;
    private LocalDateTime paidDate;
    private String description;
    private LocalDateTime createdAt;
}
