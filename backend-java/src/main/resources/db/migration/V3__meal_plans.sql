-- V3: meal plans and their meal slots.

CREATE TABLE IF NOT EXISTS meal_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    people_count INTEGER NOT NULL,
    budget REAL NOT NULL,
    days_json TEXT NOT NULL,
    preferences_json TEXT NOT NULL,
    appliances_json TEXT NOT NULL,
    diet VARCHAR(30) NOT NULL,
    cart_estimated_cost REAL NOT NULL,
    unresolved_items_count INTEGER NOT NULL,
    status VARCHAR(30) NOT NULL,
    random_seed INTEGER,
    created_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS meal_plan_meals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    meal_plan_id INTEGER NOT NULL,
    day VARCHAR(10) NOT NULL,
    meal_type VARCHAR(20) NOT NULL,
    recipe_id INTEGER NOT NULL,
    CONSTRAINT uq_plan_meal_slot UNIQUE (meal_plan_id, day, meal_type),
    CONSTRAINT fk_meal_plan_meals_plan
        FOREIGN KEY (meal_plan_id) REFERENCES meal_plans(id) ON DELETE CASCADE,
    CONSTRAINT fk_meal_plan_meals_recipe
        FOREIGN KEY (recipe_id) REFERENCES recipes(id)
);

CREATE INDEX IF NOT EXISTS ix_meal_plan_meals_meal_plan_id
    ON meal_plan_meals(meal_plan_id);
CREATE INDEX IF NOT EXISTS ix_meal_plan_meals_recipe_id
    ON meal_plan_meals(recipe_id);