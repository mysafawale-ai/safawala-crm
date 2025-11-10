-- =====================================================
-- ADD: package_id column to package_booking_product_items
-- =====================================================
-- The API expects this column to exist for package bookings

-- Add package_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'package_booking_product_items' 
        AND column_name = 'package_id'
    ) THEN
        ALTER TABLE package_booking_product_items
        ADD COLUMN package_id UUID REFERENCES packages_categories(id) ON DELETE SET NULL;
        
        CREATE INDEX IF NOT EXISTS idx_package_booking_product_items_package_id 
        ON package_booking_product_items(package_id);
        
        COMMENT ON COLUMN package_booking_product_items.package_id IS 'Reference to the package category this product belongs to';
        
        RAISE NOTICE 'Added package_id column to package_booking_product_items';
    ELSE
        RAISE NOTICE 'package_id column already exists in package_booking_product_items';
    END IF;
END $$;

-- Verify the column exists
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'package_booking_product_items'
AND column_name = 'package_id';
