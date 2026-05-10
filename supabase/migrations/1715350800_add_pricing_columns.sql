-- Add cost_price and regular_price columns to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS regular_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS brand VARCHAR(100);

-- Set regular_price to be same as price initially for existing products
UPDATE products SET regular_price = price WHERE regular_price IS NULL;

-- Make regular_price not null going forward
ALTER TABLE products
ALTER COLUMN regular_price SET NOT NULL;
