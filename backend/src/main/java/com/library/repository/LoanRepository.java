package com.library.repository;

import com.library.entity.Loan;
import com.library.entity.LoanStatus;
import com.library.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface LoanRepository extends JpaRepository<Loan, Long> {
    
    // Find active loan for a specific copy (uses partial unique index)
    @Query("SELECT l FROM Loan l WHERE l.copy.id = :copyId AND l.status IN ('ACTIVE', 'OVERDUE')")
    Optional<Loan> findActiveLoanByCopyId(@Param("copyId") Long copyId);
    
    // Check if copy is available (not currently loaned)
    @Query("SELECT CASE WHEN COUNT(l) > 0 THEN false ELSE true END FROM Loan l WHERE l.copy.id = :copyId AND l.status IN ('ACTIVE', 'OVERDUE')")
    boolean isCopyAvailable(@Param("copyId") Long copyId);
    
    // Find all loans for a user
    List<Loan> findByUserOrderByCreatedAtDesc(User user);
    
    Page<Loan> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);
    
    // Find loans by status
    List<Loan> findByStatus(LoanStatus status);
    
    Page<Loan> findByStatusOrderByDueDateAsc(LoanStatus status, Pageable pageable);
    
    // Find overdue loans
    @Query("SELECT l FROM Loan l WHERE l.status = 'ACTIVE' AND l.dueDate < :today")
    Page<Loan> findOverdueLoans(@Param("today") LocalDate today, Pageable pageable);
    
    // Find user's active loans
    @Query("SELECT l FROM Loan l WHERE l.user.id = :userId AND l.status IN ('ACTIVE', 'OVERDUE')")
    List<Loan> findActiveLoansByUserId(@Param("userId") Long userId);
    
    // Count user's active loans
    @Query("SELECT COUNT(l) FROM Loan l WHERE l.user.id = :userId AND l.status IN ('ACTIVE', 'OVERDUE')")
    int countActiveLoansByUserId(@Param("userId") Long userId);
    
    // Update loan status
    @Modifying
    @Query("UPDATE Loan l SET l.status = :status WHERE l.id = :loanId")
    void updateStatus(@Param("loanId") Long loanId, @Param("status") LoanStatus status);
    
    // Get loan history for a copy
    List<Loan> findByCopyIdOrderByCreatedAtDesc(Long copyId);
}
