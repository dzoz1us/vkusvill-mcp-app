package com.menyushka.config;

import java.io.IOException;
import java.nio.file.Path;

import javax.sql.DataSource;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import com.zaxxer.hikari.HikariDataSource;

import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;

/**
 * Встроенный PostgreSQL 17: бэкенд сам создаёт и запускает базу, ничего устанавливать не нужно.
 * Включается профилем embedded-db (его выставляет скрипт npm start, если DB_URL не задан).
 * Данные сохраняются между запусками в каталоге data/postgres.
 */
@Configuration
@Profile("embedded-db")
public class EmbeddedDatabaseConfig {

    private static final Logger log = LoggerFactory.getLogger(EmbeddedDatabaseConfig.class);

    @Bean(destroyMethod = "close")
    EmbeddedPostgres embeddedPostgres(
            @Value("${app.embedded-db.port:5440}") int port,
            @Value("${app.embedded-db.dir:data/postgres}") String dataDir
    ) throws IOException {
        log.info("Запускаем встроенный PostgreSQL на порту {}, данные в {}", port, dataDir);
        return EmbeddedPostgres.builder()
                .setPort(port)
                .setDataDirectory(Path.of(dataDir))
                .setCleanDataDirectory(false)
                .start();
    }

    @Bean
    DataSource dataSource(EmbeddedPostgres postgres) {
        HikariDataSource ds = new HikariDataSource();
        ds.setJdbcUrl(postgres.getJdbcUrl("postgres", "postgres"));
        ds.setUsername("postgres");
        ds.setPassword("postgres");
        ds.setMaximumPoolSize(10);
        return ds;
    }
}
