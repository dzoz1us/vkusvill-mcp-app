package com.menyushka.security;

/** Аутентифицированный пользователь, лежащий в SecurityContext. */
public record AuthUser(Integer id, String email, String role) {

    public boolean isAdmin() {
        return "ADMIN".equals(role);
    }
}
