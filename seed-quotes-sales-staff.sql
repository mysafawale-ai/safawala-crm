-- Seed Script: Add sales_closed_by_id to existing quotes
-- This updates existing quotes with sample staff members for testing

-- First, check if we have staff/users to assign
SELECT 
    'Available Staff Members:' as info,
    id,
    name,
    email,
    role,
    franchise_id
FROM users
WHERE role IN ('staff', 'franchise_admin', 'admin')
ORDER BY created_at
LIMIT 10;

-- Update existing quotes with sales_closed_by_id
-- This assigns them to the first available staff member
DO $$
DECLARE
    staff_id_to_use UUID;
BEGIN
    -- Get the first staff member
    SELECT id INTO staff_id_to_use
    FROM users
    WHERE role IN ('staff', 'franchise_admin', 'admin')
    AND is_active = true
    ORDER BY created_at
    LIMIT 1;
    
    IF staff_id_to_use IS NOT NULL THEN
        -- Update quotes that don't have sales_closed_by_id set
        UPDATE quotes
        SET sales_closed_by_id = staff_id_to_use
        WHERE sales_closed_by_id IS NULL;
        
        RAISE NOTICE 'Updated quotes with sales_closed_by_id: %', staff_id_to_use;
    ELSE
        RAISE NOTICE 'No staff members found. Please create staff users first.';
    END IF;
END $$;

-- Verify the updates
SELECT 
    '=== UPDATED QUOTES WITH SALES STAFF ===' as section;

SELECT 
    q.id,
    q.quote_number,
    q.customer_id,
    c.name as customer_name,
    q.total_amount,
    q.security_deposit,
    q.sales_closed_by_id,
    s.name as sales_staff_name,
    s.email as sales_staff_email,
    s.role as sales_staff_role,
    q.created_at
FROM quotes q
LEFT JOIN customers c ON c.id = q.customer_id
LEFT JOIN staff s ON s.id = q.sales_closed_by_id
ORDER BY q.created_at DESC
LIMIT 10;

-- Summary statistics
SELECT 
    '=== SUMMARY ===' as section,
    COUNT(*) as total_quotes,
    COUNT(sales_closed_by_id) as quotes_with_sales_staff,
    COUNT(*) - COUNT(sales_closed_by_id) as quotes_without_sales_staff,
    ROUND(COUNT(sales_closed_by_id)::numeric / NULLIF(COUNT(*), 0) * 100, 2) as percentage_assigned
FROM quotes;
