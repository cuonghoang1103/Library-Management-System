package com.library.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "books")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Book {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(nullable = false)
    private String author;
    
    @Column(name = "isbn", unique = true)
    private String isbn;
    
    @Column(name = "publisher")
    private String publisher;
    
    @Column(name = "published_date")
    private LocalDate publishedDate;
    
 @Column(name = "genre")
 private String genre;

 @Column(name = "cover_image", length = 500)
 private String coverImage;

 @Column(name = "language")
 private String language;

 @Column(name = "pages")
 private Integer pages;

 @Column(name = "total_copies", nullable = false)
 private int totalCopies = 0;
    
    @Column(name = "available_copies", nullable = false)
    private int availableCopies = 0;
    
    @OneToMany(mappedBy = "book", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<BookCopy> copies = new ArrayList<>();
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    public void updateAvailability() {
        this.availableCopies = (int) copies.stream()
            .filter(c -> c.getStatus() == CopyStatus.ON_SHELF)
            .count();
    }
}
