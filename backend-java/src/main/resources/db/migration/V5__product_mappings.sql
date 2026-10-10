-- V5: product mappings and MCP cache.

CREATE TABLE IF NOT EXISTS product_mappings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ingredient_id INTEGER NOT NULL,
    product_xml_id VARCHAR(100) NOT NULL,
    product_name VARCHAR(300) NOT NULL,
    product_url VARCHAR(500),
    package_quantity REAL,
    package_unit VARCHAR(20),
    last_price REAL,
    match_score REAL NOT NULL,
    match_status VARCHAR(30) NOT NULL,
    last_checked_at TIMESTAMP NOT NULL,
    CONSTRAINT uq_mapping_ingredient UNIQUE (ingredient_id),
    CONSTRAINT fk_product_mappings_ingredient
        FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mcp_product_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    query VARCHAR(300) NOT NULL,
    response_json TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS ix_product_mappings_ingredient_id
    ON product_mappings(ingredient_id);

CREATE INDEX IF NOT EXISTS ix_mcp_product_cache_query
    ON mcp_product_cache(query);