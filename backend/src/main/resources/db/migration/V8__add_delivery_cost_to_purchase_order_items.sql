ALTER TABLE purchase_order_items 
ADD COLUMN delivery_cost DECIMAL(12, 2) NOT NULL DEFAULT 0.00;
