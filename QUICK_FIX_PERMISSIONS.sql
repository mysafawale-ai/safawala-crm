-- Quick fix for all user permissions
-- Updates missing or broken permissions with role-based defaults

UPDATE users
SET permissions = CASE role
  WHEN 'super_admin' THEN '{"dashboard":true,"bookings":true,"customers":true,"inventory":true,"sales":true,"laundry":true,"purchases":true,"expenses":true,"deliveries":true,"reports":true,"financials":true,"invoices":true,"franchises":true,"staff":true,"settings":true}'::jsonb
  WHEN 'franchise_admin' THEN '{"dashboard":true,"bookings":true,"customers":true,"inventory":true,"sales":true,"laundry":true,"purchases":true,"expenses":true,"deliveries":true,"reports":true,"financials":true,"invoices":true,"franchises":false,"staff":true,"settings":true}'::jsonb
  WHEN 'staff' THEN '{"dashboard":true,"bookings":true,"customers":true,"inventory":true,"sales":true,"laundry":true,"purchases":false,"expenses":false,"deliveries":true,"reports":false,"financials":false,"invoices":true,"franchises":false,"staff":false,"settings":false}'::jsonb
  WHEN 'readonly' THEN '{"dashboard":true,"bookings":true,"customers":true,"inventory":true,"sales":false,"laundry":false,"purchases":false,"expenses":false,"deliveries":true,"reports":true,"financials":false,"invoices":false,"franchises":false,"staff":false,"settings":false}'::jsonb
  ELSE '{"dashboard":true,"bookings":false,"customers":false,"inventory":false,"sales":false,"laundry":false,"purchases":false,"expenses":false,"deliveries":false,"reports":false,"financials":false,"invoices":false,"franchises":false,"staff":false,"settings":false}'::jsonb
END,
updated_at = NOW()
WHERE is_active = true;

-- Verify results
SELECT name, email, role, permissions->'dashboard' as has_dashboard FROM users WHERE is_active = true LIMIT 10;
