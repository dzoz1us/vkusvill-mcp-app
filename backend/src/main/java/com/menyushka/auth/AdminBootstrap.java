package com.menyushka.auth;

import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.menyushka.config.AppProperties;
import com.menyushka.domain.User;
import com.menyushka.repository.UserRepository;

/** Создаёт администратора по умолчанию, если в системе нет ни одного. */
@Component
@Order(10)
public class AdminBootstrap implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrap.class);

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final AppProperties props;

    public AdminBootstrap(UserRepository users, PasswordEncoder encoder, AppProperties props) {
        this.users = users;
        this.encoder = encoder;
        this.props = props;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (users.countByRole(AuthService.ROLE_ADMIN) > 0) {
            return;
        }
        users.save(User.builder()
                .name(props.getAdminName())
                .email(props.getAdminEmail().toLowerCase())
                .passwordHash(encoder.encode(props.getAdminPassword()))
                .role(AuthService.ROLE_ADMIN)
                .blocked(false)
                .createdAt(Instant.now())
                .build());
        log.warn("Создан администратор по умолчанию {} — смените пароль", props.getAdminEmail());
    }
}
