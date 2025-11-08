-- Add columns to package_booking_items to store quote details
ALTER TABLE package_booking_items
ADD COLUMN IF NOT EXISTS event_type VARCHAR DEFAULT NULL,
ADD COLUMN IF NOT EXISTS event_date TIMESTAMP DEFAULT NULL,
ADD COLUMN IF NOT EXISTS event_time TIME DEFAULT NULL,
ADD COLUMN IF NOT EXISTS delivery_date TIMESTAMP DEFAULT NULL,
ADD COLUMN IF NOT EXISTS delivery_time TIME DEFAULT NULL,
ADD COLUMN IF NOT EXISTS return_date TIMESTAMP DEFAULT NULL,
ADD COLUMN IF NOT EXISTS return_time TIME DEFAULT NULL,
ADD COLUMN IF NOT EXISTS venue_name VARCHAR DEFAULT NULL,
ADD COLUMN IF NOT EXISTS venue_address TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS distance_km DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS reserved_products JSONB DEFAULT '[]'::jsonb;

-- Add columns to product_order_items to store quote details
ALTER TABLE product_order_items
ADD COLUMN IF NOT EXISTS event_type VARCHAR DEFAULT NULL,
ADD COLUMN IF NOT EXISTS event_date TIMESTAMP DEFAULT NULL,
ADD COLUMN IF NOT EXISTS event_time TIME DEFAULT NULL,
ADD COLUMN IF NOT EXISTS delivery_date TIMESTAMP DEFAULT NULL,
ADD COLUMN IF NOT EXISTS delivery_time TIME DEFAULT NULL,
ADD COLUMN IF NOT EXISTS return_date TIMESTAMP DEFAULT NULL,
ADD COLUMN IF NOT EXISTS return_time TIME DEFAULT NULL,
ADD COLUMN IF NOT EXISTS venue_name VARCHAR DEFAULT NULL,
ADD COLUMN IF NOT EXISTS venue_address TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS distance_km DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS reserved_products JSONB DEFAULT '[]'::jsonb;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_package_booking_items_reserved_products 
ON package_booking_items USING GIN (reserved_products);

CREATE INDEX IF NOT EXISTS idx_product_order_items_reserved_products 
ON product_order_items USING GIN (reserved_products);
