-- =====================================================
-- ADD: Missing columns to package_booking_product_items
-- =====================================================
-- The API expects these columns: package_id, variant_id
-- This script adds them if they don't exist

-- Add package_id column
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
        
        RAISE NOTICE 'Added package_id column to package_booking_product_items';
    ELSE
        RAISE NOTICE 'package_id column already exists';
    END IF;
END $$;

-- Add variant_id column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'package_booking_product_items' 
        AND column_name = 'variant_id'
    ) THEN
        ALTER TABLE package_booking_product_items
        ADD COLUMN variant_id UUID REFERENCES package_variants(id) ON DELETE SET NULL;
        
        CREATE INDEX IF NOT EXISTS idx_package_booking_product_items_variant_id 
        ON package_booking_product_items(variant_id);
        
        RAISE NOTICE 'Added variant_id column to package_booking_product_items';
    ELSE
        RAISE NOTICE 'variant_id column already exists';
    END IF;
END $$;

-- Verify all columns exist
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'package_booking_product_items'
AND column_name IN ('package_id', 'variant_id', 'product_id', 'package_booking_id')
ORDER BY column_name;
