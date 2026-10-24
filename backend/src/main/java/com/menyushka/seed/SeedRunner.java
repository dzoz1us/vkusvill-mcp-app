package com.menyushka.seed;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * Runs the seed on startup when the 'seed' profile is active.
 *
 * Usage:
 *   java -jar target/menyushka-backend-0.1.0.jar --spring.profiles.active=seed
 *   or with both seed + default profile:
 *   java -jar target/menyushka-backend-0.1.0.jar --spring.profiles.active=seed
 */
@Component
@Profile("seed")
public class SeedRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(SeedRunner.class);

    private final SeedService seedService;

    public SeedRunner(SeedService seedService) {
        this.seedService = seedService;
    }

    @Override
    public void run(String... args) {
        log.info("Starting seed...");
        SeedService.SeedSummary summary = seedService.runSeed();
        log.info(
                "Seed complete: {} ingredients, {} recipes, {} categories, {} products.",
                summary.ingredients(),
                summary.recipes(),
                summary.categories(),
                summary.products()
        );
    }
}