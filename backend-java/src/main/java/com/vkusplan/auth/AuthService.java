package com.vkusplan.auth;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vkusplan.auth.AuthDtos.AuthResponse;
import com.vkusplan.auth.AuthDtos.ForgotPasswordResponse;
import com.vkusplan.auth.AuthDtos.UpdateProfileRequest;
import com.vkusplan.auth.AuthDtos.UserRead;
import com.vkusplan.config.AppProperties;
import com.vkusplan.domain.PasswordResetToken;
import com.vkusplan.domain.User;
import com.vkusplan.enums.ErrorCode;
import com.vkusplan.exception.ApiException;
import com.vkusplan.repository.PasswordResetTokenRepository;
import com.vkusplan.repository.UserRepository;
import com.vkusplan.security.JwtService;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    public static final String ROLE_CLIENT = "CLIENT";
    public static final String ROLE_ADMIN = "ADMIN";

    private final UserRepository users;
    private final PasswordResetTokenRepository resetTokens;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final AppProperties props;

    public AuthService(
            UserRepository users,
            PasswordResetTokenRepository resetTokens,
            PasswordEncoder encoder,
            JwtService jwt,
            AppProperties props
    ) {
        this.users = users;
        this.resetTokens = resetTokens;
        this.encoder = encoder;
        this.jwt = jwt;
        this.props = props;
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }

    @Transactional
    public AuthResponse register(String name, String email, String password) {
        String normalized = normalizeEmail(email);
        if (users.existsByEmailIgnoreCase(normalized)) {
            throw ApiException.conflict("Пользователь с такой почтой уже зарегистрирован");
        }
        User user = users.save(User.builder()
                .name(name.trim())
                .email(normalized)
                .passwordHash(encoder.encode(password))
                .role(ROLE_CLIENT)
                .blocked(false)
                .createdAt(Instant.now())
                .build());
        return new AuthResponse(jwt.issue(user), UserRead.of(user));
    }

    @Transactional(readOnly = true)
    public AuthResponse login(String email, String password) {
        User user = users.findByEmailIgnoreCase(normalizeEmail(email))
                .orElseThrow(() -> ApiException.unauthorized("Неверная почта или пароль"));
        if (!encoder.matches(password, user.getPasswordHash())) {
            throw ApiException.unauthorized("Неверная почта или пароль");
        }
        if (Boolean.TRUE.equals(user.getBlocked())) {
            throw new ApiException(
                    ErrorCode.ACCOUNT_BLOCKED, HttpStatus.FORBIDDEN, "Доступ к аккаунту закрыт администратором");
        }
        return new AuthResponse(jwt.issue(user), UserRead.of(user));
    }

    @Transactional
    public ForgotPasswordResponse forgotPassword(String email) {
        String message = "Если такая почта зарегистрирована, мы отправили ссылку для сброса пароля";
        String token = null;
        var found = users.findByEmailIgnoreCase(normalizeEmail(email));
        if (found.isPresent()) {
            token = UUID.randomUUID().toString().replace("-", "");
            resetTokens.save(PasswordResetToken.builder()
                    .user(found.get())
                    .token(token)
                    .expiresAt(Instant.now().plus(Duration.ofHours(1)))
                    .used(false)
                    .build());
            log.info("Ссылка сброса пароля для {}: {}/#/reset-password?token={}",
                    found.get().getEmail(), props.getFrontendOrigin(), token);
        }
        return new ForgotPasswordResponse(message, props.isDevMode() ? token : null);
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken t = resetTokens.findByToken(token)
                .filter(x -> !Boolean.TRUE.equals(x.getUsed()))
                .filter(x -> x.getExpiresAt().isAfter(Instant.now()))
                .orElseThrow(() -> ApiException.badRequest("Ссылка для сброса пароля недействительна или устарела"));
        User user = t.getUser();
        user.setPasswordHash(encoder.encode(newPassword));
        users.save(user);
        t.setUsed(true);
        resetTokens.save(t);
    }

    @Transactional(readOnly = true)
    public UserRead me(Integer userId) {
        return UserRead.of(requireUser(userId));
    }

    @Transactional
    public AuthResponse updateProfile(Integer userId, UpdateProfileRequest req) {
        User user = requireUser(userId);

        if (req.name() != null && !req.name().isBlank()) {
            user.setName(req.name().trim());
        }
        if (req.email() != null && !req.email().isBlank()) {
            String normalized = normalizeEmail(req.email());
            if (!normalized.equalsIgnoreCase(user.getEmail())) {
                if (users.existsByEmailIgnoreCase(normalized)) {
                    throw ApiException.conflict("Эта почта уже занята");
                }
                user.setEmail(normalized);
            }
        }
        if (req.newPassword() != null && !req.newPassword().isBlank()) {
            if (req.currentPassword() == null
                    || !encoder.matches(req.currentPassword(), user.getPasswordHash())) {
                throw ApiException.badRequest("Текущий пароль указан неверно");
            }
            user.setPasswordHash(encoder.encode(req.newPassword()));
        }
        users.save(user);
        return new AuthResponse(jwt.issue(user), UserRead.of(user));
    }

    private User requireUser(Integer userId) {
        return users.findById(userId).orElseThrow(() -> ApiException.unauthorized("Пользователь не найден"));
    }
}
