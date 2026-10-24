package com.menyushka.auth;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.menyushka.auth.AuthDtos.AuthResponse;
import com.menyushka.auth.AuthDtos.ForgotPasswordRequest;
import com.menyushka.auth.AuthDtos.ForgotPasswordResponse;
import com.menyushka.auth.AuthDtos.LoginRequest;
import com.menyushka.auth.AuthDtos.MessageResponse;
import com.menyushka.auth.AuthDtos.RegisterRequest;
import com.menyushka.auth.AuthDtos.ResetPasswordRequest;
import com.menyushka.auth.AuthDtos.UpdateProfileRequest;
import com.menyushka.auth.AuthDtos.UserRead;
import com.menyushka.security.CurrentUser;

import jakarta.validation.Valid;

/** Гость: регистрация, вход, восстановление доступа. Клиент: профиль. */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request.name(), request.email(), request.password());
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request.email(), request.password());
    }

    @PostMapping("/forgot-password")
    public ForgotPasswordResponse forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return authService.forgotPassword(request.email());
    }

    @PostMapping("/reset-password")
    public MessageResponse resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.token(), request.newPassword());
        return new MessageResponse("Пароль изменён, теперь можно войти");
    }

    @GetMapping("/me")
    public UserRead me() {
        return authService.me(CurrentUser.id());
    }

    @PatchMapping("/me")
    public AuthResponse updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        return authService.updateProfile(CurrentUser.id(), request);
    }
}
