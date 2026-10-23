package com.vkusplan.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> {}) // используем наш CorsConfig
            .authorizeHttpRequests(auth -> auth
                // Пока разрешаем всё, чтобы не сломать текущее приложение.
                // На этапе 2 мы закроем эндпоинты.
                .anyRequest().permitAll()
            );
        return http.build();
    }
}