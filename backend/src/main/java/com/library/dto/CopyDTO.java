package com.library.dto;

import com.library.entity.CopyStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CopyDTO {
    private Long id;
    private Long bookId;
    private String bookTitle;
    
    @NotBlank(message = "Copy number is required")
    private String copyNumber;
    
    @NotNull(message = "Status is required")
    private CopyStatus status;
    
    private String location;
    private String notes;
}
