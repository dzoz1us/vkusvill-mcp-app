-- V6: users and roles

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP NOT NULL
);

-- Привязываем планы к пользователям.
-- NULL означает, что план создал "Гость" (без авторизации).
ALTER TABLE meal_plans ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS ix_meal_plans_user_id ON meal_plans(user_id);