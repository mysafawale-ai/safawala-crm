-- Migration: Add missing invoice/booking fields
-- Run this in Supabase SQL Editor

-- =====================================================
-- 1. ADD PACKAGE SELECTION FIELDS TO PRODUCT_ORDERS
-- =====================================================

-- Package selection mode (products or package)
ALTER TABLE product_orders ADD COLUMN IF NOT EXISTS selection_mode TEXT DEFAULT 'products';

-- Package reference (if package mode selected)
ALTER TABLE product_orders ADD COLUMN IF NOT EXISTS package_id UUID REFERENCES package_sets(id);
ALTER TABLE product_orders ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES package_variants(id);

-- Custom pricing for packages
ALTER TABLE product_orders ADD COLUMN IF NOT EXISTS use_custom_pricing BOOLEAN DEFAULT false;
ALTER TABLE product_orders ADD COLUMN IF NOT EXISTS custom_package_price DECIMAL(12,2) DEFAULT 0;

-- Discount type (fixed or percentage)
ALTER TABLE product_orders ADD COLUMN IF NOT EXISTS discount_type TEXT DEFAULT 'fixed';

-- =====================================================
-- 2. CREATE LOST/DAMAGED ITEMS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS order_lost_damaged_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES product_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name TEXT NOT NULL,
  barcode TEXT,
  type TEXT NOT NULL CHECK (type IN ('lost', 'damaged')),
  quantity INTEGER NOT NULL DEFAULT 1,
  charge_per_item DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_charge DECIMAL(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_order_lost_damaged_order_id ON order_lost_damaged_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_lost_damaged_product_id ON order_lost_damaged_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_lost_damaged_type ON order_lost_damaged_items(type);

-- Enable RLS
ALTER TABLE order_lost_damaged_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow all operations for authenticated users (franchise isolation via order)
CREATE POLICY "Users can view lost/damaged items for their orders"
  ON order_lost_damaged_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM product_orders po 
      WHERE po.id = order_lost_damaged_items.order_id
    )
  );

CREATE POLICY "Users can insert lost/damaged items"
  ON order_lost_damaged_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM product_orders po 
      WHERE po.id = order_lost_damaged_items.order_id
    )
  );

CREATE POLICY "Users can update lost/damaged items"
  ON order_lost_damaged_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM product_orders po 
      WHERE po.id = order_lost_damaged_items.order_id
    )
  );

CREATE POLICY "Users can delete lost/damaged items"
  ON order_lost_damaged_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM product_orders po 
      WHERE po.id = order_lost_damaged_items.order_id
    )
  );

-- =====================================================
-- 3. VERIFY COLUMNS ADDED
-- =====================================================

-- Check product_orders columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'product_orders' 
AND column_name IN ('selection_mode', 'package_id', 'variant_id', 'use_custom_pricing', 'custom_package_price', 'discount_type');

-- Check order_lost_damaged_items table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'order_lost_damaged_items';
