-- QUICK TRANSFER: One Query Method
-- This does the entire transfer in one SQL statement

-- METHOD 1: Simple Transfer
UPDATE products
SET franchise_id = (
  SELECT franchise_id FROM users WHERE email = 'mysafawale@gmail.com' LIMIT 1
)
WHERE franchise_id = (
  SELECT franchise_id FROM users WHERE email = 'vadodara@safawala.com' LIMIT 1
);

-- Then verify with this query:
SELECT 
  CASE 
    WHEN p.franchise_id IN (SELECT franchise_id FROM users WHERE email = 'mysafawale@gmail.com') 
    THEN 'Transferred to Mysafawale'
    ELSE 'Still in Vadodara'
  END as location,
  COUNT(*) as product_count,
  SUM(COALESCE(pi.quantity, 0)) as total_stock
FROM products p
LEFT JOIN product_items pi ON p.id = pi.product_id
WHERE p.franchise_id IN (
  SELECT franchise_id FROM users 
  WHERE email IN ('vadodara@safawala.com', 'mysafawale@gmail.com')
)
GROUP BY location;

---

-- METHOD 2: With Full Details (See what's being transferred)
SELECT 
  'Products being transferred:' as info,
  COUNT(*) as total,
  STRING_AGG(p.name, ', ') as product_names
FROM products p
WHERE p.franchise_id = (
  SELECT franchise_id FROM users WHERE email = 'vadodara@safawala.com' LIMIT 1
)
LIMIT 1;

-- Then run the UPDATE from METHOD 1 above

---

-- METHOD 3: Category by Category (If you want to be selective)
-- Transfer only specific categories
UPDATE products
SET franchise_id = (
  SELECT franchise_id FROM users WHERE email = 'mysafawale@gmail.com' LIMIT 1
)
WHERE franchise_id = (
  SELECT franchise_id FROM users WHERE email = 'vadodara@safawala.com' LIMIT 1
)
AND category_id IN (
  -- Add specific category IDs here
  SELECT id FROM categories WHERE name LIKE '%Saree%'
);
