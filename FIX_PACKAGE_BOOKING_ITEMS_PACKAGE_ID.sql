-- =====================================================
-- FIX: Ensure package_booking_product_items table exists
-- =====================================================
-- This table stores individual products selected within package bookings
-- Without it, product selections within packages won't save

-- Create package_booking_product_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS package_booking_product_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_booking_id UUID NOT NULL REFERENCES package_bookings(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_package_booking_product_items_booking_id 
  ON package_booking_product_items(package_booking_id);
CREATE INDEX IF NOT EXISTS idx_package_booking_product_items_product_id 
  ON package_booking_product_items(product_id);
CREATE INDEX IF NOT EXISTS idx_package_booking_product_items_created_at 
  ON package_booking_product_items(created_at);

-- Add RLS (Row Level Security) policies
ALTER TABLE package_booking_product_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "view_package_booking_product_items" ON package_booking_product_items;
DROP POLICY IF EXISTS "insert_package_booking_product_items" ON package_booking_product_items;
DROP POLICY IF EXISTS "update_package_booking_product_items" ON package_booking_product_items;
DROP POLICY IF EXISTS "delete_package_booking_product_items" ON package_booking_product_items;

-- Policy: Allow all operations (simplified for now)
CREATE POLICY "allow_all_package_booking_product_items"
ON package_booking_product_items FOR ALL
USING (true)
WITH CHECK (true);

-- Grant permissions
GRANT ALL ON package_booking_product_items TO postgres, anon, authenticated, service_role;

-- Add comments for documentation
COMMENT ON TABLE package_booking_product_items IS 'Stores individual products selected for package bookings. Each package booking can have multiple products.';
COMMENT ON COLUMN package_booking_product_items.package_booking_id IS 'Reference to the package booking this product is added to';
COMMENT ON COLUMN package_booking_product_items.product_id IS 'Reference to the product from inventory';
COMMENT ON COLUMN package_booking_product_items.quantity IS 'Quantity of this product for this booking';
COMMENT ON COLUMN package_booking_product_items.unit_price IS 'Unit price of product at time of booking';
COMMENT ON COLUMN package_booking_product_items.total_price IS 'Total price (quantity × unit_price)';

-- Also ensure package_booking_items has the package_id column (nullable for backward compatibility)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'package_booking_items' 
        AND column_name = 'package_id'
    ) THEN
        ALTER TABLE package_booking_items
        ADD COLUMN package_id UUID REFERENCES package_categories(id) ON DELETE SET NULL;
        
        CREATE INDEX IF NOT EXISTS idx_package_booking_items_package_id 
        ON package_booking_items(package_id);
        
        COMMENT ON COLUMN package_booking_items.package_id IS 'Legacy reference to package category. Nullable for backward compatibility.';
        
        RAISE NOTICE '✅ Added package_id column to package_booking_items';
    END IF;
END $$;

-- Verify tables exist
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('package_booking_items', 'package_booking_product_items')
ORDER BY table_name;

-- Verify package_booking_product_items columns
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'package_booking_product_items'
ORDER BY ordinal_position;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Fix Complete!';
    RAISE NOTICE '✅ package_booking_product_items table created/verified';
    RAISE NOTICE '✅ package_id column added to package_booking_items (if missing)';
    RAISE NOTICE '✅ Product selections within packages will now save correctly';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Next Steps:';
    RAISE NOTICE '   1. Test creating a package booking with products';
    RAISE NOTICE '   2. Verify items are saved to package_booking_product_items';
    RAISE NOTICE '   3. Check console logs: "[Book Package] Product items inserted successfully"';
END $$;
