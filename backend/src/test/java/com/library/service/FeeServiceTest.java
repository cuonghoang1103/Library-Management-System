package com.library.service;

import com.library.dto.FeeDTO;
import com.library.entity.Fee;
import com.library.entity.Loan;
import com.library.entity.Role;
import com.library.entity.User;
import com.library.exception.BadRequestException;
import com.library.exception.ResourceNotFoundException;
import com.library.repository.FeeRepository;
import com.library.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FeeServiceTest {

    @Mock
    private FeeRepository feeRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private FeeService feeService;

    private User testUser;
    private Loan testLoan;
    private Fee testFee;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .username("john_doe")
                .fullName("John Doe")
                .email("john@example.com")
                .role(Role.MEMBER)
                .active(true)
                .build();

        testLoan = Loan.builder()
                .id(1L)
                .user(testUser)
                .build();

        testFee = Fee.builder()
                .id(1L)
                .user(testUser)
                .loan(testLoan)
                .type("OVERDUE")
                .amount(new BigDecimal("5000"))
                .paid(false)
                .description("Overdue fee for book return")
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Nested
    @DisplayName("getFeesByUserId Tests")
    class GetFeesByUserIdTests {

        @Test
        @DisplayName("Should return fees for user")
        void shouldReturnFeesForUser() {
            when(feeRepository.findByUserId(1L)).thenReturn(List.of(testFee));

            List<FeeDTO> result = feeService.getFeesByUserId(1L);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getType()).isEqualTo("OVERDUE");
            assertThat(result.get(0).getAmount()).isEqualByComparingTo(new BigDecimal("5000"));
        }

        @Test
        @DisplayName("Should return empty list when no fees")
        void shouldReturnEmptyListWhenNoFees() {
            when(feeRepository.findByUserId(1L)).thenReturn(List.of());

            List<FeeDTO> result = feeService.getFeesByUserId(1L);

            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("getUnpaidFeesByUserId Tests")
    class GetUnpaidFeesByUserIdTests {

        @Test
        @DisplayName("Should return unpaid fees for user")
        void shouldReturnUnpaidFeesForUser() {
            when(feeRepository.findByUserIdAndPaidFalse(1L)).thenReturn(List.of(testFee));

            List<FeeDTO> result = feeService.getUnpaidFeesByUserId(1L);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).isPaid()).isFalse();
        }
    }

    @Nested
    @DisplayName("getTotalUnpaidFees Tests")
    class GetTotalUnpaidFeesTests {

        @Test
        @DisplayName("Should return total unpaid fees")
        void shouldReturnTotalUnpaidFees() {
            when(feeRepository.sumUnpaidFeesByUserId(1L)).thenReturn(new BigDecimal("15000"));

            BigDecimal result = feeService.getTotalUnpaidFees(1L);

            assertThat(result).isEqualByComparingTo(new BigDecimal("15000"));
        }

        @Test
        @DisplayName("Should return zero when no unpaid fees")
        void shouldReturnZeroWhenNoUnpaidFees() {
            when(feeRepository.sumUnpaidFeesByUserId(1L)).thenReturn(null);

            BigDecimal result = feeService.getTotalUnpaidFees(1L);

            assertThat(result).isEqualByComparingTo(BigDecimal.ZERO);
        }
    }

    @Nested
    @DisplayName("createFee Tests")
    class CreateFeeTests {

        @Test
        @DisplayName("Should create fee successfully")
        void shouldCreateFeeSuccessfully() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(feeRepository.save(any(Fee.class))).thenAnswer(invocation -> {
                Fee fee = invocation.getArgument(0);
                fee.setId(1L);
                return fee;
            });

            FeeDTO result = feeService.createFee(1L, "OVERDUE", new BigDecimal("5000"), "Test fee", null);

            assertThat(result.getId()).isEqualTo(1L);
            assertThat(result.getType()).isEqualTo("OVERDUE");
            assertThat(result.getAmount()).isEqualByComparingTo(new BigDecimal("5000"));
            verify(feeRepository, times(1)).save(any(Fee.class));
        }

        @Test
        @DisplayName("Should throw exception when user not found")
        void shouldThrowExceptionWhenUserNotFound() {
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> feeService.createFee(999L, "OVERDUE", new BigDecimal("5000"), "Test fee", null))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User not found");
        }
    }

    @Nested
    @DisplayName("markAsPaid Tests")
    class MarkAsPaidTests {

        @Test
        @DisplayName("Should mark fee as paid successfully")
        void shouldMarkFeeAsPaidSuccessfully() {
            when(feeRepository.findById(1L)).thenReturn(Optional.of(testFee));
            when(feeRepository.save(any(Fee.class))).thenReturn(testFee);

            FeeDTO result = feeService.markAsPaid(1L);

            assertThat(testFee.isPaid()).isTrue();
            assertThat(testFee.getPaidDate()).isNotNull();
            verify(feeRepository, times(1)).save(testFee);
        }

        @Test
        @DisplayName("Should throw exception when fee already paid")
        void shouldThrowExceptionWhenFeeAlreadyPaid() {
            testFee.setPaid(true);
            when(feeRepository.findById(1L)).thenReturn(Optional.of(testFee));

            assertThatThrownBy(() -> feeService.markAsPaid(1L))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("already paid");
        }

        @Test
        @DisplayName("Should throw exception when fee not found")
        void shouldThrowExceptionWhenFeeNotFound() {
            when(feeRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> feeService.markAsPaid(999L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Fee not found");
        }
    }

    @Nested
    @DisplayName("deleteFee Tests")
    class DeleteFeeTests {

        @Test
        @DisplayName("Should delete unpaid fee successfully")
        void shouldDeleteUnpaidFeeSuccessfully() {
            when(feeRepository.findById(1L)).thenReturn(Optional.of(testFee));
            doNothing().when(feeRepository).delete(testFee);

            feeService.deleteFee(1L);

            verify(feeRepository, times(1)).delete(testFee);
        }

        @Test
        @DisplayName("Should throw exception when trying to delete paid fee")
        void shouldThrowExceptionWhenDeletingPaidFee() {
            testFee.setPaid(true);
            when(feeRepository.findById(1L)).thenReturn(Optional.of(testFee));

            assertThatThrownBy(() -> feeService.deleteFee(1L))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Cannot delete a paid fee");
        }

        @Test
        @DisplayName("Should throw exception when fee not found")
        void shouldThrowExceptionWhenFeeNotFound() {
            when(feeRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> feeService.deleteFee(999L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }
}
