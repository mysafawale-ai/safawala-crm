-- =====================================================
-- FIX COUPON TABLE - Correct franchise_id reference
-- =====================================================
-- This fixes the franchise_id foreign key to reference
-- the franchises table instead of users table
-- Run this in Supabase SQL Editor
-- =====================================================

-- First, check if coupons table exists
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'coupons') THEN
        RAISE NOTICE 'Coupons table exists, checking structure...';
    ELSE
        RAISE NOTICE 'Coupons table does NOT exist - please run ADD_COUPON_SYSTEM.sql first!';
    END IF;
END $$;

-- Drop the existing foreign key constraint if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'coupons' AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%franchise_id%'
    ) THEN
        ALTER TABLE coupons DROP CONSTRAINT IF EXISTS coupons_franchise_id_fkey;
        RAISE NOTICE 'Dropped old franchise_id foreign key';
    END IF;
END $$;

-- Drop the existing franchise_id column if it has wrong type/reference
ALTER TABLE coupons DROP COLUMN IF EXISTS franchise_id CASCADE;

-- Add franchise_id column with correct reference
ALTER TABLE coupons 
ADD COLUMN franchise_id UUID;

-- Add foreign key constraint (but make it optional - NULL allowed for super admin coupons)
ALTER TABLE coupons 
ADD CONSTRAINT coupons_franchise_id_fkey 
FOREIGN KEY (franchise_id) REFERENCES franchises(id) ON DELETE CASCADE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_coupons_franchise ON coupons(franchise_id);

-- Verify the structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'coupons' 
ORDER BY ordinal_position;

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '✅ Coupon table franchise_id column fixed!';
    RAISE NOTICE 'Now the franchise_id correctly references the franchises table.';
END $$;
