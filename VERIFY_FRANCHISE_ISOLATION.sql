-- Verify deliveries are properly isolated by franchise

-- 1. Count deliveries by franchise
SELECT 
  f.name as franchise_name,
  COUNT(d.id) as delivery_count,
  COUNT(CASE WHEN d.status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN d.status = 'in_transit' THEN 1 END) as in_transit,
  COUNT(CASE WHEN d.status = 'delivered' THEN 1 END) as delivered,
  COUNT(CASE WHEN d.status = 'cancelled' THEN 1 END) as cancelled
FROM franchises f
LEFT JOIN deliveries d ON d.franchise_id = f.id
GROUP BY f.id, f.name
ORDER BY delivery_count DESC;

-- 2. Vadodara Branch specific count
SELECT 
  COUNT(*) as vadodara_deliveries,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN status = 'in_transit' THEN 1 END) as in_transit,
  COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered
FROM deliveries
WHERE franchise_id = '1a518dde-85b7-44ef-8bc4-092f53ddfd99';

-- 3. Show sample Vadodara deliveries
SELECT 
  delivery_number,
  status,
  delivery_date,
  created_at
FROM deliveries
WHERE franchise_id = '1a518dde-85b7-44ef-8bc4-092f53ddfd99'
ORDER BY created_at DESC
LIMIT 10;
