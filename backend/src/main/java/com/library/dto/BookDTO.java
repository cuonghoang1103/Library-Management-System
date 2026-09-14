package com.library.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;

@Data
@Builder
public class BookDTO {
    private Long id;
    
    @NotBlank(message = "Title is required")
    private String title;
    
    private String description;
    
    @NotBlank(message = "Author is required")
    private String author;
    
    private String isbn;
    private String publisher;
    private LocalDate publishedDate;
    private String genre;
    private int totalCopies;
    private int availableCopies;
}
