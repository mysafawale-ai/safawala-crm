-- First, add missing columns to products table

ALTER TABLE products ADD COLUMN IF NOT EXISTS product_code VARCHAR;
ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode VARCHAR;
ALTER TABLE products ADD COLUMN IF NOT EXISTS franchise_id UUID;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_franchise_id ON products(franchise_id);
CREATE INDEX IF NOT EXISTS idx_products_product_code ON products(product_code);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);

-- Done! Now the products table has all required columns
