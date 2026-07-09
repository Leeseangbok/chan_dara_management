-- V2: Add categories table, Khmer name, image URL, and category FK to products

-- 1. Categories table
CREATE TABLE categories (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(100) NOT NULL UNIQUE,
    name_kh    VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. New columns on products
ALTER TABLE products
    ADD COLUMN IF NOT EXISTS name_kh     VARCHAR(255),
    ADD COLUMN IF NOT EXISTS image_url   VARCHAR(500),
    ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

CREATE INDEX idx_products_category_id ON products(category_id);
