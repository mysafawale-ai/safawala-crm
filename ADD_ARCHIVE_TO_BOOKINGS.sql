-- ===================================================================
-- 📦 ADD ARCHIVE FUNCTIONALITY TO BOOKINGS
-- ===================================================================
-- This migration adds is_archived column to enable archiving instead of deletion
-- 
-- Run this in Supabase SQL Editor:
-- https://app.supabase.com/project/_/sql
-- ===================================================================

-- Add is_archived column to package_bookings
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='package_bookings' AND column_name='is_archived'
  ) THEN
    ALTER TABLE package_bookings 
    ADD COLUMN is_archived BOOLEAN DEFAULT false NOT NULL;
    
    CREATE INDEX IF NOT EXISTS idx_package_bookings_archived 
    ON package_bookings(is_archived, created_at DESC);
    
    RAISE NOTICE '✅ Added is_archived column to package_bookings';
  ELSE
    RAISE NOTICE '⏭️  is_archived column already exists in package_bookings';
  END IF;
END $$;

-- Add is_archived column to product_orders
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='product_orders' AND column_name='is_archived'
  ) THEN
    ALTER TABLE product_orders 
    ADD COLUMN is_archived BOOLEAN DEFAULT false NOT NULL;
    
    CREATE INDEX IF NOT EXISTS idx_product_orders_archived 
    ON product_orders(is_archived, created_at DESC);
    
    RAISE NOTICE '✅ Added is_archived column to product_orders';
  ELSE
    RAISE NOTICE '⏭️  is_archived column already exists in product_orders';
  END IF;
END $$;

-- Add is_archived column to direct_sales if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='direct_sales') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name='direct_sales' AND column_name='is_archived'
    ) THEN
      ALTER TABLE direct_sales 
      ADD COLUMN is_archived BOOLEAN DEFAULT false NOT NULL;
      
      CREATE INDEX IF NOT EXISTS idx_direct_sales_archived 
      ON direct_sales(is_archived, created_at DESC);
      
      RAISE NOTICE '✅ Added is_archived column to direct_sales';
    ELSE
      RAISE NOTICE '⏭️  is_archived column already exists in direct_sales';
    END IF;
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN package_bookings.is_archived IS 'Soft delete flag - true when booking is archived instead of permanently deleted';
COMMENT ON COLUMN product_orders.is_archived IS 'Soft delete flag - true when booking is archived instead of permanently deleted';

-- Verification query - count active vs archived bookings
SELECT 
  'package_bookings' as table_name,
  COUNT(*) FILTER (WHERE is_archived = false) as active_bookings,
  COUNT(*) FILTER (WHERE is_archived = true) as archived_bookings,
  COUNT(*) as total_bookings
FROM package_bookings
UNION ALL
SELECT 
  'product_orders' as table_name,
  COUNT(*) FILTER (WHERE is_archived = false) as active_bookings,
  COUNT(*) FILTER (WHERE is_archived = true) as archived_bookings,
  COUNT(*) as total_bookings
FROM product_orders;

-- ✅ MIGRATION COMPLETE
-- New bookings are created with is_archived = false
-- Archive a booking: UPDATE package_bookings SET is_archived = true WHERE id = 'booking-id'
-- Restore a booking: UPDATE package_bookings SET is_archived = false WHERE id = 'booking-id'
-- View only active: SELECT ... WHERE is_archived = false
-- View only archived: SELECT ... WHERE is_archived = true
