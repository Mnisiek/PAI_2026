package com.pai2026.backend.user.service;

import com.pai2026.backend.user.domain.User;
import com.pai2026.backend.user.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DemoUserSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DemoUserSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        userRepository.findByUsername("jan@example.com").ifPresentOrElse(
            user -> {
                if (!"ADMIN".equals(user.getRole())) {
                    user.setRole("ADMIN");
                    userRepository.save(user);
                }
            },
            () -> {
                User adminUser = new User("jan@example.com", passwordEncoder.encode("demo1234"), "ADMIN");
                userRepository.save(adminUser);
            }
        );
        userRepository.findByUsername("adam@example.com").ifPresentOrElse(
            user -> {
                if (!"CUSTOMER".equals(user.getRole())) {
                    user.setRole("CUSTOMER");
                    userRepository.save(user);
                }
            },
            () -> {
                User customerUser = new User("adam@example.com", passwordEncoder.encode("demo1234"), "CUSTOMER");
                userRepository.save(customerUser);
            }
        );
    }
}
