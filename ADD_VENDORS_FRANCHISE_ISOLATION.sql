-- =====================================================
-- VENDOR SCHEMA ENHANCEMENT & FRANCHISE ISOLATION
-- =====================================================
-- Purpose: Add missing columns to vendors table for franchise isolation and proper data structure
-- This migration adds columns that the UI expects but are missing from the database schema

-- Add franchise_id for multi-tenant isolation
ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS franchise_id UUID REFERENCES franchises(id);

-- Add contact_person column (UI uses this field)
ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS contact_person VARCHAR(255);

-- Add pricing_per_item column (UI uses this field)
ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS pricing_per_item DECIMAL(10,2) DEFAULT 0;

-- Add is_active column for soft-delete functionality
ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Add notes column (UI uses this field)
ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create index on franchise_id for query performance
CREATE INDEX IF NOT EXISTS idx_vendors_franchise_id ON vendors(franchise_id);

-- Create index on is_active for filtering
CREATE INDEX IF NOT EXISTS idx_vendors_is_active ON vendors(is_active);

-- Create composite index for franchise + active vendors
CREATE INDEX IF NOT EXISTS idx_vendors_franchise_active 
ON vendors(franchise_id, is_active) 
WHERE is_active = TRUE;

-- Update existing vendors to set is_active = TRUE (if any exist)
UPDATE vendors 
SET is_active = TRUE 
WHERE is_active IS NULL;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify the migration succeeded:

-- 1. Check if all columns exist
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'vendors'
ORDER BY ordinal_position;

-- 2. Check indexes
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'vendors';

-- 3. Count active vendors by franchise
SELECT 
    franchise_id,
    COUNT(*) as active_vendors
FROM vendors 
WHERE is_active = TRUE
GROUP BY franchise_id;
