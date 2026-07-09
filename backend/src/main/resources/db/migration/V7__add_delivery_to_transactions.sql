ALTER TABLE transactions
ADD COLUMN delivery_status VARCHAR(50) DEFAULT 'NONE' NOT NULL,
ADD COLUMN delivery_location TEXT;

CREATE INDEX idx_transactions_delivery_status ON transactions(delivery_status);
