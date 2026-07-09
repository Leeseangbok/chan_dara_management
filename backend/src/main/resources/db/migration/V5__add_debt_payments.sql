-- 1. Add paid_amount to transactions
ALTER TABLE transactions ADD COLUMN paid_amount NUMERIC(14,2) DEFAULT 0 NOT NULL;

-- 2. Backfill existing data
UPDATE transactions SET paid_amount = total_amount WHERE payment_status = 'PAID';

-- 3. Create transaction_payments table
CREATE TABLE transaction_payments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id      UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    amount              NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    payment_method      VARCHAR(50) NOT NULL DEFAULT 'CASH',
    logged_by           UUID REFERENCES users(id),
    payment_date        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tx_payments_tx_id ON transaction_payments(transaction_id);
