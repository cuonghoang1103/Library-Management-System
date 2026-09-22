package com.library.service;

import com.library.dto.UserDTO;
import com.library.entity.Role;
import com.library.entity.User;
import com.library.exception.BadRequestException;
import com.library.exception.ResourceNotFoundException;
import com.library.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    private User testUser;
    private UserDTO testUserDTO;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .username("john_doe")
                .password("encodedPassword")
                .fullName("John Doe")
                .email("john@example.com")
                .phoneNumber("1234567890")
                .role(Role.MEMBER)
                .active(true)
                .createdAt(LocalDateTime.now())
                .build();

        testUserDTO = UserDTO.builder()
                .username("john_doe")
                .password("secret123")
                .fullName("John Doe")
                .email("john@example.com")
                .phoneNumber("1234567890")
                .role(Role.MEMBER)
                .active(true)
                .build();
    }

    @Nested
    @DisplayName("getAllUsers Tests")
    class GetAllUsersTests {

        @Test
        @DisplayName("Should return paginated users")
        void shouldReturnPaginatedUsers() {
            List<User> users = List.of(testUser);
            Page<User> userPage = new PageImpl<>(users, PageRequest.of(0, 10), 1);
            when(userRepository.findAll(any(Pageable.class))).thenReturn(userPage);

            Page<UserDTO> result = userService.getAllUsers(PageRequest.of(0, 10));

            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getUsername()).isEqualTo("john_doe");
        }

        @Test
        @DisplayName("Should return empty page when no users")
        void shouldReturnEmptyPageWhenNoUsers() {
            Page<User> emptyPage = new PageImpl<>(List.of(), PageRequest.of(0, 10), 0);
            when(userRepository.findAll(any(Pageable.class))).thenReturn(emptyPage);

            Page<UserDTO> result = userService.getAllUsers(PageRequest.of(0, 10));

            assertThat(result.getContent()).isEmpty();
        }
    }

    @Nested
    @DisplayName("getUserById Tests")
    class GetUserByIdTests {

        @Test
        @DisplayName("Should return user when exists")
        void shouldReturnUserWhenExists() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

            UserDTO result = userService.getUserById(1L);

            assertThat(result.getId()).isEqualTo(1L);
            assertThat(result.getUsername()).isEqualTo("john_doe");
            assertThat(result.getFullName()).isEqualTo("John Doe");
        }

        @Test
        @DisplayName("Should throw exception when user not found")
        void shouldThrowExceptionWhenUserNotFound() {
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> userService.getUserById(999L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User not found");
        }
    }

    @Nested
    @DisplayName("getUserByUsername Tests")
    class GetUserByUsernameTests {

        @Test
        @DisplayName("Should return user when username exists")
        void shouldReturnUserWhenUsernameExists() {
            when(userRepository.findByUsername("john_doe")).thenReturn(Optional.of(testUser));

            UserDTO result = userService.getUserByUsername("john_doe");

            assertThat(result.getUsername()).isEqualTo("john_doe");
        }

        @Test
        @DisplayName("Should throw exception when username not found")
        void shouldThrowExceptionWhenUsernameNotFound() {
            when(userRepository.findByUsername("unknown")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> userService.getUserByUsername("unknown"))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User not found");
        }
    }

    @Nested
    @DisplayName("createUser Tests")
    class CreateUserTests {

        @Test
        @DisplayName("Should create user successfully")
        void shouldCreateUserSuccessfully() {
            when(userRepository.existsByUsername("john_doe")).thenReturn(false);
            when(userRepository.existsByEmail("john@example.com")).thenReturn(false);
            when(passwordEncoder.encode(any())).thenReturn("encodedPassword");
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
                User user = invocation.getArgument(0);
                user.setId(1L);
                return user;
            });

            UserDTO result = userService.createUser(testUserDTO);

            assertThat(result.getId()).isEqualTo(1L);
            assertThat(result.getUsername()).isEqualTo("john_doe");
            verify(userRepository, times(1)).save(any(User.class));
        }

        @Test
        @DisplayName("Should throw exception when username already exists")
        void shouldThrowExceptionWhenUsernameExists() {
            when(userRepository.existsByUsername("john_doe")).thenReturn(true);

            assertThatThrownBy(() -> userService.createUser(testUserDTO))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Username already exists");
        }

        @Test
        @DisplayName("Should throw exception when email already exists")
        void shouldThrowExceptionWhenEmailExists() {
            when(userRepository.existsByUsername("john_doe")).thenReturn(false);
            when(userRepository.existsByEmail("john@example.com")).thenReturn(true);

            assertThatThrownBy(() -> userService.createUser(testUserDTO))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Email already exists");
        }
    }

    @Nested
    @DisplayName("updateUser Tests")
    class UpdateUserTests {

        @Test
        @DisplayName("Should update user successfully")
        void shouldUpdateUserSuccessfully() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(userRepository.save(any(User.class))).thenReturn(testUser);

            UserDTO updateDTO = UserDTO.builder()
                    .username("john_doe")
                    .fullName("John Updated")
                    .email("john_updated@example.com")
                    .phoneNumber("0987654321")
                    .role(Role.MEMBER)
                    .active(true)
                    .build();

            UserDTO result = userService.updateUser(1L, updateDTO);

            assertThat(result.getFullName()).isEqualTo("John Updated");
            verify(userRepository, times(1)).save(any(User.class));
        }

        @Test
        @DisplayName("Should update password when provided")
        void shouldUpdatePasswordWhenProvided() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(passwordEncoder.encode("newPassword123")).thenReturn("encodedNewPassword");
            when(userRepository.save(any(User.class))).thenReturn(testUser);

            UserDTO updateDTO = UserDTO.builder()
                    .username("john_doe")
                    .fullName("John Doe")
                    .email("john@example.com")
                    .role(Role.MEMBER)
                    .active(true)
                    .password("newPassword123")
                    .build();

            userService.updateUser(1L, updateDTO);

            verify(passwordEncoder, times(1)).encode("newPassword123");
        }

        @Test
        @DisplayName("Should not update password when not provided")
        void shouldNotUpdatePasswordWhenNotProvided() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(userRepository.save(any(User.class))).thenReturn(testUser);

            UserDTO updateDTO = UserDTO.builder()
                    .username("john_doe")
                    .fullName("John Doe")
                    .email("john@example.com")
                    .role(Role.MEMBER)
                    .active(true)
                    .build();

            userService.updateUser(1L, updateDTO);

            verify(passwordEncoder, never()).encode(any());
        }

        @Test
        @DisplayName("Should throw exception when updating non-existent user")
        void shouldThrowExceptionWhenUpdatingNonExistentUser() {
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> userService.updateUser(999L, testUserDTO))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("deleteUser Tests")
    class DeleteUserTests {

        @Test
        @DisplayName("Should delete user successfully")
        void shouldDeleteUserSuccessfully() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            doNothing().when(userRepository).delete(testUser);

            userService.deleteUser(1L);

            verify(userRepository, times(1)).delete(testUser);
        }

        @Test
        @DisplayName("Should throw exception when deleting non-existent user")
        void shouldThrowExceptionWhenDeletingNonExistentUser() {
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> userService.deleteUser(999L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("toggleUserStatus Tests")
    class ToggleUserStatusTests {

        @Test
        @DisplayName("Should toggle user status from active to inactive")
        void shouldToggleUserStatusFromActiveToInactive() {
            testUser.setActive(true);
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(userRepository.save(any(User.class))).thenReturn(testUser);

            UserDTO result = userService.toggleUserStatus(1L);

            assertThat(testUser.isActive()).isFalse();
            verify(userRepository, times(1)).save(testUser);
        }

        @Test
        @DisplayName("Should toggle user status from inactive to active")
        void shouldToggleUserStatusFromInactiveToActive() {
            testUser.setActive(false);
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(userRepository.save(any(User.class))).thenReturn(testUser);

            userService.toggleUserStatus(1L);

            assertThat(testUser.isActive()).isTrue();
        }

        @Test
        @DisplayName("Should throw exception when toggling non-existent user")
        void shouldThrowExceptionWhenTogglingNonExistentUser() {
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> userService.toggleUserStatus(999L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }
}
