-- Check Ritesh Deshmukh's current permissions and franchise
SELECT 
  id,
  name,
  email,
  role,
  franchise_id,
  is_active,
  permissions,
  created_at
FROM users
WHERE email ILIKE '%ritesh%' OR name ILIKE '%ritesh%'
ORDER BY created_at DESC;

-- Show all franchises to verify Surat Branch ID
SELECT id, name, code, city FROM franchises ORDER BY name;
