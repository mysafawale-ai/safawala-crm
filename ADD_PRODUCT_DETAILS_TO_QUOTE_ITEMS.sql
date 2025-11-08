-- Add product detail columns to product_order_items for quote display
ALTER TABLE product_order_items
ADD COLUMN IF NOT EXISTS product_code VARCHAR DEFAULT NULL,
ADD COLUMN IF NOT EXISTS category VARCHAR DEFAULT NULL,
ADD COLUMN IF NOT EXISTS product_name_copy VARCHAR DEFAULT NULL;

-- Add product detail columns to package_booking_items for quote display
ALTER TABLE package_booking_items
ADD COLUMN IF NOT EXISTS product_code VARCHAR DEFAULT NULL,
ADD COLUMN IF NOT EXISTS category VARCHAR DEFAULT NULL,
ADD COLUMN IF NOT EXISTS package_name_copy VARCHAR DEFAULT NULL;

-- Add product detail columns to package_booking_product_items (products inside packages)
ALTER TABLE package_booking_product_items
ADD COLUMN IF NOT EXISTS product_code VARCHAR DEFAULT NULL,
ADD COLUMN IF NOT EXISTS category VARCHAR DEFAULT NULL,
ADD COLUMN IF NOT EXISTS product_name_copy VARCHAR DEFAULT NULL;

-- Create indexes for better query performance on product_order_items
CREATE INDEX IF NOT EXISTS idx_product_order_items_product_code 
ON product_order_items(product_code);

CREATE INDEX IF NOT EXISTS idx_product_order_items_category 
ON product_order_items(category);

-- Create indexes for better query performance on package_booking_items
CREATE INDEX IF NOT EXISTS idx_package_booking_items_product_code 
ON package_booking_items(product_code);

CREATE INDEX IF NOT EXISTS idx_package_booking_items_category 
ON package_booking_items(category);

-- Create indexes for better query performance on package_booking_product_items
CREATE INDEX IF NOT EXISTS idx_package_booking_product_items_product_code 
ON package_booking_product_items(product_code);

CREATE INDEX IF NOT EXISTS idx_package_booking_product_items_category 
ON package_booking_product_items(category);

-- Add comments for product_order_items
COMMENT ON COLUMN product_order_items.product_code IS 'Copy of product code for quick access in quote views';
COMMENT ON COLUMN product_order_items.category IS 'Copy of product category for filtering in quote views';
COMMENT ON COLUMN product_order_items.product_name_copy IS 'Backup product name in case product is deleted';

-- Add comments for package_booking_items
COMMENT ON COLUMN package_booking_items.product_code IS 'Copy of package variant code for quick access';
COMMENT ON COLUMN package_booking_items.category IS 'Category name for quote display';
COMMENT ON COLUMN package_booking_items.package_name_copy IS 'Backup package name in case package is deleted';

-- Add comments for package_booking_product_items
COMMENT ON COLUMN package_booking_product_items.product_code IS 'Copy of product code for display in package details';
COMMENT ON COLUMN package_booking_product_items.category IS 'Copy of product category for filtering and display';
COMMENT ON COLUMN package_booking_product_items.product_name_copy IS 'Backup product name in case product is deleted';
