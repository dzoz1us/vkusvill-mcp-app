package com.menyushka.security;

import static org.springframework.security.config.Customizer.withDefaults;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    private static final String UNAUTHORIZED_JSON =
            "{\"error\":{\"code\":\"UNAUTHORIZED\",\"message\":\"Требуется вход в систему\",\"retryable\":false}}";
    private static final String FORBIDDEN_JSON =
            "{\"error\":{\"code\":\"FORBIDDEN\",\"message\":\"Недостаточно прав\",\"retryable\":false}}";

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, JwtAuthFilter jwtFilter) throws Exception {
        http
                .csrf(c -> c.disable())
                .cors(withDefaults())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(a -> a
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/health").permitAll()
                        // гость: регистрация, вход, восстановление доступа
                        .requestMatchers(
                                "/api/auth/register",
                                "/api/auth/login",
                                "/api/auth/forgot-password",
                                "/api/auth/reset-password"
                        ).permitAll()
                        // гость: каталог рецептов, фильтры и карточка рецепта
                        .requestMatchers(HttpMethod.GET,
                                "/api/recipes", "/api/recipes/*", "/api/categories",
                                "/api/ingredients", "/api/order-statuses"
                        ).permitAll()
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .anyRequest().authenticated()
                )
                .exceptionHandling(e -> e
                        .authenticationEntryPoint((req, res, ex) -> {
                            res.setStatus(401);
                            res.setContentType(MediaType.APPLICATION_JSON_VALUE + ";charset=UTF-8");
                            res.getWriter().write(UNAUTHORIZED_JSON);
                        })
                        .accessDeniedHandler((req, res, ex) -> {
                            res.setStatus(403);
                            res.setContentType(MediaType.APPLICATION_JSON_VALUE + ";charset=UTF-8");
                            res.getWriter().write(FORBIDDEN_JSON);
                        })
                )
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
