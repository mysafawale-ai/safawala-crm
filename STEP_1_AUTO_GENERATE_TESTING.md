# 🧪 Step 1 Testing Guide - Auto-Generate Barcodes

## ✅ What We Just Built

**Database trigger that automatically creates barcoded items when you add stock quantity.**

---

## 🎯 How to Test (Step-by-Step)

### **Test 1: Install the Trigger**

1. Open **Supabase Dashboard**
2. Go to **SQL Editor**
3. Copy entire content from: `/scripts/AUTO_GENERATE_BARCODES_ON_STOCK_CHANGE.sql`
4. Paste and click **"Run"**
5. Expected: ✅ "Success. No rows returned"

---

### **Test 2: Create New Product (Auto-Generate Test)**

Run this in Supabase SQL Editor:

```sql
-- Create test product with 10 items
INSERT INTO products (
  name,
  product_code,
  category,
  stock_available,
  stock_total,
  rental_price,
  sale_price,
  security_deposit,
  franchise_id,
  auto_generate_barcodes,
  is_active
) VALUES (
  'Test Auto Turban',
  'TAT',
  'Turbans',
  10,  -- This should auto-generate 10 items!
  10,
  500,
  2000,
  200,
  (SELECT id FROM franchises LIMIT 1),
  true,
  true
)
RETURNING id, name, product_code, stock_available;
```

**Expected Result:**
```
✅ Product created
✅ Notice: "Auto-generating 10 items..."
✅ Notice: "✅ Auto-generated 10 items successfully"
```

---

### **Test 3: Verify Items Were Created**

```sql
-- Check if 10 items exist
SELECT 
  item_code,
  barcode,
  status,
  condition
FROM product_items
WHERE product_id = (
  SELECT id FROM products WHERE product_code = 'TAT'
)
ORDER BY item_code;
```

**Expected Result:**
```
TAT-0001 | TAT20251020001 | available | new
TAT-0002 | TAT20251020002 | available | new
TAT-0003 | TAT20251020003 | available | new
...
TAT-0010 | TAT20251020010 | available | new
```

✅ **10 rows should appear!**

---

### **Test 4: Add More Quantity (Test Auto-Generate on Update)**

```sql
-- Update stock from 10 to 25
UPDATE products
SET stock_available = 25
WHERE product_code = 'TAT'
RETURNING id, name, stock_available;
```

**Expected Result:**
```
✅ Notice: "Stock increased by 15..."
✅ Notice: "✅ Auto-generated 15 items"
```

---

### **Test 5: Verify Total Items**

```sql
-- Should now have 25 items total
SELECT 
  COUNT(*) AS total_items,
  COUNT(*) FILTER (WHERE status = 'available') AS available_items
FROM product_items
WHERE product_id = (
  SELECT id FROM products WHERE product_code = 'TAT'
);
```

**Expected Result:**
```
total_items: 25
available_items: 25
```

✅ **Success! 15 new items auto-generated!**

---

### **Test 6: Test Disable Auto-Generate**

```sql
-- Turn off auto-generate
UPDATE products
SET auto_generate_barcodes = false
WHERE product_code = 'TAT';

-- Try to add more stock
UPDATE products
SET stock_available = 30
WHERE product_code = 'TAT';

-- Check item count (should still be 25)
SELECT COUNT(*) FROM product_items
WHERE product_id = (SELECT id FROM products WHERE product_code = 'TAT');
```

**Expected Result:**
```
COUNT: 25
✅ No new items generated (feature disabled)
```

---

### **Test 7: Verify Sync Status**

```sql
-- Check all products sync status
SELECT 
  p.name,
  p.product_code,
  p.stock_available AS "Stock",
  p.auto_generate_barcodes AS "Auto-Gen",
  COUNT(pi.id) AS "Items",
  CASE 
    WHEN p.stock_available = COUNT(pi.id) THEN '✅ Synced'
    WHEN COUNT(pi.id) = 0 THEN '⚠️ No items yet'
    ELSE '⚠️ Out of sync'
  END AS "Status"
FROM products p
LEFT JOIN product_items pi ON pi.product_id = p.id
WHERE p.product_code = 'TAT'
GROUP BY p.id, p.name, p.product_code, p.stock_available, p.auto_generate_barcodes;
```

**Expected Result:**
```
Test Auto Turban | TAT | 30 | false | 25 | ⚠️ Out of sync
```

(Out of sync because we disabled auto-generate)

---

### **Test 8: Re-enable and Sync**

```sql
-- Re-enable auto-generate
UPDATE products
SET auto_generate_barcodes = true
WHERE product_code = 'TAT';

-- Trigger will generate missing 5 items
UPDATE products
SET stock_available = 30
WHERE product_code = 'TAT';

-- Verify
SELECT COUNT(*) FROM product_items
WHERE product_id = (SELECT id FROM products WHERE product_code = 'TAT');
```

**Expected Result:**
```
COUNT: 30
✅ Synced! 5 new items generated (TAT-0026 to TAT-0030)
```

---

## 🎉 Success Criteria

All tests should show:

- [x] ✅ Trigger installed successfully
- [x] ✅ New product auto-generates items
- [x] ✅ Adding stock generates more items
- [x] ✅ Disabling auto-generate stops generation
- [x] ✅ Re-enabling continues generation
- [x] ✅ Item codes sequential (TAT-0001, TAT-0002, etc.)
- [x] ✅ Barcodes unique and formatted correctly

---

## 🔍 Troubleshooting

### **Issue: No items generated**

**Check 1: Trigger exists?**
```sql
SELECT tgname 
FROM pg_trigger 
WHERE tgname = 'trigger_auto_generate_barcodes';
```

**Check 2: Function exists?**
```sql
SELECT proname 
FROM pg_proc 
WHERE proname = 'trigger_auto_generate_items';
```

**Check 3: Auto-generate enabled?**
```sql
SELECT name, auto_generate_barcodes 
FROM products 
WHERE product_code = 'TAT';
```

---

### **Issue: Items generated but wrong count**

**Debug query:**
```sql
-- See what happened
SELECT 
  p.stock_available AS "Stock Set",
  COUNT(pi.id) AS "Items Created",
  p.stock_available - COUNT(pi.id) AS "Difference"
FROM products p
LEFT JOIN product_items pi ON pi.product_id = p.id
WHERE p.product_code = 'TAT'
GROUP BY p.id, p.stock_available;
```

---

## 📊 View Logs (Optional)

If you want to see the NOTICE messages:

```sql
-- In Supabase, these appear in the "Messages" section
-- Look for:
-- "Auto-generating 10 items..."
-- "✅ Auto-generated 10 items successfully"
```

---

## 🚀 Next Step

Once all tests pass, we'll move to:

**Step 2: Create UI Components**
- Barcode status card
- Quick add quantity widget
- View all barcodes button

---

## ✅ Cleanup (Optional)

When done testing, remove test product:

```sql
-- Delete test product and its items
DELETE FROM product_items 
WHERE product_id = (SELECT id FROM products WHERE product_code = 'TAT');

DELETE FROM products 
WHERE product_code = 'TAT';
```

---

**Ready? Run the SQL script and let me know the results! 🎯**
