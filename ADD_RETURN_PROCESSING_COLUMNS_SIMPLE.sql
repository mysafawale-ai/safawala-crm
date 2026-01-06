-- Simple Migration: Add columns for return processing feature
-- Run this in Supabase SQL Editor

-- ============================================================================
-- PART 1: Add columns to deliveries table for return tracking
-- ============================================================================

ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS return_completed_at TIMESTAMPTZ;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS return_processed_by UUID;

-- ============================================================================
-- PART 2: Add columns to product_order_items for return quantities
-- ============================================================================

ALTER TABLE product_order_items ADD COLUMN IF NOT EXISTS return_lost_damaged INTEGER DEFAULT 0;
ALTER TABLE product_order_items ADD COLUMN IF NOT EXISTS return_used INTEGER DEFAULT 0;
ALTER TABLE product_order_items ADD COLUMN IF NOT EXISTS return_fresh INTEGER DEFAULT 0;
ALTER TABLE product_order_items ADD COLUMN IF NOT EXISTS return_processed BOOLEAN DEFAULT FALSE;
ALTER TABLE product_order_items ADD COLUMN IF NOT EXISTS return_processed_at TIMESTAMPTZ;

-- ============================================================================
-- PART 3: Add columns to package_booking_product_items for return quantities
-- ============================================================================

ALTER TABLE package_booking_product_items ADD COLUMN IF NOT EXISTS return_lost_damaged INTEGER DEFAULT 0;
ALTER TABLE package_booking_product_items ADD COLUMN IF NOT EXISTS return_used INTEGER DEFAULT 0;
ALTER TABLE package_booking_product_items ADD COLUMN IF NOT EXISTS return_fresh INTEGER DEFAULT 0;
ALTER TABLE package_booking_product_items ADD COLUMN IF NOT EXISTS return_processed BOOLEAN DEFAULT FALSE;
ALTER TABLE package_booking_product_items ADD COLUMN IF NOT EXISTS return_processed_at TIMESTAMPTZ;

-- ============================================================================
-- PART 4: Add lost_damaged_items JSON column to bookings tables
-- ============================================================================

ALTER TABLE product_orders ADD COLUMN IF NOT EXISTS lost_damaged_items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE product_orders ADD COLUMN IF NOT EXISTS return_status TEXT;
ALTER TABLE product_orders ADD COLUMN IF NOT EXISTS return_completed_at TIMESTAMPTZ;

ALTER TABLE package_bookings ADD COLUMN IF NOT EXISTS lost_damaged_items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE package_bookings ADD COLUMN IF NOT EXISTS return_status TEXT;
ALTER TABLE package_bookings ADD COLUMN IF NOT EXISTS return_completed_at TIMESTAMPTZ;

-- ============================================================================
-- PART 5: Create laundry_items table
-- ============================================================================

CREATE TABLE IF NOT EXISTS laundry_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID,
  product_id UUID,
  product_name TEXT NOT NULL,
  variant_name TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  status TEXT DEFAULT 'pending',
  source TEXT,
  source_id UUID,
  booking_id UUID,
  franchise_id UUID,
  created_by UUID,
  completed_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE laundry_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "laundry_allow_all" ON laundry_items;
CREATE POLICY "laundry_allow_all" ON laundry_items FOR ALL USING (TRUE);

-- ============================================================================
-- PART 6: Create inventory_movements table
-- ============================================================================

CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID,
  product_id UUID,
  movement_type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  previous_stock INTEGER,
  new_stock INTEGER,
  reference_type TEXT,
  reference_id UUID,
  notes TEXT,
  franchise_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "inventory_movements_allow_all" ON inventory_movements;
CREATE POLICY "inventory_movements_allow_all" ON inventory_movements FOR ALL USING (TRUE);

-- ============================================================================
-- PART 7: Create product_archive table
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_archive (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID,
  variant_id UUID,
  product_name TEXT NOT NULL,
  variant_name TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  reason TEXT,
  source TEXT,
  source_id UUID,
  booking_id UUID,
  franchise_id UUID,
  created_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE product_archive ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "product_archive_allow_all" ON product_archive;
CREATE POLICY "product_archive_allow_all" ON product_archive FOR ALL USING (TRUE);

-- Done!
SELECT 'Return processing migration completed successfully!' as message;
