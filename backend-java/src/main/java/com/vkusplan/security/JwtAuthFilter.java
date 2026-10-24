package com.vkusplan.security;

import java.io.IOException;
import java.util.List;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.vkusplan.repository.UserRepository;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/** Читает Bearer-токен и кладёт пользователя в SecurityContext. Заблокированные не проходят. */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public JwtAuthFilter(JwtService jwtService, UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain chain
    ) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            jwtService.parse(header.substring(7)).ifPresent(parsed ->
                    userRepository.findById(parsed.id())
                            .filter(u -> !Boolean.TRUE.equals(u.getBlocked()))
                            .ifPresent(u -> {
                                // роль берём из базы: администратор мог изменить её после выдачи токена
                                AuthUser actual = new AuthUser(u.getId(), u.getEmail(), u.getRole());
                                var auth = new UsernamePasswordAuthenticationToken(
                                        actual,
                                        null,
                                        List.of(new SimpleGrantedAuthority("ROLE_" + u.getRole()))
                                );
                                SecurityContextHolder.getContext().setAuthentication(auth);
                            })
            );
        }
        chain.doFilter(request, response);
    }
}
