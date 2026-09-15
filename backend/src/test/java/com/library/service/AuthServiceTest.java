package com.library.service;

import com.library.dto.AuthRequest;
import com.library.dto.AuthResponse;
import com.library.dto.UserDTO;
import com.library.entity.Role;
import com.library.entity.User;
import com.library.exception.BadRequestException;
import com.library.exception.ResourceNotFoundException;
import com.library.repository.UserRepository;
import com.library.security.CustomUserDetails;
import com.library.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtTokenProvider tokenProvider;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthService authService;

    private User testUser;
    private CustomUserDetails userDetails;

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

        userDetails = new CustomUserDetails(testUser);
    }

    @Nested
    @DisplayName("login Tests")
    class LoginTests {

        @Test
        @DisplayName("Should login successfully with valid credentials")
        void shouldLoginSuccessfullyWithValidCredentials() {
            AuthRequest request = AuthRequest.builder()
                    .username("john_doe")
                    .password("password123")
                    .build();

            Authentication authentication = new UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.getAuthorities());

            when(authenticationManager.authenticate(any())).thenReturn(authentication);
            when(tokenProvider.generateToken(authentication)).thenReturn("jwt-token-123");

            AuthResponse result = authService.login(request);

            assertThat(result.getToken()).isEqualTo("jwt-token-123");
            assertThat(result.getType()).isEqualTo("Bearer");
            assertThat(result.getUsername()).isEqualTo("john_doe");
            assertThat(result.getFullName()).isEqualTo("John Doe");
            assertThat(result.getRole()).isEqualTo("MEMBER");
        }

        @Test
        @DisplayName("Should throw exception with invalid credentials")
        void shouldThrowExceptionWithInvalidCredentials() {
            AuthRequest request = AuthRequest.builder()
                    .username("john_doe")
                    .password("wrongpassword")
                    .build();

            when(authenticationManager.authenticate(any()))
                    .thenThrow(new BadCredentialsException("Invalid credentials"));

            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(BadCredentialsException.class);
        }

        @Test
        @DisplayName("Should login librarian successfully")
        void shouldLoginLibrarianSuccessfully() {
            testUser.setRole(Role.LIBRARIAN);
            userDetails = new CustomUserDetails(testUser);

            AuthRequest request = AuthRequest.builder()
                    .username("librarian")
                    .password("librarian123")
                    .build();

            Authentication authentication = new UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.getAuthorities());

            when(authenticationManager.authenticate(any())).thenReturn(authentication);
            when(tokenProvider.generateToken(authentication)).thenReturn("jwt-token-librarian");

            AuthResponse result = authService.login(request);

            assertThat(result.getRole()).isEqualTo("LIBRARIAN");
        }
    }

    @Nested
    @DisplayName("getCurrentUser Tests")
    class GetCurrentUserTests {

        @Test
        @DisplayName("Should return current user successfully")
        void shouldReturnCurrentUserSuccessfully() {
            when(userRepository.findByUsername("john_doe")).thenReturn(Optional.of(testUser));

            UserDTO result = authService.getCurrentUser("john_doe");

            assertThat(result.getUsername()).isEqualTo("john_doe");
            assertThat(result.getFullName()).isEqualTo("John Doe");
            assertThat(result.getEmail()).isEqualTo("john@example.com");
            assertThat(result.getRole()).isEqualTo(Role.MEMBER);
        }

        @Test
        @DisplayName("Should throw exception when user not found")
        void shouldThrowExceptionWhenUserNotFound() {
            when(userRepository.findByUsername("unknown")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.getCurrentUser("unknown"))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User not found");
        }
    }

    @Nested
    @DisplayName("register Tests")
    class RegisterTests {

        @Test
        @DisplayName("Should register new user successfully")
        void shouldRegisterNewUserSuccessfully() {
            UserDTO newUserDTO = UserDTO.builder()
                    .username("new_user")
                    .password("password123")
                    .fullName("New User")
                    .email("new@example.com")
                    .role(Role.MEMBER)
                    .build();

            when(userRepository.existsByUsername("new_user")).thenReturn(false);
            when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
            when(passwordEncoder.encode("password123")).thenReturn("encodedPassword");
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
                User user = invocation.getArgument(0);
                user.setId(2L);
                return user;
            });

            UserDTO result = authService.register(newUserDTO);

            assertThat(result.getId()).isEqualTo(2L);
            assertThat(result.getUsername()).isEqualTo("new_user");
            assertThat(result.getFullName()).isEqualTo("New User");
            verify(userRepository, times(1)).save(any(User.class));
        }

        @Test
        @DisplayName("Should use default password when not provided")
        void shouldUseDefaultPasswordWhenNotProvided() {
            UserDTO newUserDTO = UserDTO.builder()
                    .username("new_user")
                    .fullName("New User")
                    .email("new@example.com")
                    .role(Role.MEMBER)
                    .build();

            when(userRepository.existsByUsername("new_user")).thenReturn(false);
            when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
            when(passwordEncoder.encode("password123")).thenReturn("encodedDefaultPassword");
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
                User user = invocation.getArgument(0);
                user.setId(2L);
                return user;
            });

            authService.register(newUserDTO);

            verify(passwordEncoder, times(1)).encode("password123");
        }

        @Test
        @DisplayName("Should throw exception when username already exists")
        void shouldThrowExceptionWhenUsernameExists() {
            UserDTO newUserDTO = UserDTO.builder()
                    .username("john_doe")
                    .fullName("New User")
                    .email("new@example.com")
                    .role(Role.MEMBER)
                    .build();

            when(userRepository.existsByUsername("john_doe")).thenReturn(true);

            assertThatThrownBy(() -> authService.register(newUserDTO))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Username already exists");
        }

        @Test
        @DisplayName("Should throw exception when email already exists")
        void shouldThrowExceptionWhenEmailExists() {
            UserDTO newUserDTO = UserDTO.builder()
                    .username("new_user")
                    .fullName("New User")
                    .email("john@example.com")
                    .role(Role.MEMBER)
                    .build();

            when(userRepository.existsByUsername("new_user")).thenReturn(false);
            when(userRepository.existsByEmail("john@example.com")).thenReturn(true);

            assertThatThrownBy(() -> authService.register(newUserDTO))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Email already exists");
        }
    }
}
