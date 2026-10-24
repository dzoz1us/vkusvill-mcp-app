package com.vkusplan.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import com.vkusplan.exception.ApiException;

public final class CurrentUser {

    private CurrentUser() {}

    public static AuthUser require() {
        Authentication a = SecurityContextHolder.getContext().getAuthentication();
        if (a != null && a.getPrincipal() instanceof AuthUser u) {
            return u;
        }
        throw ApiException.unauthorized("Требуется вход в систему");
    }

    public static Integer id() {
        return require().id();
    }
}
