package com.menyushka.seed;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import com.menyushka.config.AppProperties;
import com.menyushka.repository.ProductMappingRepository;
import com.menyushka.repository.RecipeRepository;

/** Заполняет рецепты, категории и товары при первом запуске (если база пуста). */
@Component
@Order(1)
public class StartupSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(StartupSeeder.class);

    private final SeedService seedService;
    private final RecipeRepository recipes;
    private final ProductMappingRepository mappings;
    private final AppProperties props;

    public StartupSeeder(
            SeedService seedService,
            RecipeRepository recipes,
            ProductMappingRepository mappings,
            AppProperties props
    ) {
        this.seedService = seedService;
        this.recipes = recipes;
        this.mappings = mappings;
        this.props = props;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!props.isAutoSeed()) {
            return;
        }
        if (recipes.count() > 0 && mappings.count() > 0) {
            return;
        }
        SeedService.SeedSummary s = seedService.runSeed();
        log.info("Первичное заполнение: {} ингредиентов, {} рецептов, {} категорий, {} товаров",
                s.ingredients(), s.recipes(), s.categories(), s.products());
    }
}
