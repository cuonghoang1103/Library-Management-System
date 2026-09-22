package com.library.service;

import com.library.dto.FeeDTO;
import com.library.entity.Fee;
import com.library.entity.Loan;
import com.library.entity.User;
import com.library.exception.BadRequestException;
import com.library.exception.ResourceNotFoundException;
import com.library.repository.FeeRepository;
import com.library.repository.LoanRepository;
import com.library.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FeeService {
    
    private final FeeRepository feeRepository;
    private final UserRepository userRepository;
    private final LoanRepository loanRepository;

    private static final long OVERDUE_FEE_PER_DAY = 1000; // 1000 VND per day
    
    public List<FeeDTO> getFeesByUserId(Long userId) {
        return feeRepository.findByUserId(userId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    public List<FeeDTO> getUnpaidFeesByUserId(Long userId) {
        return feeRepository.findByUserIdAndPaidFalse(userId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    public BigDecimal getTotalUnpaidFees(Long userId) {
        BigDecimal total = feeRepository.sumUnpaidFeesByUserId(userId);
        return total != null ? total : BigDecimal.ZERO;
    }
    
    @Transactional
    public FeeDTO createFee(Long userId, String type, BigDecimal amount, String description, Long loanId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Loan loan = loanId == null ? null : loanRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found"));
        
        Fee fee = Fee.builder()
                .user(user)
                .loan(loan)
                .type(type)
                .amount(amount)
                .description(description)
                .paid(false)
                .build();
        
        return toDTO(feeRepository.save(fee));
    }

    /**
     * Charges a loan returned late: daysOverdue x OVERDUE_FEE_PER_DAY, linked to that loan.
     */
    @Transactional
    public Fee createOverdueFee(Loan loan, long daysOverdue) {
        Fee fee = Fee.builder()
                .user(loan.getUser())
                .loan(loan)
                .type("OVERDUE")
                .amount(BigDecimal.valueOf(daysOverdue * OVERDUE_FEE_PER_DAY))
                .description("Returned " + daysOverdue + " day(s) late")
                .paid(false)
                .build();
        return feeRepository.save(fee);
    }
    
    @Transactional
    public FeeDTO markAsPaid(Long feeId) {
        Fee fee = feeRepository.findById(feeId)
                .orElseThrow(() -> new ResourceNotFoundException("Fee not found"));
        
        if (fee.isPaid()) {
            throw new BadRequestException("Fee is already paid");
        }
        
        fee.setPaid(true);
        fee.setPaidDate(LocalDateTime.now());
        
        return toDTO(feeRepository.save(fee));
    }
    
    @Transactional
    public void deleteFee(Long feeId) {
        Fee fee = feeRepository.findById(feeId)
                .orElseThrow(() -> new ResourceNotFoundException("Fee not found"));
        
        if (fee.isPaid()) {
            throw new BadRequestException("Cannot delete a paid fee");
        }
        
        feeRepository.delete(fee);
    }
    
    private FeeDTO toDTO(Fee fee) {
        return FeeDTO.builder()
                .id(fee.getId())
                .userId(fee.getUser().getId())
                .userName(fee.getUser().getFullName())
                .loanId(fee.getLoan() != null ? fee.getLoan().getId() : null)
                .type(fee.getType())
                .amount(fee.getAmount())
                .paid(fee.isPaid())
                .paidDate(fee.getPaidDate())
                .description(fee.getDescription())
                .createdAt(fee.getCreatedAt())
                .build();
    }
}
