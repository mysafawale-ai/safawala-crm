-- ================================================================
-- DELETE CUSTOMER USER ACCOUNT (SAFER ALTERNATIVE)
-- ================================================================
-- This script deletes ONLY the customer user account
-- Does NOT delete the franchise, products, or orders
-- Use this if you just want to remove customer access
-- ================================================================

-- STEP 1: IDENTIFY THE CUSTOMER USER
-- ================================================================
SELECT 
  id,
  email,
  name,
  role,
  franchise_id,
  is_active,
  created_at
FROM users
WHERE email = 'vadodara@safawala.com'
LIMIT 5;

-- ================================================================
-- STEP 2: SHOW WHAT WILL BE DELETED
-- ================================================================
SELECT 
  COUNT(*) as users_to_delete,
  'User account(s) will be deleted' as action
FROM users
WHERE email = 'vadodara@safawala.com';

-- ================================================================
-- STEP 3: CHECK IF THERE ARE DEPENDENT RECORDS
-- ================================================================
-- Show all records that reference this user
SELECT 
  u.email,
  (SELECT COUNT(*) FROM orders WHERE created_by = u.id) as orders_created_by_user,
  (SELECT COUNT(*) FROM deliveries WHERE assigned_staff_id = u.id) as deliveries_assigned,
  (SELECT COUNT(*) FROM audit_logs WHERE user_id = u.id) as audit_log_entries
FROM users u
WHERE u.email = 'vadodara@safawala.com';

-- ================================================================
-- STEP 4: DELETE THE USER ACCOUNT (SAFE)
-- ================================================================

BEGIN;  -- Start transaction

-- Option A: Just delete the user (keep franchise intact)
DELETE FROM users
WHERE email = 'vadodara@safawala.com';

COMMIT;  -- Confirm deletion

-- ================================================================
-- STEP 5: VERIFICATION
-- ================================================================
SELECT COUNT(*) as users_with_vadodara_email
FROM users
WHERE email LIKE '%vadodara%';

-- Should return: 0

-- ================================================================
-- ALTERNATIVE: SOFT DELETE (Deactivate instead of delete)
-- ================================================================
-- If you want to keep the record but prevent login, use this instead:
--
-- BEGIN;
-- UPDATE users
-- SET is_active = false,
--     updated_at = NOW()
-- WHERE email = 'vadodara@safawala.com';
-- COMMIT;
--
-- This way the user account still exists (for audit trail)
-- but cannot log in anymore
-- ================================================================

-- ================================================================
-- WHAT STAYS INTACT AFTER THIS DELETION
-- ================================================================
-- ✅ Franchise account (vadodara@safawala.com)
-- ✅ All products
-- ✅ All bookings/orders/deliveries
-- ✅ All customer data
-- ✅ All images
-- ✅ All financial records
--
-- ❌ DELETED: Only the user account for vadodara@safawala.com
-- ================================================================
