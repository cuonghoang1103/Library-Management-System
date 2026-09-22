package com.library.service;

import com.library.dto.CreateLoanRequest;
import com.library.dto.LoanDTO;
import com.library.entity.*;
import com.library.exception.BadRequestException;
import com.library.exception.ResourceNotFoundException;
import com.library.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LoanService {
    
    private final LoanRepository loanRepository;
    private final BookCopyRepository copyRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    
    private static final int DEFAULT_LOAN_DAYS = 14;
    private static final int MAX_RENEWALS = 2;
    private static final long OVERDUE_FEE_PER_DAY = 1000; // 1000 VND per day
    
    public Page<LoanDTO> getAllLoans(Pageable pageable) {
        return loanRepository.findAll(pageable).map(this::toDTO);
    }
    
    public Page<LoanDTO> getLoansByUserId(Long userId, Pageable pageable) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return loanRepository.findByUserOrderByCreatedAtDesc(user, pageable).map(this::toDTO);
    }
    
    public LoanDTO getLoanById(Long id) {
        Loan loan = loanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found"));
        return toDTO(loan);
    }
    
    public List<LoanDTO> getActiveLoansByUserId(Long userId) {
        return loanRepository.findActiveLoansByUserId(userId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    public Page<LoanDTO> getOverdueLoans(Pageable pageable) {
        return loanRepository.findOverdueLoans(LocalDate.now(), pageable).map(this::toDTO);
    }
    
    /**
     * Create a new loan (borrow a book).
     * Uses partial unique index to prevent double-lending.
     */
    @Transactional
    public LoanDTO createLoan(CreateLoanRequest request) {
        // Validate copy is available
        BookCopy copy = copyRepository.findById(request.getCopyId())
                .orElseThrow(() -> new ResourceNotFoundException("Copy not found"));
        
        if (copy.getStatus() != CopyStatus.ON_SHELF) {
            throw new BadRequestException("Copy is not available for borrowing");
        }
        
        // Check if copy already has an active loan (partial unique index prevents this)
        Optional<Loan> existingLoan = loanRepository.findActiveLoanByCopyId(request.getCopyId());
        if (existingLoan.isPresent()) {
            throw new BadRequestException("Copy is already on loan");
        }
        
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        if (user.getRole() != Role.MEMBER) {
            throw new BadRequestException("Only members can borrow books");
        }
        
        LocalDate borrowedDate = LocalDate.now();
        LocalDate dueDate = request.getDueDate() != null ? 
                request.getDueDate() : borrowedDate.plusDays(DEFAULT_LOAN_DAYS);
        
        // Atomic: update copy status + create loan in one transaction
        copy.setStatus(CopyStatus.LOANED);
        copyRepository.save(copy);
        
        // Update book's available count
        Book book = copy.getBook();
        book.setAvailableCopies(book.getAvailableCopies() - 1);
        bookRepository.save(book);
        
        Loan loan = Loan.builder()
                .user(user)
                .copy(copy)
                .borrowedDate(borrowedDate)
                .dueDate(dueDate)
                .status(LoanStatus.ACTIVE)
                .renewalCount(0)
                .build();
        
        return toDTO(loanRepository.save(loan));
    }
    
    /**
     * Return a book - atomic operation that:
     * 1. Closes the loan (status CLOSED), whether it is returned on time or late
     * 2. Sets returned_date
     * 3. Changes copy status back to ON_SHELF
     */
    @Transactional
    public LoanDTO returnBook(Long loanId) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found"));
        
        if (loan.getStatus() == LoanStatus.RETURNED || loan.getStatus() == LoanStatus.CLOSED) {
            throw new BadRequestException("Loan has already been returned");
        }
        
        LocalDate returnedDate = LocalDate.now();
        
        // Calculate overdue fee if applicable
        if (returnedDate.isAfter(loan.getDueDate())) {
            long daysOverdue = java.time.temporal.ChronoUnit.DAYS.between(loan.getDueDate(), returnedDate);
            // Fee calculation would go here
        }
        
        // A returned loan is always CLOSED; "returned late" is derived from returnedDate > dueDate
        loan.setReturnedDate(returnedDate);
        loan.setStatus(LoanStatus.CLOSED);
        loan = loanRepository.save(loan);
        
        // Atomic: release copy back to shelf
        BookCopy copy = loan.getCopy();
        copy.setStatus(CopyStatus.ON_SHELF);
        copyRepository.save(copy);
        
        // Update book's available count
        Book book = copy.getBook();
        book.setAvailableCopies(book.getAvailableCopies() + 1);
        bookRepository.save(book);
        
        return toDTO(loan);
    }
    
    /**
     * Renew a loan - bounded by max renewals and cannot renew if overdue.
     */
    @Transactional
    public LoanDTO renewLoan(Long loanId) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found"));
        
        if (!loan.canRenew(MAX_RENEWALS)) {
            if (loan.getRenewalCount() >= MAX_RENEWALS) {
                throw new BadRequestException("Maximum renewal limit reached (" + MAX_RENEWALS + ")");
            }
            if (loan.isOverdue()) {
                throw new BadRequestException("Cannot renew overdue loan. Please return and pay any fees.");
            }
            throw new BadRequestException("Loan cannot be renewed");
        }
        
        loan.setRenewalCount(loan.getRenewalCount() + 1);
        loan.setDueDate(loan.getDueDate().plusDays(DEFAULT_LOAN_DAYS));
        
        return toDTO(loanRepository.save(loan));
    }
    
    /**
     * Get loan history for a specific copy.
     */
    public List<LoanDTO> getLoanHistoryByCopyId(Long copyId) {
        return loanRepository.findByCopyIdOrderByCreatedAtDesc(copyId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Derive overdue list from ACTIVE loans past their due date.
     * No background job needed - computed on demand.
     */
 public List<LoanDTO> getOverdueList() {
 return loanRepository.findOverdueLoans(LocalDate.now(), Pageable.unpaged()).stream()
 .map(this::toDTO)
 .collect(Collectors.toList());
 }

 /**
 * Self-service borrowing - members borrow a book directly
 */
 @Transactional
 public LoanDTO borrowBook(Long copyId, Long userId) {
 // Validate copy is available
 BookCopy copy = copyRepository.findById(copyId)
 .orElseThrow(() -> new ResourceNotFoundException("Copy not found"));

 if (copy.getStatus() != CopyStatus.ON_SHELF) {
 throw new BadRequestException("This copy is not available for borrowing");
 }

 // Check if copy already has an active loan
 Optional<Loan> existingLoan = loanRepository.findActiveLoanByCopyId(copyId);
 if (existingLoan.isPresent()) {
 throw new BadRequestException("This copy is already on loan");
 }

 // Validate user
 User user = userRepository.findById(userId)
 .orElseThrow(() -> new ResourceNotFoundException("User not found"));

 if (user.getRole() != Role.MEMBER) {
 throw new BadRequestException("Only members can borrow books");
 }

 LocalDate borrowedDate = LocalDate.now();
 LocalDate dueDate = borrowedDate.plusDays(DEFAULT_LOAN_DAYS);

 // Update copy status
 copy.setStatus(CopyStatus.LOANED);
 copyRepository.save(copy);

 // Update book's available count
 Book book = copy.getBook();
 book.setAvailableCopies(book.getAvailableCopies() - 1);
 bookRepository.save(book);

 // Create loan
 Loan loan = Loan.builder()
 .user(user)
 .copy(copy)
 .borrowedDate(borrowedDate)
 .dueDate(dueDate)
 .status(LoanStatus.ACTIVE)
 .renewalCount(0)
 .build();

 return toDTO(loanRepository.save(loan));
 }

 private LoanDTO toDTO(Loan loan) {
        boolean canRenew = loan.canRenew(MAX_RENEWALS);
        return LoanDTO.builder()
                .id(loan.getId())
                .userId(loan.getUser().getId())
                .userName(loan.getUser().getFullName())
                .copyId(loan.getCopy().getId())
                .copyNumber(loan.getCopy().getCopyNumber())
                .bookTitle(loan.getCopy().getBook().getTitle())
                .borrowedDate(loan.getBorrowedDate())
                .dueDate(loan.getDueDate())
                .returnedDate(loan.getReturnedDate())
                .status(loan.isOverdue() ? LoanStatus.OVERDUE : loan.getStatus())
                .renewalCount(loan.getRenewalCount())
                .daysOverdue(loan.getDaysOverdue())
                .canRenew(canRenew)
                .createdAt(loan.getCreatedAt())
                .build();
    }
}
