package com.pai2026.backend.user.api;

import static org.mockito.Mockito.when;

import com.pai2026.backend.service.JwtService;
import com.pai2026.backend.user.domain.User;
import com.pai2026.backend.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.graphql.test.autoconfigure.GraphQlTest;
import org.springframework.graphql.test.tester.GraphQlTester;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.util.Optional;

@GraphQlTest(AuthController.class)
class AuthControllerTest {

    @Autowired
    GraphQlTester graphQlTester;

    @MockitoBean
    UserRepository userRepository;

    @MockitoBean
    PasswordEncoder passwordEncoder;

    @MockitoBean
    JwtService jwtService;

    @Test
    void loginMutationResolvesSuccessfully() {
        User user = new User("jan@example.com", "bcrypt_hash");
        user.setId(42L);

        when(userRepository.findByUsername("jan@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("demo1234", "bcrypt_hash")).thenReturn(true);
        when(jwtService.generateToken("jan@example.com")).thenReturn("mocked_jwt_token");

        String mutation = """
                mutation {
                  login(input: { email: "jan@example.com", password: "demo1234" }) {
                    token
                    user {
                      id
                      name
                      email
                    }
                  }
                }
                """;

        graphQlTester.document(mutation)
                .execute()
                .path("login.token").entity(String.class).isEqualTo("mocked_jwt_token")
                .path("login.user.id").entity(String.class).isEqualTo("42")
                .path("login.user.name").entity(String.class).isEqualTo("Jan")
                .path("login.user.email").entity(String.class).isEqualTo("jan@example.com");
    }
}
