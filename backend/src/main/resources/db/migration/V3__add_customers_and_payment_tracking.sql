CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    address VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE transactions ADD COLUMN payment_method VARCHAR(50) DEFAULT 'CASH';
ALTER TABLE transactions ADD COLUMN payment_status VARCHAR(50) DEFAULT 'PAID';
ALTER TABLE transactions ADD COLUMN customer_id UUID;
ALTER TABLE transactions ADD CONSTRAINT fk_transaction_customer FOREIGN KEY (customer_id) REFERENCES customers(id);
