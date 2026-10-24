package com.menyushka.controller.admin;

import java.util.List;

import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.menyushka.auth.AuthDtos.UserRead;
import com.menyushka.auth.AuthService;
import com.menyushka.domain.User;
import com.menyushka.dto.AdminDtos.UpdateUserRequest;
import com.menyushka.exception.ApiException;
import com.menyushka.repository.UserRepository;
import com.menyushka.security.CurrentUser;

import jakarta.validation.Valid;

/** Администратор: управление доступом пользователей. */
@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    private final UserRepository users;

    public AdminUserController(UserRepository users) {
        this.users = users;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<UserRead> list() {
        return users.findAll().stream()
                .sorted((a, b) -> a.getId().compareTo(b.getId()))
                .map(UserRead::of)
                .toList();
    }

    @PatchMapping("/{id}")
    @Transactional
    public UserRead update(@PathVariable Integer id, @Valid @RequestBody UpdateUserRequest request) {
        User user = users.findById(id).orElseThrow(() -> ApiException.notFound("Пользователь не найден"));
        boolean self = user.getId().equals(CurrentUser.id());

        if (request.name() != null && !request.name().isBlank()) {
            user.setName(request.name().trim());
        }
        if (request.blocked() != null) {
            if (self && request.blocked()) {
                throw ApiException.badRequest("Нельзя заблокировать самого себя");
            }
            user.setBlocked(request.blocked());
        }
        if (request.role() != null) {
            if (!AuthService.ROLE_CLIENT.equals(request.role()) && !AuthService.ROLE_ADMIN.equals(request.role())) {
                throw ApiException.badRequest("Роль: CLIENT или ADMIN");
            }
            if (self && !AuthService.ROLE_ADMIN.equals(request.role())) {
                throw ApiException.badRequest("Нельзя снять права администратора с самого себя");
            }
            user.setRole(request.role());
        }
        return UserRead.of(users.save(user));
    }
}
