-- Migration: Add columns for return processing feature
-- Run this in Supabase SQL Editor

-- ============================================================================
-- PART 1: Add columns to deliveries table for return tracking
-- ============================================================================

ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS return_completed_at TIMESTAMPTZ;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS return_processed_by UUID REFERENCES users(id);

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
-- PART 5: Create laundry_items table if not exists
-- ============================================================================

CREATE TABLE IF NOT EXISTS laundry_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID REFERENCES product_variants(id),
  product_id UUID REFERENCES products(id),
  product_name TEXT NOT NULL,
  variant_name TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, washing, drying, ready, completed
  source TEXT, -- 'return', 'manual'
  source_id UUID, -- delivery_id or other reference
  booking_id UUID,
  franchise_id UUID REFERENCES franchises(id),
  created_by UUID REFERENCES users(id),
  completed_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE laundry_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for laundry_items
DROP POLICY IF EXISTS "super_admin_all_laundry" ON laundry_items;
DROP POLICY IF EXISTS "franchise_users_own_laundry" ON laundry_items;

CREATE POLICY "super_admin_all_laundry" ON laundry_items
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'super_admin'
    AND users.is_active = true
  )
);

CREATE POLICY "franchise_users_own_laundry" ON laundry_items
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.franchise_id = laundry_items.franchise_id
    AND users.is_active = true
  )
);

-- ============================================================================
-- PART 6: Create inventory_movements table for tracking stock changes
-- ============================================================================

CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID REFERENCES product_variants(id),
  product_id UUID REFERENCES products(id),
  movement_type TEXT NOT NULL, -- 'return', 'sale', 'adjustment', 'purchase', 'transfer'
  quantity INTEGER NOT NULL,
  previous_stock INTEGER,
  new_stock INTEGER,
  reference_type TEXT, -- 'delivery_return', 'booking', 'manual'
  reference_id UUID,
  notes TEXT,
  franchise_id UUID REFERENCES franchises(id),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for inventory_movements
DROP POLICY IF EXISTS "super_admin_all_inventory_movements" ON inventory_movements;
DROP POLICY IF EXISTS "franchise_users_own_inventory_movements" ON inventory_movements;

CREATE POLICY "super_admin_all_inventory_movements" ON inventory_movements
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'super_admin'
    AND users.is_active = true
  )
);

CREATE POLICY "franchise_users_own_inventory_movements" ON inventory_movements
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.franchise_id = inventory_movements.franchise_id
    AND users.is_active = true
  )
);

-- ============================================================================
-- PART 7: Create product_archive table for lost/damaged tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_archive (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  product_name TEXT NOT NULL,
  variant_name TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  reason TEXT, -- 'lost_damaged', 'expired', 'defective', 'other'
  source TEXT, -- 'delivery_return', 'manual', 'inventory_audit'
  source_id UUID,
  booking_id UUID,
  franchise_id UUID REFERENCES franchises(id),
  created_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE product_archive ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "super_admin_all_product_archive" ON product_archive;
DROP POLICY IF EXISTS "franchise_users_own_product_archive" ON product_archive;

CREATE POLICY "super_admin_all_product_archive" ON product_archive
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'super_admin'
    AND users.is_active = true
  )
);

CREATE POLICY "franchise_users_own_product_archive" ON product_archive
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.franchise_id = product_archive.franchise_id
    AND users.is_active = true
  )
);

-- ============================================================================
-- PART 8: Create indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_laundry_items_status ON laundry_items(status);
CREATE INDEX IF NOT EXISTS idx_laundry_items_franchise ON laundry_items(franchise_id);
CREATE INDEX IF NOT EXISTS idx_laundry_items_created_at ON laundry_items(created_at);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_variant ON inventory_movements(variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_type ON inventory_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_franchise ON inventory_movements(franchise_id);

CREATE INDEX IF NOT EXISTS idx_product_archive_reason ON product_archive(reason);
CREATE INDEX IF NOT EXISTS idx_product_archive_franchise ON product_archive(franchise_id);
CREATE INDEX IF NOT EXISTS idx_product_archive_created_at ON product_archive(created_at);

-- Done!
SELECT 'Return processing migration completed!' as message;
