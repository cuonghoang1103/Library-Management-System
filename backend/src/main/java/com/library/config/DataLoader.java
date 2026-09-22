package com.library.config;

import com.library.entity.Role;
import com.library.entity.User;
import com.library.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import java.security.SecureRandom;
import java.util.Base64;

@Slf4j
@Component
@Profile("!test")   // do not seed demo data when running tests
public class DataLoader implements CommandLineRunner {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String LIBRARIAN_USERNAME = "librarian";
    private static final String MEMBER_USERNAME = "member";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String librarianPassword;
    private final String memberPassword;

    public DataLoader(UserRepository userRepository, PasswordEncoder passwordEncoder,
                      @Value("${app.seed.librarian-password:}") String librarianPassword,
                      @Value("${app.seed.member-password:}") String memberPassword) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.librarianPassword = librarianPassword;
        this.memberPassword = memberPassword;
    }

    @Override
    public void run(String... args) {
        // Seed Librarian if not exists
        if (!userRepository.existsByUsername(LIBRARIAN_USERNAME)) {
            User librarian = User.builder()
                .username(LIBRARIAN_USERNAME)
                .password(passwordEncoder.encode(seedPassword(LIBRARIAN_USERNAME, librarianPassword)))
                .fullName("Nguyen Van Librarian")
                .email("librarian@library.com")
                .phoneNumber("0901234567")
                .role(Role.LIBRARIAN)
                .active(true)
                .build();
            userRepository.save(librarian);
            System.out.println("Created librarian user");
        }

        // Seed Member if not exists
        if (!userRepository.existsByUsername(MEMBER_USERNAME)) {
            User member = User.builder()
                .username(MEMBER_USERNAME)
                .password(passwordEncoder.encode(seedPassword(MEMBER_USERNAME, memberPassword)))
                .fullName("John Doe")
                .email("member@example.com")
                .phoneNumber("0901111111")
                .role(Role.MEMBER)
                .active(true)
                .build();
            userRepository.save(member);
            System.out.println("Created member user");
        }
    }

    /**
     * Uses the configured seed password; if none is set, generates a random one (development only).
     */
    private String seedPassword(String username, String configured) {
        if (StringUtils.hasText(configured)) {
            return configured;
        }
        byte[] bytes = new byte[12];
        RANDOM.nextBytes(bytes);
        String generated = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        log.warn("No password configured for seed user '{}' - generated one for development use: {}", username, generated);
        return generated;
    }
}
