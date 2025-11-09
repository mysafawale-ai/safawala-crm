-- Fix franchise admin permissions to include vendors and all necessary modules
-- Issue: Existing franchise_admin users had outdated permissions in the database
-- that were missing 'vendors', 'packages', and other modules.
-- 
-- The auth-middleware.ts has correct defaults, but these only apply if permissions 
-- is NULL or empty in the database. Existing users with partial permissions 
-- don't get the defaults applied.
--
-- Solution: Update all franchise_admin users with complete, correct permissions

-- Step 1: View current state of franchise_admin permissions
-- SELECT 
--   id,
--   email,
--   role,
--   permissions,
--   permissions->>'vendors' as has_vendors,
--   permissions->>'packages' as has_packages
-- FROM users
-- WHERE role = 'franchise_admin'
-- LIMIT 10;

-- Step 2: Update all franchise_admin users with correct permissions
UPDATE users
SET permissions = jsonb_build_object(
  'dashboard', TRUE,
  'bookings', TRUE,
  'customers', TRUE,
  'inventory', TRUE,
  'packages', TRUE,
  'vendors', TRUE,
  'quotes', TRUE,
  'invoices', TRUE,
  'laundry', TRUE,
  'expenses', TRUE,
  'deliveries', TRUE,
  'productArchive', TRUE,
  'payroll', TRUE,
  'attendance', TRUE,
  'reports', TRUE,
  'financials', TRUE,
  'franchises', FALSE,      -- Only super_admin can see franchises
  'staff', TRUE,
  'integrations', FALSE,    -- Only super_admin can see integrations
  'settings', TRUE
)
WHERE role = 'franchise_admin'
AND is_active = TRUE;

-- Step 3: Verify the update
SELECT 
  email,
  role,
  (permissions->>'vendors')::boolean as vendors,
  (permissions->>'packages')::boolean as packages,
  (permissions->>'staff')::boolean as staff,
  (permissions->>'franchises')::boolean as franchises
FROM users
WHERE role = 'franchise_admin'
AND is_active = TRUE
ORDER BY email;

-- SUMMARY OF CHANGES:
-- ✅ vendors: false → true (enables vendor management)
-- ✅ packages: false → true (enables package/set management)
-- ✅ staff: false → true (enables staff management)
-- ✅ All other modules now have correct values
-- ✅ franchises: stays false (correct, only super_admin)
-- ✅ integrations: stays false (correct, only super_admin)
