-- Quick Fix: Enable packages permission for franchise_admin users
-- Run this in Supabase SQL Editor

-- Option 1: Fix specific user (replace with your email)
UPDATE users 
SET permissions = jsonb_set(
  COALESCE(permissions, '{}'::jsonb),
  '{packages}',
  'true'::jsonb
),
updated_at = NOW()
WHERE role = 'franchise_admin' 
AND email = 'surat@safawala.com'; -- Replace with your email

-- Option 2: Fix ALL franchise_admin users at once
UPDATE users 
SET permissions = jsonb_set(
  COALESCE(permissions, '{}'::jsonb),
  '{packages}',
  'true'::jsonb
),
updated_at = NOW()
WHERE role = 'franchise_admin';

-- Verify the fix
SELECT 
  email,
  role,
  permissions->>'packages' as packages_permission,
  permissions->>'inventory' as inventory_permission
FROM users
WHERE role = 'franchise_admin';

-- Check total permission count (should be 22 keys)
SELECT 
  email,
  role,
  (SELECT COUNT(*) FROM jsonb_object_keys(permissions)) as permission_count,
  (SELECT COUNT(*) FROM jsonb_each(permissions) WHERE value::text = 'true') as enabled_count
FROM users
WHERE role = 'franchise_admin';

-- If permission_count < 22, you need to run the full migration:
-- Run: /Applications/safawala-crm/scripts/MIGRATE_TO_22_PERMISSIONS.sql
