package com.library.repository;

import com.library.entity.BookCopy;
import com.library.entity.CopyStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookCopyRepository extends JpaRepository<BookCopy, Long> {
    
    List<BookCopy> findByBookId(Long bookId);
    
    List<BookCopy> findByStatus(CopyStatus status);
    
    Optional<BookCopy> findByBookIdAndCopyNumber(Long bookId, String copyNumber);
    
    @Query("SELECT bc FROM BookCopy bc WHERE bc.status = :status AND bc.book.id = :bookId")
    List<BookCopy> findAvailableCopiesByBookId(@Param("bookId") Long bookId, @Param("status") CopyStatus status);
    
    @Modifying
    @Query("UPDATE BookCopy bc SET bc.status = :status WHERE bc.id = :copyId")
    void updateStatus(@Param("copyId") Long copyId, @Param("status") CopyStatus status);
    
    @Query("SELECT COUNT(bc) FROM BookCopy bc WHERE bc.book.id = :bookId AND bc.status = 'ON_SHELF'")
    int countAvailableCopies(@Param("bookId") Long bookId);
}
