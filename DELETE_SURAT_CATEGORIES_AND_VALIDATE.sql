-- Step 1: Find the franchise_id for surat@safawala.com
SELECT 
  u.id as user_id,
  u.email,
  u.franchise_id,
  f.name as franchise_name
FROM users u
LEFT JOIN franchises f ON u.franchise_id = f.id
WHERE u.email = 'surat@safawala.com';

-- Step 2: Check current categories and their franchise ownership
SELECT 
  id,
  name,
  description,
  franchise_id,
  parent_id,
  is_active,
  (SELECT name FROM franchises WHERE id = product_categories.franchise_id) as franchise_name,
  CASE 
    WHEN franchise_id IS NULL THEN 'Global (All Franchises)'
    ELSE 'Franchise Specific'
  END as category_type
FROM product_categories
ORDER BY franchise_id NULLS FIRST, name;

-- Step 3: Get Surat franchise ID
DO $$
DECLARE
  v_surat_franchise_id UUID;
BEGIN
  -- Get Surat franchise ID
  SELECT franchise_id INTO v_surat_franchise_id
  FROM users
  WHERE email = 'surat@safawala.com'
  LIMIT 1;

  RAISE NOTICE 'Surat Franchise ID: %', v_surat_franchise_id;

  -- Delete categories belonging to Surat franchise
  -- This will delete: Accessories, Live Safa, Party Wear, Safa (if they belong to Surat)
  DELETE FROM product_categories
  WHERE franchise_id = v_surat_franchise_id;

  RAISE NOTICE 'Deleted categories for Surat franchise';
END $$;

-- Step 4: Verify deletion - Show remaining categories
SELECT 
  id,
  name,
  description,
  franchise_id,
  (SELECT name FROM franchises WHERE id = product_categories.franchise_id) as franchise_name,
  CASE 
    WHEN franchise_id IS NULL THEN 'Global (All Franchises)'
    ELSE 'Franchise Specific'
  END as category_type
FROM product_categories
ORDER BY franchise_id NULLS FIRST, name;

-- Step 5: Validate franchise isolation
-- Check if Surat user can see other franchise categories (should not!)
SELECT 
  pc.id,
  pc.name,
  pc.franchise_id,
  f.name as franchise_name,
  u.email as surat_user_email,
  u.franchise_id as surat_franchise_id,
  CASE 
    WHEN pc.franchise_id = u.franchise_id THEN '✅ Surat CAN see (own franchise)'
    WHEN pc.franchise_id IS NULL THEN '✅ Surat CAN see (global category)'
    ELSE '❌ Surat CANNOT see (other franchise)'
  END as visibility_for_surat
FROM product_categories pc
LEFT JOIN franchises f ON pc.franchise_id = f.id
CROSS JOIN users u
WHERE u.email = 'surat@safawala.com'
ORDER BY visibility_for_surat, pc.name;
