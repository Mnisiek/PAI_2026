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
        if (userRepository.findByUsername("jan@example.com").isEmpty()) {
            User demoUser = new User("jan@example.com", passwordEncoder.encode("demo1234"));
            userRepository.save(demoUser);
        }
    }
}
