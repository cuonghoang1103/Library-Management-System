package com.library.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.library.dto.BookDTO;
import com.library.dto.CopyDTO;
import com.library.entity.CopyStatus;
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
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class BookControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String librarianToken;
    private String memberToken;
    private User librarian;
    private User member;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();

        librarian = User.builder()
                .username("librarian")
                .password(passwordEncoder.encode("librarian123"))
                .fullName("Library Admin")
                .email("librarian@example.com")
                .role(Role.LIBRARIAN)
                .active(true)
                .build();
        userRepository.save(librarian);

        member = User.builder()
                .username("john_doe")
                .password(passwordEncoder.encode("password123"))
                .fullName("John Doe")
                .email("john@example.com")
                .role(Role.MEMBER)
                .active(true)
                .build();
        userRepository.save(member);

        librarianToken = "Bearer " + tokenProvider.generateTokenFromUsername("librarian");
        memberToken = "Bearer " + tokenProvider.generateTokenFromUsername("john_doe");
    }

    @Nested
    @DisplayName("GET /api/books Tests")
    class GetBooksTests {

        @Test
        @DisplayName("Should return paginated books")
        void shouldReturnPaginatedBooks() throws Exception {
            mockMvc.perform(get("/api/books")
                            .header("Authorization", memberToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content").isArray());
        }

        @Test
        @DisplayName("Should return 401 when not authenticated")
        void shouldReturn401WhenNotAuthenticated() throws Exception {
            mockMvc.perform(get("/api/books"))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("POST /api/books Tests")
    class CreateBookTests {

        @Test
        @DisplayName("Should create book successfully as librarian")
        void shouldCreateBookSuccessfullyAsLibrarian() throws Exception {
            BookDTO bookDTO = BookDTO.builder()
                    .title("Test Book")
                    .description("Test Description")
                    .author("Test Author")
                    .isbn("1234567890")
                    .publisher("Test Publisher")
                    .genre("Technology")
                    .build();

            mockMvc.perform(post("/api/books")
                            .header("Authorization", librarianToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(bookDTO)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Book created successfully"))
                    .andExpect(jsonPath("$.data.title").value("Test Book"))
                    .andExpect(jsonPath("$.data.author").value("Test Author"));
        }

        @Test
        @DisplayName("Should create book with initial copies")
        void shouldCreateBookWithInitialCopies() throws Exception {
            BookDTO bookDTO = BookDTO.builder()
                    .title("Book with Copies")
                    .description("Test Description")
                    .author("Test Author")
                    .isbn("0987654321")
                    .genre("Fiction")
                    .totalCopies(3)
                    .build();

            mockMvc.perform(post("/api/books")
                            .header("Authorization", librarianToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(bookDTO)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.totalCopies").value(3))
                    .andExpect(jsonPath("$.data.availableCopies").value(3));
        }

        @Test
        @DisplayName("Should return 403 when member tries to create book")
        void shouldReturn403WhenMemberTriesToCreateBook() throws Exception {
            BookDTO bookDTO = BookDTO.builder()
                    .title("Test Book")
                    .author("Test Author")
                    .build();

            mockMvc.perform(post("/api/books")
                            .header("Authorization", memberToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(bookDTO)))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Should return 400 when required fields are missing")
        void shouldReturn400WhenRequiredFieldsMissing() throws Exception {
            BookDTO bookDTO = BookDTO.builder()
                    .description("Only description")
                    .build();

            mockMvc.perform(post("/api/books")
                            .header("Authorization", librarianToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(bookDTO)))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("PUT /api/books/{id} Tests")
    class UpdateBookTests {

        @Test
        @DisplayName("Should update book successfully")
        void shouldUpdateBookSuccessfully() throws Exception {
            // Create a book first
            BookDTO createDTO = BookDTO.builder()
                    .title("Original Title")
                    .author("Original Author")
                    .build();

            MvcResult result = mockMvc.perform(post("/api/books")
                            .header("Authorization", librarianToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(createDTO)))
                    .andExpect(status().isOk())
                    .andReturn();

            Long bookId = objectMapper.readTree(
                    result.getResponse().getContentAsString()).get("data").get("id").asLong();

            // Update the book
            BookDTO updateDTO = BookDTO.builder()
                    .title("Updated Title")
                    .author("Updated Author")
                    .description("Updated Description")
                    .build();

            mockMvc.perform(put("/api/books/" + bookId)
                            .header("Authorization", librarianToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(updateDTO)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.title").value("Updated Title"))
                    .andExpect(jsonPath("$.data.author").value("Updated Author"));
        }

        @Test
        @DisplayName("Should return 404 when updating non-existent book")
        void shouldReturn404WhenUpdatingNonExistentBook() throws Exception {
            BookDTO updateDTO = BookDTO.builder()
                    .title("Updated Title")
                    .author("Updated Author")
                    .build();

            mockMvc.perform(put("/api/books/99999")
                            .header("Authorization", librarianToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(updateDTO)))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("DELETE /api/books/{id} Tests")
    class DeleteBookTests {

        @Test
        @DisplayName("Should delete book successfully")
        void shouldDeleteBookSuccessfully() throws Exception {
            // Create a book first
            BookDTO createDTO = BookDTO.builder()
                    .title("Book to Delete")
                    .author("Author")
                    .build();

            MvcResult result = mockMvc.perform(post("/api/books")
                            .header("Authorization", librarianToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(createDTO)))
                    .andExpect(status().isOk())
                    .andReturn();

            Long bookId = objectMapper.readTree(
                    result.getResponse().getContentAsString()).get("data").get("id").asLong();

            // Delete the book
            mockMvc.perform(delete("/api/books/" + bookId)
                            .header("Authorization", librarianToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.message").value("Book deleted successfully"));

            // Verify it's deleted
            mockMvc.perform(get("/api/books/" + bookId)
                            .header("Authorization", librarianToken))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("Should return 403 when member tries to delete book")
        void shouldReturn403WhenMemberTriesToDeleteBook() throws Exception {
            mockMvc.perform(delete("/api/books/1")
                            .header("Authorization", memberToken))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("Book Search Tests")
    class BookSearchTests {

        @Test
        @DisplayName("Should search books by query")
        void shouldSearchBooksByQuery() throws Exception {
            // Create a book first
            BookDTO createDTO = BookDTO.builder()
                    .title("Java Programming")
                    .author("John Smith")
                    .build();

            mockMvc.perform(post("/api/books")
                            .header("Authorization", librarianToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(createDTO)))
                    .andExpect(status().isOk());

            // Search for the book
            mockMvc.perform(get("/api/books/search")
                            .header("Authorization", memberToken)
                            .param("q", "Java"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }
    }

    @Nested
    @DisplayName("Copy Management Tests")
    class CopyManagementTests {

        @Test
        @DisplayName("Should add copy to book")
        void shouldAddCopyToBook() throws Exception {
            // Create a book first
            BookDTO bookDTO = BookDTO.builder()
                    .title("Book with Copies")
                    .author("Author")
                    .genre("Fiction")
                    .build();

            MvcResult result = mockMvc.perform(post("/api/books")
                            .header("Authorization", librarianToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(bookDTO)))
                    .andExpect(status().isOk())
                    .andReturn();

            Long bookId = objectMapper.readTree(
                    result.getResponse().getContentAsString()).get("data").get("id").asLong();

            // Add a copy
            CopyDTO copyDTO = CopyDTO.builder()
                    .copyNumber("BK-" + bookId + "-1")
                    .status(CopyStatus.ON_SHELF)
            .location("A-01-01")
                    .build();

            mockMvc.perform(post("/api/books/" + bookId + "/copies")
                            .header("Authorization", librarianToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(copyDTO)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.copyNumber").value("BK-" + bookId + "-1"))
                    .andExpect(jsonPath("$.data.status").value("ON_SHELF"));
        }

        @Test
        @DisplayName("Should get copies by book ID")
        void shouldGetCopiesByBookId() throws Exception {
            // Create a book with copies
            BookDTO bookDTO = BookDTO.builder()
                    .title("Book with Copies")
                    .author("Author")
                    .genre("Fiction")
                    .totalCopies(2)
                    .build();

            MvcResult result = mockMvc.perform(post("/api/books")
                            .header("Authorization", librarianToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(bookDTO)))
                    .andExpect(status().isOk())
                    .andReturn();

            Long bookId = objectMapper.readTree(
                    result.getResponse().getContentAsString()).get("data").get("id").asLong();

            // Get copies
            mockMvc.perform(get("/api/books/" + bookId + "/copies")
                            .header("Authorization", memberToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data").isArray());
        }
    }
}
