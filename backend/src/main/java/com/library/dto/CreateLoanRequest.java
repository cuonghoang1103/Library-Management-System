package com.library.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;

@Data
public class CreateLoanRequest {
    @NotNull(message = "User ID is required")
    private Long userId;
    
    @NotNull(message = "Copy ID is required")
    private Long copyId;
    
    private LocalDate dueDate; // Optional, defaults to 14 days from now
}
