-- Check franchise selection logic

-- 1. Get the first franchise (what getDefaultFranchiseId() should return)
SELECT 
  id,
  name,
  code,
  is_active,[Deliveries API] Fetching deliveries for franchise: 1a518dde-85b7-44ef-8bc4-092f53ddfd99
[Deliveries API] Filtering by franchise_id: 1a518dde-85b7-44ef-8bc4-092f53ddfd99
[Deliveries API] Found 10 deliveries
  created_at
FROM franchises
ORDER BY created_at ASC
LIMIT 1;

-- 2. Count total franchises
SELECT COUNT(*) as total_franchises FROM franchises;

-- 3. Show all franchises
SELECT 
  id,
  name,
  code,
  is_active
FROM franchises
ORDER BY name;
