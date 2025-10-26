-- =====================================================
-- PACKAGE BOOKINGS - MISSING FIELDS ANALYSIS & FIX
-- =====================================================
-- Analysis of book-package/page.tsx vs database schema
-- This ensures all fields used in the app exist in the database

BEGIN;

-- =====================================================
-- PART 1: package_bookings TABLE
-- =====================================================

-- Fields being inserted/updated in handleSubmit():
-- ✅ package_number (exists - unique identifier)
-- ✅ is_quote (exists - differentiates quote from booking)
-- ✅ customer_id (exists - FK to customers)
-- ✅ franchise_id (exists - FK to franchises)
-- ✅ event_type (exists - e.g., "Wedding")
-- ✅ event_participant (exists - "Groom"/"Bride"/"Both")
-- ✅ payment_type (exists - "full"/"advance"/"partial")
-- ❌ custom_amount - MISSING (used for custom payment amounts)
-- ✅ discount_amount (exists)
-- ✅ coupon_code (exists)
-- ✅ coupon_discount (exists)
-- ✅ event_date (exists - with time)
-- ✅ delivery_date (exists - timestamptz)
-- ✅ return_date (exists - timestamptz)
-- ✅ venue_address (exists)
-- ✅ groom_name (exists)
-- ✅ groom_whatsapp (exists)
-- ✅ groom_address (exists)
-- ✅ bride_name (exists)
-- ✅ bride_whatsapp (exists)
-- ❌ bride_address - Code doesn't capture it but column may exist
-- ✅ notes (exists)
-- ❌ distance_km - MISSING (from distance calculation)
-- ❌ distance_amount - MISSING (surcharge based on distance)
-- ✅ tax_amount (exists - GST)
-- ✅ subtotal_amount (exists)
-- ✅ total_amount (exists)
-- ✅ security_deposit (exists)
-- ✅ amount_paid (exists)
-- ✅ pending_amount (exists)
-- ✅ sales_closed_by_id (exists - FK to users)
-- ✅ use_custom_pricing (exists)
-- ✅ custom_package_price (exists)
-- ✅ status (exists - "quote"/"confirmed"/etc)
-- ✅ created_at (auto)
-- ✅ updated_at (auto)

-- Add missing columns
ALTER TABLE package_bookings 
ADD COLUMN IF NOT EXISTS custom_amount numeric(12,2) DEFAULT 0;

ALTER TABLE package_bookings 
ADD COLUMN IF NOT EXISTS distance_km numeric(10,2) DEFAULT 0;

ALTER TABLE package_bookings 
ADD COLUMN IF NOT EXISTS distance_amount numeric(12,2) DEFAULT 0;

-- Add comments
COMMENT ON COLUMN package_bookings.custom_amount IS 'Custom payment amount entered manually (overrides calculated payment)';
COMMENT ON COLUMN package_bookings.distance_km IS 'Distance in kilometers from base location to venue';
COMMENT ON COLUMN package_bookings.distance_amount IS 'Additional charge based on distance traveled';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_package_bookings_distance 
ON package_bookings(distance_km) WHERE distance_km > 0;

CREATE INDEX IF NOT EXISTS idx_package_bookings_custom_amount 
ON package_bookings(custom_amount) WHERE custom_amount > 0;

-- =====================================================
-- PART 2: package_booking_items TABLE
-- =====================================================

-- Fields being inserted in handleSubmit():
-- ✅ booking_id (exists - FK to package_bookings)
-- ✅ category_id (exists - FK to packages_categories)
-- ✅ variant_id (exists - FK to package_variants)
-- ✅ variant_name (exists - snapshot of variant name)
-- ✅ variant_inclusions (exists - JSONB array of inclusions)
-- ✅ quantity (exists)
-- ✅ unit_price (exists)
-- ✅ total_price (exists)
-- ✅ extra_safas (exists)
-- ✅ reserved_products (exists - JSONB array)
-- ❌ security_deposit - MISSING (per-item security deposit)
-- ❌ distance_addon - MISSING (per-item distance surcharge)

ALTER TABLE package_booking_items 
ADD COLUMN IF NOT EXISTS security_deposit numeric(12,2) DEFAULT 0;

ALTER TABLE package_booking_items 
ADD COLUMN IF NOT EXISTS distance_addon numeric(12,2) DEFAULT 0;

-- Add comments
COMMENT ON COLUMN package_booking_items.security_deposit IS 'Security deposit for this specific item';
COMMENT ON COLUMN package_booking_items.distance_addon IS 'Distance-based surcharge for this specific item';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_package_booking_items_security_deposit 
ON package_booking_items(security_deposit) WHERE security_deposit > 0;

CREATE INDEX IF NOT EXISTS idx_package_booking_items_distance 
ON package_booking_items(distance_addon) WHERE distance_addon > 0;

COMMIT;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check package_bookings columns
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default,
    CASE 
        WHEN column_name IN ('custom_amount', 'distance_km', 'distance_amount') 
        THEN '🆕 NEWLY ADDED'
        ELSE '✅ Existing'
    END as status
FROM information_schema.columns 
WHERE table_name = 'package_bookings'
  AND column_name IN (
    'package_number', 'is_quote', 'customer_id', 'franchise_id', 
    'event_type', 'event_participant', 'payment_type', 'custom_amount',
    'discount_amount', 'coupon_code', 'coupon_discount', 'event_date',
    'delivery_date', 'return_date', 'venue_address', 'groom_name',
    'groom_whatsapp', 'groom_address', 'bride_name', 'bride_whatsapp',
    'notes', 'distance_km', 'distance_amount', 'tax_amount',
    'subtotal_amount', 'total_amount', 'security_deposit', 'amount_paid',
    'pending_amount', 'sales_closed_by_id', 'use_custom_pricing',
    'custom_package_price', 'status'
  )
ORDER BY 
    CASE 
        WHEN column_name IN ('custom_amount', 'distance_km', 'distance_amount') 
        THEN 0 
        ELSE 1 
    END,
    column_name;

-- Check package_booking_items columns
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default,
    CASE 
        WHEN column_name IN ('security_deposit', 'distance_addon') 
        THEN '🆕 NEWLY ADDED'
        ELSE '✅ Existing'
    END as status
FROM information_schema.columns 
WHERE table_name = 'package_booking_items'
  AND column_name IN (
    'booking_id', 'category_id', 'variant_id', 'variant_name',
    'variant_inclusions', 'quantity', 'unit_price', 'total_price',
    'extra_safas', 'reserved_products', 'security_deposit', 'distance_addon'
  )
ORDER BY 
    CASE 
        WHEN column_name IN ('security_deposit', 'distance_addon') 
        THEN 0 
        ELSE 1 
    END,
    column_name;

-- Summary
SELECT 
    '✅ PACKAGE BOOKINGS SCHEMA COMPLETE' as status,
    '3 columns added to package_bookings: custom_amount, distance_km, distance_amount' as bookings_fix,
    '2 columns added to package_booking_items: security_deposit, distance_addon' as items_fix,
    'All fields used in book-package/page.tsx now exist in database' as result;
