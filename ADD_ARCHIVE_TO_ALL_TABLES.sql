-- ============================================================
-- 🔧 ADD is_archived COLUMN TO ALL BOOKING TABLES
-- ============================================================
-- This migration adds the `is_archived` column to ALL booking tables
-- for the archive functionality to work properly.
-- Run this in Supabase SQL Editor:
-- https://app.supabase.com/project/_/sql
-- ============================================================

-- 1. Add is_archived to product_orders table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='product_orders') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name='product_orders' AND column_name='is_archived'
    ) THEN
      ALTER TABLE product_orders
      ADD COLUMN is_archived BOOLEAN DEFAULT false NOT NULL;

      CREATE INDEX IF NOT EXISTS idx_product_orders_archived
      ON product_orders(is_archived, created_at DESC);

      CREATE INDEX IF NOT EXISTS idx_product_orders_archived_franchise
      ON product_orders(franchise_id, is_archived, created_at DESC);

      RAISE NOTICE '✅ Added is_archived column to product_orders';
    ELSE
      RAISE NOTICE '⏭️ is_archived already exists on product_orders';
    END IF;
  ELSE
    RAISE NOTICE '❌ product_orders table not found';
  END IF;
END $$;

-- 2. Add is_archived to package_bookings table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='package_bookings') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name='package_bookings' AND column_name='is_archived'
    ) THEN
      ALTER TABLE package_bookings
      ADD COLUMN is_archived BOOLEAN DEFAULT false NOT NULL;

      CREATE INDEX IF NOT EXISTS idx_package_bookings_archived
      ON package_bookings(is_archived, created_at DESC);

      CREATE INDEX IF NOT EXISTS idx_package_bookings_archived_franchise
      ON package_bookings(franchise_id, is_archived, created_at DESC);

      RAISE NOTICE '✅ Added is_archived column to package_bookings';
    ELSE
      RAISE NOTICE '⏭️ is_archived already exists on package_bookings';
    END IF;
  ELSE
    RAISE NOTICE '❌ package_bookings table not found';
  END IF;
END $$;

-- 3. Add is_archived to direct_sales_orders table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='direct_sales_orders') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name='direct_sales_orders' AND column_name='is_archived'
    ) THEN
      ALTER TABLE direct_sales_orders
      ADD COLUMN is_archived BOOLEAN DEFAULT false NOT NULL;

      CREATE INDEX IF NOT EXISTS idx_direct_sales_orders_archived
      ON direct_sales_orders(is_archived, created_at DESC);

      CREATE INDEX IF NOT EXISTS idx_direct_sales_orders_archived_franchise
      ON direct_sales_orders(franchise_id, is_archived, created_at DESC);

      RAISE NOTICE '✅ Added is_archived column to direct_sales_orders';
    ELSE
      RAISE NOTICE '⏭️ is_archived already exists on direct_sales_orders';
    END IF;
  ELSE
    RAISE NOTICE '❌ direct_sales_orders table not found';
  END IF;
END $$;

-- 4. Add is_archived to bookings table (unified)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='bookings') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name='bookings' AND column_name='is_archived'
    ) THEN
      ALTER TABLE bookings
      ADD COLUMN is_archived BOOLEAN DEFAULT false NOT NULL;

      CREATE INDEX IF NOT EXISTS idx_bookings_archived
      ON bookings(is_archived, created_at DESC);

      CREATE INDEX IF NOT EXISTS idx_bookings_archived_franchise
      ON bookings(franchise_id, is_archived, created_at DESC);

      RAISE NOTICE '✅ Added is_archived column to bookings';
    ELSE
      RAISE NOTICE '⏭️ is_archived already exists on bookings';
    END IF;
  ELSE
    RAISE NOTICE '❌ bookings table not found';
  END IF;
END $$;

-- Add documentation
COMMENT ON COLUMN product_orders.is_archived IS 'Soft delete flag for archive functionality - true when archived';
COMMENT ON COLUMN package_bookings.is_archived IS 'Soft delete flag for archive functionality - true when archived';
COMMENT ON COLUMN direct_sales_orders.is_archived IS 'Soft delete flag for archive functionality - true when archived';

-- Verification query (run after migration to confirm)
SELECT 'product_orders' AS table_name,
  COUNT(*) FILTER (WHERE is_archived = false) AS active,
  COUNT(*) FILTER (WHERE is_archived = true) AS archived,
  COUNT(*) AS total
FROM product_orders
UNION ALL
SELECT 'package_bookings' AS table_name,
  COUNT(*) FILTER (WHERE is_archived = false) AS active,
  COUNT(*) FILTER (WHERE is_archived = true) AS archived,
  COUNT(*) AS total
FROM package_bookings
UNION ALL
SELECT 'direct_sales_orders' AS table_name,
  COUNT(*) FILTER (WHERE is_archived = false) AS active,
  COUNT(*) FILTER (WHERE is_archived = true) AS archived,
  COUNT(*) AS total
FROM direct_sales_orders;

-- ✅ Done - Archive functionality should now work for all booking types
