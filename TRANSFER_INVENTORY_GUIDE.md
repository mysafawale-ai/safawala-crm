# TRANSFER INVENTORY BETWEEN FRANCHISES

## Scenario
Transfer all inventory from **vadodara@safawala.com** franchise to **mysafawale@gmail.com** franchise

## Step 1: Verify Franchise Information

Run this query in Supabase SQL Editor:

```sql
SELECT 
  u.id as user_id,
  u.email,
  u.role,
  u.franchise_id,
  f.name as franchise_name,
  f.code as franchise_code
FROM users u
LEFT JOIN franchises f ON u.franchise_id = f.id
WHERE u.email IN ('vadodara@safawala.com', 'mysafawale@gmail.com')
ORDER BY u.email;
```

**Note the:**
- Franchise ID for vadodara (source)
- Franchise ID for mysafawale (destination)

---

## Step 2: Check Inventory Before Transfer

### Check Vadodara's Inventory:
```sql
SELECT 
  COUNT(*) as total_products,
  SUM(COALESCE(pi.quantity, 0)) as total_stock_units
FROM products p
LEFT JOIN product_items pi ON p.id = pi.product_id
WHERE p.franchise_id = 'VADODARA_FRANCHISE_ID_HERE';
```

### Check Mysafawale's Inventory:
```sql
SELECT 
  COUNT(*) as total_products,
  SUM(COALESCE(pi.quantity, 0)) as total_stock_units
FROM products p
LEFT JOIN product_items pi ON p.id = pi.product_id
WHERE p.franchise_id = 'MYSAFAWALE_FRANCHISE_ID_HERE';
```

---

## Step 3: Transfer All Products

Replace the IDs with actual values from Step 1:

```sql
UPDATE products
SET franchise_id = 'MYSAFAWALE_FRANCHISE_ID'
WHERE franchise_id = 'VADODARA_FRANCHISE_ID';
```

**Example** (if IDs are uuid-1111 and uuid-2222):
```sql
UPDATE products
SET franchise_id = 'uuid-2222'
WHERE franchise_id = 'uuid-1111';
```

---

## Step 4: Verify Transfer

```sql
SELECT 
  COUNT(*) as total_products,
  SUM(COALESCE(pi.quantity, 0)) as total_stock_units
FROM products p
LEFT JOIN product_items pi ON p.id = pi.product_id
WHERE p.franchise_id = 'MYSAFAWALE_FRANCHISE_ID';
```

Should show the combined inventory!

---

## Step 5: Check Vadodara Now Has No Products

```sql
SELECT 
  COUNT(*) as remaining_products
FROM products
WHERE p.franchise_id = 'VADODARA_FRANCHISE_ID';
```

Should return: **0**

---

## What Gets Transferred?

✅ All product records  
✅ All product items (stock)  
✅ All product images  
✅ Product categories  
✅ Product pricing  
✅ Stock movements (if stored per product)

---

## Rollback (If Something Goes Wrong)

```sql
-- Revert all products back to vadodara
UPDATE products
SET franchise_id = 'VADODARA_FRANCHISE_ID'
WHERE franchise_id = 'MYSAFAWALE_FRANCHISE_ID'
  AND created_at >= NOW() - INTERVAL '1 hour';  -- Only last hour
```

---

## Complete Transfer Script (All Steps Together)

1. **Get IDs:**
```sql
SELECT u.email, u.franchise_id FROM users u 
WHERE u.email IN ('vadodara@safawala.com', 'mysafawale@gmail.com');
```

2. **Count before:**
```sql
SELECT 'vadodara' as franchise, COUNT(*) FROM products WHERE franchise_id = 'ID1'
UNION ALL
SELECT 'mysafawale' as franchise, COUNT(*) FROM products WHERE franchise_id = 'ID2';
```

3. **Transfer:**
```sql
UPDATE products SET franchise_id = 'ID2' WHERE franchise_id = 'ID1';
```

4. **Count after:**
```sql
SELECT 'vadodara' as franchise, COUNT(*) FROM products WHERE franchise_id = 'ID1'
UNION ALL
SELECT 'mysafawale' as franchise, COUNT(*) FROM products WHERE franchise_id = 'ID2';
```

---

## Safety Checklist ✅

- [ ] Backed up database (if possible)
- [ ] Verified franchise IDs are correct
- [ ] Checked inventory counts before
- [ ] Ran transfer query
- [ ] Verified inventory after
- [ ] Confirmed vadodara has 0 products

---

## Support Notes

**If franchise_id constraint fails:**
- There might be foreign key constraints
- Solution: Update related tables (categories, images, etc.) first

**If you want to COPY (not move):**
Replace UPDATE with INSERT:
```sql
INSERT INTO products (name, price, category_id, franchise_id, ...)
SELECT name, price, category_id, 'MYSAFAWALE_ID', ...
FROM products
WHERE franchise_id = 'VADODARA_ID';
```

---

**Ready? Run Step 1 first and paste the results!**
