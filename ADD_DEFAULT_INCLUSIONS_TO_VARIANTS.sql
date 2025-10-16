-- ========================================
-- ADD DEFAULT INCLUSIONS TO ALL VARIANTS
-- ========================================
-- This will add standard inclusions to all variants that currently have NULL inclusions
-- Run this if you want all variants to have default inclusions

-- First, let's see how many variants need inclusions
SELECT 
  COUNT(*) as total_variants,
  COUNT(CASE WHEN inclusions IS NULL THEN 1 END) as null_inclusions,
  COUNT(CASE WHEN inclusions IS NOT NULL THEN 1 END) as has_inclusions
FROM package_variants;

-- Preview what will be updated
SELECT 
  id,
  name,
  inclusions as current_inclusions
FROM package_variants
WHERE inclusions IS NULL
LIMIT 10;

-- ========================================
-- OPTION 1: Add Basic Inclusions to ALL null variants
-- ========================================
UPDATE package_variants
SET inclusions = '["Safas", "Accessories", "Delivery & Pickup"]'::jsonb,
    updated_at = NOW()
WHERE inclusions IS NULL;

-- ========================================
-- OPTION 2: Add variant-specific inclusions based on variant name
-- ========================================
-- Update Basic variants
UPDATE package_variants
SET inclusions = '["Traditional Safas", "Basic Accessories", "Delivery & Pickup"]'::jsonb,
    updated_at = NOW()
WHERE LOWER(name) = 'basic' AND inclusions IS NULL;

-- Update Premium variants
UPDATE package_variants
SET inclusions = '["Premium Safas", "Premium Accessories", "Decorative Items", "Professional Setup", "Delivery & Pickup"]'::jsonb,
    updated_at = NOW()
WHERE LOWER(name) IN ('premium', 'deluxe') AND inclusions IS NULL;

-- Update Luxury/Royal variants
UPDATE package_variants
SET inclusions = '["Royal Safas", "Designer Accessories", "Premium Decorative Items", "Professional Setup Team", "White Glove Delivery & Pickup"]'::jsonb,
    updated_at = NOW()
WHERE LOWER(name) IN ('luxury', 'royal', 'grand') AND inclusions IS NULL;

-- Update any remaining variants with generic inclusions
UPDATE package_variants
SET inclusions = '["Safas", "Accessories", "Delivery & Pickup"]'::jsonb,
    updated_at = NOW()
WHERE inclusions IS NULL;

-- ========================================
-- Verify the update
-- ========================================
SELECT 
  name,
  inclusions,
  updated_at
FROM package_variants
WHERE name IN ('Basic', 'Premium', 'Deluxe', 'Luxury')
ORDER BY name
LIMIT 20;

-- Check if any still have null
SELECT COUNT(*) as still_null
FROM package_variants
WHERE inclusions IS NULL;
