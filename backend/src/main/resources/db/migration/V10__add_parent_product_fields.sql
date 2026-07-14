ALTER TABLE products ADD COLUMN parent_product_id UUID;
ALTER TABLE products ADD COLUMN pieces_per_parent INTEGER;

ALTER TABLE products 
ADD CONSTRAINT fk_products_parent 
FOREIGN KEY (parent_product_id) REFERENCES products(id) ON DELETE SET NULL;
