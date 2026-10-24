package com.menyushka.support;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

import java.time.Instant;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.MockMvcBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.menyushka.auth.AuthService;
import com.menyushka.domain.User;
import com.menyushka.repository.UserRepository;
import com.menyushka.security.JwtService;

/**
 * Все запросы MockMvc идут от имени тестового клиента: в базе создаётся пользователь,
 * его JWT добавляется заголовком Authorization ко всем запросам.
 */
@TestConfiguration
public class TestAuthConfig {

    static final String TEST_EMAIL = "tester@menyushka.test";

    @Bean
    MockMvcBuilderCustomizer bearerTestClient(UserRepository users, JwtService jwt, PasswordEncoder encoder) {
        User user = users.findByEmailIgnoreCase(TEST_EMAIL).orElseGet(() -> users.save(User.builder()
                .email(TEST_EMAIL)
                .name("Тестовый клиент")
                .passwordHash(encoder.encode("test-password"))
                .role(AuthService.ROLE_CLIENT)
                .blocked(false)
                .createdAt(Instant.now())
                .build()));
        String header = "Bearer " + jwt.issue(user);
        return builder -> builder.defaultRequest(get("/").header("Authorization", header));
    }
}
