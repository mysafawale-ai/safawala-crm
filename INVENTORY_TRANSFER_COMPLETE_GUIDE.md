# INVENTORY TRANSFER FIX - With NULL Handling

## Issue Encountered
Error: `null value in column "franchise_id" of relation "products" violates not-null constraint`

This means some products don't have a franchise assigned.

## Solution: 3-Step Process

### Step 1: Fix NULL franchise_id values
```sql
-- First, assign any orphaned products to mysafawale
UPDATE products
SET franchise_id = (
  SELECT franchise_id FROM users WHERE email = 'mysafawale@gmail.com' LIMIT 1
)
WHERE franchise_id IS NULL;
```

### Step 2: Transfer from Vadodara to Mysafawale
```sql
-- Now transfer all Vadodara products to Mysafawale
UPDATE products
SET franchise_id = (
  SELECT franchise_id FROM users WHERE email = 'mysafawale@gmail.com' LIMIT 1
)
WHERE franchise_id = (
  SELECT franchise_id FROM users WHERE email = 'vadodara@safawala.com' LIMIT 1
);
```

### Step 3: Verify Everything
```sql
-- Check final state
SELECT 
  CASE 
    WHEN franchise_id = (SELECT franchise_id FROM users WHERE email = 'mysafawale@gmail.com' LIMIT 1) 
    THEN '✅ Mysafawale'
    WHEN franchise_id = (SELECT franchise_id FROM users WHERE email = 'vadodara@safawala.com' LIMIT 1) 
    THEN '❌ Vadodara (should be 0)'
    WHEN franchise_id IS NULL 
    THEN '❌ NULL (should be 0)'
    ELSE '❓ Other'
  END as franchise,
  COUNT(*) as product_count
FROM products
GROUP BY franchise_id
ORDER BY product_count DESC;
```

---

## Import Demo Inventory WITH Images

To import demo products WITH product images, use this complete script:

```sql
-- See: IMPORT_DEMO_INVENTORY_WITH_IMAGES.sql
```

This script:
- ✅ Creates 8 demo Sherwani products
- ✅ Adds 2 images per product
- ✅ Creates product items (inventory tracking)
- ✅ Shows summary with image counts
- ✅ All automatically linked to mysafawale franchise

**Run this file in Supabase SQL Editor to import demo data with images!**

---

## What Gets Added

### Products:
- Royal Maroon Sherwani
- Classic Navy Sherwani
- Golden Banarasi Sherwani
- Cream Wedding Sherwani
- Black Formal Sherwani
- Red Bridal Sherwani
- Pink Embroidered Sherwani
- Purple Royal Sherwani

### For Each Product:
- ✅ 2 sample images
- ✅ 5 product items (individual pieces)
- ✅ Pricing (rental + sale)
- ✅ Security deposit
- ✅ Complete product details

---

## Order of Operations

1. **Fix NULL values** (Step 1)
2. **Transfer from Vadodara** (Step 2)
3. **Verify** (Step 3)
4. **Import demo data with images** (Separate script)

---

## Result

✅ All Vadodara inventory transferred to Mysafawale  
✅ No NULL franchise_id values  
✅ Demo products with images imported  
✅ Ready to use in app!
