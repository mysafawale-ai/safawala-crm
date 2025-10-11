-- =====================================================
-- UPDATE EXISTING VENDORS WITH FRANCHISE ID
-- =====================================================
-- Purpose: Assign franchise_id to vendors that were created before the migration
-- This ensures all vendors are properly isolated to a franchise

-- First, let's see which franchises exist
SELECT id, name, display_name 
FROM franchises 
ORDER BY created_at;

-- Option 1: If you want to assign all existing vendors to a specific franchise
-- Replace 'YOUR_FRANCHISE_ID_HERE' with the actual franchise ID from above query
/*
UPDATE vendors 
SET franchise_id = 'YOUR_FRANCHISE_ID_HERE'
WHERE franchise_id IS NULL;
*/

-- Option 2: If you want to assign vendors to the first/default franchise
-- This will automatically use the first franchise in your system
/*
UPDATE vendors 
SET franchise_id = (SELECT id FROM franchises ORDER BY created_at LIMIT 1)
WHERE franchise_id IS NULL;
*/

-- Option 3: If you want to delete vendors without franchise_id (use with caution!)
/*
DELETE FROM vendors 
WHERE franchise_id IS NULL;
*/

-- After updating, verify all vendors have franchise_id
SELECT 
    id,
    name,
    franchise_id,
    is_active
FROM vendors 
ORDER BY created_at;

-- Count vendors by franchise
SELECT 
    f.name as franchise_name,
    COUNT(v.id) as vendor_count
FROM vendors v
LEFT JOIN franchises f ON v.franchise_id = f.id
WHERE v.is_active = TRUE
GROUP BY f.id, f.name
ORDER BY vendor_count DESC;
