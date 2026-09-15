package com.library.config;

import com.library.entity.Role;
import com.library.entity.User;
import com.library.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataLoader implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataLoader(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        // Seed Librarian if not exists
        if (!userRepository.existsByUsername("librarian")) {
            User librarian = User.builder()
                .username("librarian")
                .password(passwordEncoder.encode("librarian123"))
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
        if (!userRepository.existsByUsername("member")) {
            User member = User.builder()
                .username("member")
                .password(passwordEncoder.encode("member123"))
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
}
