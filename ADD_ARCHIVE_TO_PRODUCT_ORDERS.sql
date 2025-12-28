-- ===================================================================
-- 🔧 ADD is_archived COLUMN TO product_orders TABLE
-- ===================================================================
-- This migration adds the `is_archived` column to product_orders table
-- for invoice archiving functionality.
-- Run this in Supabase SQL Editor:
-- https://app.supabase.com/project/_/sql
-- ===================================================================

-- Add is_archived to product_orders table
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

-- Add documentation
COMMENT ON COLUMN product_orders.is_archived IS 'Soft delete flag for invoice archiving - true when archived';

-- Verification query (run after migration to confirm)
SELECT 'product_orders' AS table_name,
  COUNT(*) FILTER (WHERE is_archived = false) AS active_invoices,
  COUNT(*) FILTER (WHERE is_archived = true) AS archived_invoices,
  COUNT(*) AS total_invoices
FROM product_orders;

-- ✅ Done
