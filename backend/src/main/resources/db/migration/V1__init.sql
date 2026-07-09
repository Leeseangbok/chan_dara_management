-- Extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ENUM TYPES
CREATE TYPE role_enum AS ENUM ('ADMIN', 'MANAGER', 'STAFF');
CREATE TYPE movement_type_enum AS ENUM ('SALE', 'RESTOCK', 'RETURN', 'DAMAGE', 'THIEF');

-- USERS
CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username            VARCHAR(100) NOT NULL UNIQUE,
    password_hash       TEXT NOT NULL,
    role                role_enum NOT NULL,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CATEGORIES
CREATE TABLE categories (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(100) NOT NULL UNIQUE,
    name_kh    VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CUSTOMERS
CREATE TABLE customers (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(100) NOT NULL,
    phone      VARCHAR(50),
    address    VARCHAR(255),
    notes      TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- SUPPLIERS
CREATE TABLE suppliers (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name         VARCHAR(100) NOT NULL UNIQUE,
    contact_name VARCHAR(100),
    phone        VARCHAR(20),
    email        VARCHAR(100),
    address      TEXT,
    notes        TEXT,
    created_at   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at   TIMESTAMPTZ
);

-- PRODUCTS
CREATE TABLE products (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku                 VARCHAR(64) NOT NULL UNIQUE,
    name                VARCHAR(255) NOT NULL,
    name_kh             VARCHAR(255),
    description         TEXT,
    price               NUMERIC(12,2) NOT NULL CHECK (price >= 0),
    cost_price          NUMERIC(12,2) NOT NULL CHECK (cost_price >= 0),
    stock_quantity      INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >=0),
    image_url           VARCHAR(500),
    category_id         UUID REFERENCES categories(id) ON DELETE SET NULL,
    version             BIGINT NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_category_id ON products(category_id);

-- TRANSACTIONS
CREATE TABLE transactions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id),
    customer_id         UUID REFERENCES customers(id),
    total_amount        NUMERIC(14,2) NOT NULL CHECK (total_amount >= 0),
    payment_method      VARCHAR(50) DEFAULT 'CASH',
    payment_status      VARCHAR(50) DEFAULT 'PAID',
    transaction_date    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);

-- TRANSACTION ITEMS
CREATE TABLE transaction_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id  UUID NOT NULL REFERENCES transactions(id),
    product_id      UUID NOT NULL REFERENCES products(id),
    quantity        INTEGER NOT NULL CHECK (quantity > 0),
    unit_price      NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
    unit_cost       NUMERIC(12,2) NOT NULL CHECK (unit_cost >= 0),
    subtotal        NUMERIC(14,2) NOT NULL CHECK (subtotal >= 0),
    profit          NUMERIC(14,2) NOT NULL,
    CONSTRAINT chk_subtotal_matches CHECK (subtotal = quantity * unit_price),
    CONSTRAINT chk_profit_matches CHECK (profit = quantity * (unit_price - unit_cost))
);
CREATE INDEX idx_txitems_transaction_id ON transaction_items(transaction_id);
CREATE INDEX idx_txitems_product_id ON transaction_items(product_id);

-- INVENTORY MOVEMENTS
CREATE TABLE inventory_movements (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id          UUID NOT NULL REFERENCES products(id),
    user_id             UUID NOT NULL REFERENCES users(id),
    type                movement_type_enum NOT NULL,
    quantity_changed    INTEGER NOT NULL CHECK (quantity_changed <> 0),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_movement_direction CHECK (
        (type IN ('SALE','DAMAGE','THIEF') AND quantity_changed < 0)
         OR
        (type IN ('RESTOCK','RETURN') AND quantity_changed > 0)
    )
);
CREATE INDEX idx_inv_movements_product_id ON inventory_movements(product_id);
CREATE INDEX idx_inv_movements_user_id ON inventory_movements(user_id);
CREATE INDEX idx_inv_movements_created_at ON inventory_movements(created_at);

-- PURCHASE ORDERS
CREATE TABLE purchase_orders (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_number     VARCHAR(255) NOT NULL UNIQUE,
    supplier_id   UUID NOT NULL REFERENCES suppliers(id),
    status        VARCHAR(255) NOT NULL,
    total_amount  DECIMAL(12, 2) NOT NULL,
    notes         TEXT,
    created_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at    TIMESTAMPTZ,
    created_by    UUID REFERENCES users(id)
);

-- PURCHASE ORDER ITEMS
CREATE TABLE purchase_order_items (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id),
    product_id        UUID NOT NULL REFERENCES products(id),
    quantity          INTEGER NOT NULL,
    unit_cost         DECIMAL(12, 2) NOT NULL,
    subtotal          DECIMAL(12, 2) NOT NULL
);

-- EXPENSES
CREATE TABLE expenses (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category      VARCHAR(255) NOT NULL,
    amount        DECIMAL(12, 2) NOT NULL,
    description   VARCHAR(500) NOT NULL,
    expense_date  DATE NOT NULL,
    created_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    logged_by     UUID REFERENCES users(id)
);