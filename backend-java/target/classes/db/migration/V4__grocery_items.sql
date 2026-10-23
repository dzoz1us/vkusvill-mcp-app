-- V4: grocery items aggregated per meal plan.

CREATE TABLE IF NOT EXISTS grocery_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    meal_plan_id INTEGER NOT NULL,
    ingredient_id INTEGER,
    product_name VARCHAR(200) NOT NULL,
    needed_quantity REAL NOT NULL,
    needed_unit VARCHAR(20) NOT NULL,
    product_xml_id VARCHAR(100),
    product_url VARCHAR(500),
    package_quantity REAL,
    package_unit VARCHAR(20),
    package_count INTEGER,
    price_per_package REAL,
    total_price REAL,
    match_status VARCHAR(30) NOT NULL,
    is_bought BOOLEAN NOT NULL,
    is_manual BOOLEAN NOT NULL,
    CONSTRAINT fk_grocery_items_meal_plan
        FOREIGN KEY (meal_plan_id) REFERENCES meal_plans(id) ON DELETE CASCADE,
    CONSTRAINT fk_grocery_items_ingredient
        FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS ix_grocery_items_meal_plan_id
    ON grocery_items(meal_plan_id);
CREATE INDEX IF NOT EXISTS ix_grocery_items_ingredient_id
    ON grocery_items(ingredient_id);