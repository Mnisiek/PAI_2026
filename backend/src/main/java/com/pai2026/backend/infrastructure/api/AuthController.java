package com.pai2026.backend.infrastructure.api;

import graphql.GraphQLError;
import graphql.GraphqlErrorBuilder;
import com.pai2026.backend.infrastructure.service.JwtService;
import com.pai2026.backend.user.api.dto.AuthPayload;
import com.pai2026.backend.user.api.dto.LoginInput;
import com.pai2026.backend.user.api.dto.RegisterInput;
import com.pai2026.backend.user.api.dto.UserDto;
import com.pai2026.backend.user.domain.User;
import com.pai2026.backend.user.repository.UserRepository;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.GraphQlExceptionHandler;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;

import java.util.Locale;

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
        User user = userRepository.findByUsername(normalizeEmail(input.email()))
                .orElseThrow(() -> new IllegalArgumentException("Nieprawidłowy email lub hasło."));

        if (!passwordEncoder.matches(input.password(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Nieprawidłowy email lub hasło.");
        }

        String token = jwtService.generateToken(user.getUsername(), user.getRole());
        return new AuthPayload(token, toDto(user));
    }

    @MutationMapping
    public AuthPayload register(@Argument RegisterInput input) {
        String email = normalizeEmail(input.email());
        String password = requirePassword(input.password());

        if (userRepository.findByUsername(email).isPresent()) {
            throw new IllegalArgumentException("Konto z tym adresem email już istnieje.");
        }

        User user = new User(email, passwordEncoder.encode(password));
        User saved = userRepository.save(user);

        String token = jwtService.generateToken(saved.getUsername(), saved.getRole());
        return new AuthPayload(token, toDto(saved));
    }

    @QueryMapping
    public UserDto me() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        String username = authentication.getName();
        if (username == null || username.isBlank() || "anonymousUser".equals(username)) {
            return null;
        }
        return userRepository.findByUsername(username).map(this::toDto).orElse(null);
    }

    @GraphQlExceptionHandler(IllegalArgumentException.class)
    public GraphQLError handleIllegalArgument(IllegalArgumentException exception) {
        return GraphqlErrorBuilder.newError().message(exception.getMessage()).build();
    }

    /** Builds the public user DTO, deriving a display name from the email prefix. */
    private UserDto toDto(User user) {
        String name = user.getUsername().split("@")[0];
        name = name.substring(0, 1).toUpperCase() + name.substring(1);
        return new UserDto(user.getId().toString(), name, user.getUsername(), user.getRole());
    }

    private String normalizeEmail(String email) {
        if (email == null) {
            throw new IllegalArgumentException("Email jest wymagany.");
        }

        String normalized = email.trim().toLowerCase(Locale.ROOT);
        if (normalized.isBlank() || !normalized.contains("@")) {
            throw new IllegalArgumentException("Podaj poprawny adres email.");
        }

        return normalized;
    }

    private String requirePassword(String password) {
        if (password == null || password.isBlank()) {
            throw new IllegalArgumentException("Hasło jest wymagane.");
        }

        if (password.length() < 8) {
            throw new IllegalArgumentException("Hasło musi mieć co najmniej 8 znaków.");
        }

        return password;
    }
}
