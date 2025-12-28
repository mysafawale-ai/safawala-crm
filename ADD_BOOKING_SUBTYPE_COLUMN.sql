-- Add booking_subtype column to product_orders if it doesn't exist
-- This column stores whether the order is a 'rental' or 'sale'

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'product_orders' 
        AND column_name = 'booking_subtype'
    ) THEN
        ALTER TABLE product_orders ADD COLUMN booking_subtype TEXT DEFAULT 'rental';
        RAISE NOTICE 'Added booking_subtype column to product_orders';
    ELSE
        RAISE NOTICE 'booking_subtype column already exists';
    END IF;
END $$;

-- Update existing records that have booking_type but not booking_subtype
UPDATE product_orders 
SET booking_subtype = COALESCE(booking_type, 'rental') 
WHERE booking_subtype IS NULL;
