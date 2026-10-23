-- V2: recipes and their related tables
-- Creates recipes, recipe_ingredients, recipe_tags, recipe_appliances.

CREATE TABLE IF NOT EXISTS recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    servings INTEGER NOT NULL,
    cook_time_minutes INTEGER NOT NULL,
    calories REAL,
    protein REAL,
    fat REAL,
    carbs REAL,
    diet VARCHAR(30) NOT NULL,
    meal_type VARCHAR(20),
    steps TEXT,
    CONSTRAINT uq_recipes_name UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id INTEGER NOT NULL,
    ingredient_id INTEGER NOT NULL,
    quantity REAL NOT NULL,
    unit VARCHAR(20) NOT NULL,
    CONSTRAINT uq_recipe_ingredient UNIQUE (recipe_id, ingredient_id),
    CONSTRAINT fk_recipe_ingredients_recipe
        FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    CONSTRAINT fk_recipe_ingredients_ingredient
        FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
);

CREATE INDEX IF NOT EXISTS ix_recipe_ingredients_recipe_id
    ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS ix_recipe_ingredients_ingredient_id
    ON recipe_ingredients(ingredient_id);

CREATE TABLE IF NOT EXISTS recipe_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id INTEGER NOT NULL,
    tag VARCHAR(50) NOT NULL,
    CONSTRAINT uq_recipe_tag UNIQUE (recipe_id, tag),
    CONSTRAINT fk_recipe_tags_recipe
        FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_recipe_tags_recipe_id
    ON recipe_tags(recipe_id);

CREATE TABLE IF NOT EXISTS recipe_appliances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id INTEGER NOT NULL,
    appliance VARCHAR(50) NOT NULL,
    CONSTRAINT uq_recipe_appliance UNIQUE (recipe_id, appliance),
    CONSTRAINT fk_recipe_appliances_recipe
        FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_recipe_appliances_recipe_id
    ON recipe_appliances(recipe_id);