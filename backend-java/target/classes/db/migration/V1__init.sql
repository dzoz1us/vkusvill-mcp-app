-- V1: initial schema
-- Creates the ingredients table. Later migrations add the rest.

CREATE TABLE IF NOT EXISTS ingredients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(200) NOT NULL,
    normalized_name VARCHAR(200) NOT NULL,
    default_unit VARCHAR(20) NOT NULL,
    category VARCHAR(100),
    CONSTRAINT uq_ingredients_normalized_name UNIQUE (normalized_name)
);