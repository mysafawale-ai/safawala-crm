-- Add missing stock_quantity column to products table if it doesn't exist
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;

-- Update existing products to have a default stock quantity
UPDATE products 
SET stock_quantity = 10 
WHERE stock_quantity IS NULL OR stock_quantity = 0;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_products_stock_quantity ON products(stock_quantity);
