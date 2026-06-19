package com.pai2026.backend.user.api;

import com.pai2026.backend.service.JwtService;
import com.pai2026.backend.user.api.dto.AuthPayload;
import com.pai2026.backend.user.api.dto.LoginInput;
import com.pai2026.backend.user.api.dto.UserDto;
import com.pai2026.backend.user.domain.User;
import com.pai2026.backend.user.repository.UserRepository;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;

@Controller
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @MutationMapping
    public AuthPayload login(@Argument LoginInput input) {
        User user = userRepository.findByUsername(input.email())
                .orElseThrow(() -> new IllegalArgumentException("Nieprawidłowy email lub hasło."));

        if (!passwordEncoder.matches(input.password(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Nieprawidłowy email lub hasło.");
        }

        String token = jwtService.generateToken(user.getUsername());
        
        // Expose username prefix as the name
        String name = user.getUsername().split("@")[0];
        name = name.substring(0, 1).toUpperCase() + name.substring(1);

        UserDto userDto = new UserDto(
                user.getId().toString(),
                name,
                user.getUsername()
        );

        return new AuthPayload(token, userDto);
    }
}
