package com.library.repository;

import com.library.entity.Fee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FeeRepository extends JpaRepository<Fee, Long> {
    
    List<Fee> findByUserId(Long userId);
    
    List<Fee> findByUserIdAndPaidFalse(Long userId);
    
    @Query("SELECT SUM(f.amount) FROM Fee f WHERE f.user.id = :userId AND f.paid = false")
    java.math.BigDecimal sumUnpaidFeesByUserId(@Param("userId") Long userId);
    
    @Query("SELECT COUNT(f) FROM Fee f WHERE f.user.id = :userId AND f.paid = false")
    int countUnpaidFeesByUserId(@Param("userId") Long userId);
}
