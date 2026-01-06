/**
 * IMPORTANT: Apply the following SQL migration to your Supabase database
 * 
 * You can do this by:
 * 1. Going to Supabase Dashboard > SQL Editor
 * 2. Creating a new query and pasting the SQL below
 * 3. Running the query
 * 
 * OR
 * 
 * Copy and paste this into your Supabase SQL editor:
 */

-- Migration: Denormalize product details in product_order_items
-- This fixes the issue where items disappear if products table changes or has RLS issues

-- Add denormalized product details columns to product_order_items
ALTER TABLE product_order_items ADD COLUMN IF NOT EXISTS product_name TEXT;
ALTER TABLE product_order_items ADD COLUMN IF NOT EXISTS barcode TEXT;
ALTER TABLE product_order_items ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE product_order_items ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_order_items_barcode ON product_order_items(barcode);
CREATE INDEX IF NOT EXISTS idx_product_order_items_product_name ON product_order_items(product_name);

-- Verify the columns were added
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name='product_order_items' 
ORDER BY column_name;
