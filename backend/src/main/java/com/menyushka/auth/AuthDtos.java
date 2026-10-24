package com.menyushka.auth;

import java.time.Instant;

import com.menyushka.domain.User;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Запросы и ответы раздела «Регистрация и вход». */
public final class AuthDtos {

    private AuthDtos() {}

    public record RegisterRequest(
            @NotBlank(message = "Укажите имя") @Size(max = 100) String name,
            @NotBlank(message = "Укажите почту") @Email(message = "Некорректная почта") String email,
            @NotBlank(message = "Укажите пароль")
            @Size(min = 8, max = 72, message = "Пароль — от 8 до 72 символов") String password
    ) {}

    public record LoginRequest(
            @NotBlank(message = "Укажите почту") String email,
            @NotBlank(message = "Укажите пароль") String password
    ) {}

    public record ForgotPasswordRequest(
            @NotBlank(message = "Укажите почту") @Email(message = "Некорректная почта") String email
    ) {}

    public record ResetPasswordRequest(
            @NotBlank String token,
            @NotBlank @Size(min = 8, max = 72, message = "Пароль — от 8 до 72 символов") String newPassword
    ) {}

    public record UpdateProfileRequest(
            @Size(max = 100) String name,
            @Email(message = "Некорректная почта") String email,
            String currentPassword,
            @Size(min = 8, max = 72, message = "Пароль — от 8 до 72 символов") String newPassword
    ) {}

    public record UserRead(
            String id,
            String email,
            String name,
            String role,
            boolean blocked,
            Instant createdAt
    ) {
        public static UserRead of(User u) {
            return new UserRead(
                    String.valueOf(u.getId()),
                    u.getEmail(),
                    u.getName(),
                    u.getRole(),
                    Boolean.TRUE.equals(u.getBlocked()),
                    u.getCreatedAt()
            );
        }
    }

    public record AuthResponse(String token, UserRead user) {}

    /** resetToken возвращается только в режиме разработки: почтовой рассылки в проекте нет. */
    public record ForgotPasswordResponse(String message, String resetToken) {}

    public record MessageResponse(String message) {}
}
