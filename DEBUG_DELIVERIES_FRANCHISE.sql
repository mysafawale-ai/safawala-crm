-- Debug: Check franchise_id in deliveries

-- 1. Check what franchise_id values exist in deliveries
SELECT 
  franchise_id,
  COUNT(*) as delivery_count
FROM deliveries
GROUP BY franchise_id
ORDER BY delivery_count DESC;

-- 2. Check what the default franchise is
SELECT 
  id as franchise_id,
  name,
  code,
  is_active
FROM franchises
ORDER BY created_at ASC
LIMIT 1;

-- 3. Check deliveries without franchise_id
SELECT 
  id,
  delivery_number,
  customer_id,
  franchise_id,
  created_at
FROM deliveries
WHERE franchise_id IS NULL
ORDER BY created_at DESC
LIMIT 10;

-- 4. Check recent deliveries with their franchise info
SELECT 
  d.id,
  d.delivery_number,
  d.status,
  d.franchise_id,
  f.name as franchise_name,
  d.created_at
FROM deliveries d
LEFT JOIN franchises f ON d.franchise_id = f.id
ORDER BY d.created_at DESC
LIMIT 10;
