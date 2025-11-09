# DELETE PRODUCTS WITHOUT FRANCHISE_ID

## Quick Solution

Run this **ONE** query to delete all products with NULL franchise_id:

```sql
-- Delete all images for orphaned products
DELETE FROM product_images
WHERE product_id IN (
  SELECT id FROM products WHERE franchise_id IS NULL
);

-- Delete all product items for orphaned products
DELETE FROM product_items
WHERE product_id IN (
  SELECT id FROM products WHERE franchise_id IS NULL
);

-- Delete the orphaned products
DELETE FROM products
WHERE franchise_id IS NULL;
```

Then verify:

```sql
SELECT COUNT(*) as orphaned_products FROM products WHERE franchise_id IS NULL;
-- Should return: 0
```

---

## Safe Approach (See What You're Deleting First)

**Step 1: Count them**
```sql
SELECT COUNT(*) as products_to_delete
FROM products
WHERE franchise_id IS NULL;
```

**Step 2: See what they are**
```sql
SELECT id, product_code, name, brand, created_at
FROM products
WHERE franchise_id IS NULL
ORDER BY created_at DESC;
```

**Step 3: Delete related data first**
```sql
-- Delete images
DELETE FROM product_images
WHERE product_id IN (SELECT id FROM products WHERE franchise_id IS NULL);

-- Delete items
DELETE FROM product_items
WHERE product_id IN (SELECT id FROM products WHERE franchise_id IS NULL);

-- Delete products
DELETE FROM products
WHERE franchise_id IS NULL;
```

**Step 4: Verify**
```sql
SELECT COUNT(*) as remaining FROM products WHERE franchise_id IS NULL;
-- Should be 0
```

---

## What Gets Deleted

✅ Products with no franchise assignment  
✅ Associated product images  
✅ Associated product items (inventory)  
❌ Products WITH franchise_id are NOT affected

---

## After Deletion

Run the transfer again:
```sql
UPDATE products
SET franchise_id = (
  SELECT franchise_id FROM users WHERE email = 'mysafawale@gmail.com' LIMIT 1
)
WHERE franchise_id = (
  SELECT franchise_id FROM users WHERE email = 'vadodara@safawala.com' LIMIT 1
);
```

Now it should work! ✅
