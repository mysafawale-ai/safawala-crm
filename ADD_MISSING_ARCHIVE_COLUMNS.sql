-- ===================================================================
-- 🔧 ADD MISSING is_archived COLUMNS
-- ===================================================================
-- This migration adds the `is_archived` column to tables that were
-- missed by the previous migration. Run this in Supabase SQL Editor:
-- https://app.supabase.com/project/_/sql
-- ===================================================================

-- Add is_archived to direct_sales_orders (if table exists)
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

      RAISE NOTICE '✅ Added is_archived column to direct_sales_orders';
    ELSE
      RAISE NOTICE '⏭️ is_archived already exists on direct_sales_orders';
    END IF;
  END IF;
END $$;

-- Add is_archived to bookings (legacy unified table) if present
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

      RAISE NOTICE '✅ Added is_archived column to bookings';
    ELSE
      RAISE NOTICE '⏭️ is_archived already exists on bookings';
    END IF;
  END IF;
END $$;

-- Documentation comments
COMMENT ON COLUMN direct_sales_orders.is_archived IS 'Soft delete flag - true when archived';
COMMENT ON COLUMN bookings.is_archived IS 'Soft delete flag - true when archived';

-- Verification queries (run after migration to confirm counts)
SELECT 'direct_sales_orders' AS table_name,
  COUNT(*) FILTER (WHERE is_archived = false) AS active_bookings,
  COUNT(*) FILTER (WHERE is_archived = true) AS archived_bookings,
  COUNT(*) AS total_bookings
FROM direct_sales_orders
UNION ALL
SELECT 'bookings' AS table_name,
  COUNT(*) FILTER (WHERE is_archived = false) AS active_bookings,
  COUNT(*) FILTER (WHERE is_archived = true) AS archived_bookings,
  COUNT(*) AS total_bookings
FROM bookings;

-- ✅ Done
