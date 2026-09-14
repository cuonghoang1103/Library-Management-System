package com.library.repository;

import com.library.entity.Book;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface BookRepository extends JpaRepository<Book, Long> {
    
    @Query(value = """
        SELECT * FROM books 
        WHERE to_tsvector('english', 
            coalesce(title, '') || ' ' || 
            coalesce(author, '') || ' ' || 
            coalesce(description, '') || ' ' || 
            coalesce(genre, '')
        ) @@ plainto_tsquery('english', :query)
        """, 
        countQuery = """
        SELECT count(*) FROM books 
        WHERE to_tsvector('english', 
            coalesce(title, '') || ' ' || 
            coalesce(author, '') || ' ' || 
            coalesce(description, '') || ' ' || 
            coalesce(genre, '')
        ) @@ plainto_tsquery('english', :query)
        """,
        nativeQuery = true)
    Page<Book> fullTextSearch(@Param("query") String query, Pageable pageable);
    
    Page<Book> findByAuthorContainingIgnoreCase(String author, Pageable pageable);
    
    Page<Book> findByGenreContainingIgnoreCase(String genre, Pageable pageable);
    
    @Query("SELECT b FROM Book b WHERE LOWER(b.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(b.author) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<Book> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);
}
