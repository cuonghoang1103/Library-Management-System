package com.library.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.library.dto.AuthRequest;
import com.library.dto.AuthResponse;
import com.library.entity.Role;
import com.library.entity.User;
import com.library.repository.UserRepository;
import com.library.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    private User testMember;
    private User testLibrarian;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();

        testMember = User.builder()
                .username("john_doe")
                .password(passwordEncoder.encode("password123"))
                .fullName("John Doe")
                .email("john@example.com")
                .role(Role.MEMBER)
                .active(true)
                .build();
        userRepository.save(testMember);

        testLibrarian = User.builder()
                .username("librarian")
                .password(passwordEncoder.encode("librarian123"))
                .fullName("Library Admin")
                .email("librarian@example.com")
                .role(Role.LIBRARIAN)
                .active(true)
                .build();
        userRepository.save(testLibrarian);
    }

    @Nested
    @DisplayName("POST /api/auth/login Tests")
    class LoginTests {

        @Test
        @DisplayName("Should login successfully with valid member credentials")
        void shouldLoginSuccessfullyWithValidMemberCredentials() throws Exception {
            AuthRequest request = AuthRequest.builder()
                    .username("john_doe")
                    .password("password123")
                    .build();

            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Login successful"))
                    .andExpect(jsonPath("$.data.token").isNotEmpty())
                    .andExpect(jsonPath("$.data.type").value("Bearer"))
                    .andExpect(jsonPath("$.data.username").value("john_doe"))
                    .andExpect(jsonPath("$.data.fullName").value("John Doe"))
                    .andExpect(jsonPath("$.data.role").value("MEMBER"));
        }

        @Test
        @DisplayName("Should login successfully with valid librarian credentials")
        void shouldLoginSuccessfullyWithValidLibrarianCredentials() throws Exception {
            AuthRequest request = AuthRequest.builder()
                    .username("librarian")
                    .password("librarian123")
                    .build();

            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.role").value("LIBRARIAN"));
        }

        @Test
        @DisplayName("Should fail login with invalid password")
        void shouldFailLoginWithInvalidPassword() throws Exception {
            AuthRequest request = AuthRequest.builder()
                    .username("john_doe")
                    .password("wrongpassword")
                    .build();

            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.message").value("Invalid username or password"));
        }

        @Test
        @DisplayName("Should fail login with non-existent username")
        void shouldFailLoginWithNonExistentUsername() throws Exception {
            AuthRequest request = AuthRequest.builder()
                    .username("nonexistent")
                    .password("password123")
                    .build();

            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("Should fail login with missing username")
        void shouldFailLoginWithMissingUsername() throws Exception {
            AuthRequest request = AuthRequest.builder()
                    .password("password123")
                    .build();

            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("GET /api/auth/me Tests")
    class GetCurrentUserTests {

        @Test
        @DisplayName("Should return current user when authenticated")
        void shouldReturnCurrentUserWhenAuthenticated() throws Exception {
            String token = tokenProvider.generateTokenFromUsername("john_doe");

            mockMvc.perform(get("/api/auth/me")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.username").value("john_doe"))
                    .andExpect(jsonPath("$.data.fullName").value("John Doe"))
                    .andExpect(jsonPath("$.data.email").value("john@example.com"))
                    .andExpect(jsonPath("$.data.role").value("MEMBER"));
        }

        @Test
        @DisplayName("Should return 403 when accessing librarian endpoint as member")
        void shouldReturnForbiddenForMemberAccessingLibrarianEndpoint() throws Exception {
            String memberToken = tokenProvider.generateTokenFromUsername("john_doe");

            // Try to access user management (librarian only)
            mockMvc.perform(get("/api/users")
                            .header("Authorization", "Bearer " + memberToken))
                    .andExpect(status().isForbidden());
        }
    }
}
