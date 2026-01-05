-- Migration: Add package item tracking
-- This allows us to know which items were included in a package selection

-- Add column to track if item is part of a package
ALTER TABLE product_order_items ADD COLUMN IF NOT EXISTS is_package_item BOOLEAN DEFAULT false;

-- Add column to store the variant_id that this item belongs to (for package items)
ALTER TABLE product_order_items ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES package_variants(id) ON DELETE SET NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_product_order_items_variant_id ON product_order_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_product_order_items_is_package_item ON product_order_items(is_package_item);

-- This allows us to query: "Which products were selected for this package order?"
-- SELECT * FROM product_order_items 
-- WHERE order_id = '...' AND variant_id = '...' AND is_package_item = true
-- ORDER BY created_at;
