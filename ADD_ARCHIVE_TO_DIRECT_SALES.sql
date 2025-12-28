-- ===================================================================
-- 🔧 ADD is_archived COLUMN TO direct_sales_orders TABLE
-- ===================================================================
-- This migration adds the `is_archived` column to direct_sales_orders table
-- for archive functionality.
-- Run this in Supabase SQL Editor:
-- https://app.supabase.com/project/_/sql
-- ===================================================================

-- Add is_archived to direct_sales_orders table
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

-- Add documentation
COMMENT ON COLUMN direct_sales_orders.is_archived IS 'Soft delete flag for archive functionality - true when archived';

-- Verification query (run after migration to confirm)
SELECT 'direct_sales_orders' AS table_name,
  COUNT(*) FILTER (WHERE is_archived = false) AS active_orders,
  COUNT(*) FILTER (WHERE is_archived = true) AS archived_orders,
  COUNT(*) AS total_orders
FROM direct_sales_orders;

-- ✅ Done
