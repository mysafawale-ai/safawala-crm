-- Check franchise selection logic

-- 1. Get the first franchise (what getDefaultFranchiseId should return)
SELECT 
  id,
  name,
  code,
  is_active,
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
