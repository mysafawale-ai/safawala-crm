# 🧪 Barcode + Quantity Auto-Sync - Testing Guide

## ✅ You've Successfully Run the SQL Script!

Now let's test that everything works perfectly.

---

## 🎯 Test Plan Overview

We'll test 3 scenarios:
1. **Generate 200 barcodes** → Verify quantity auto-updates to 200
2. **Scan 5 barcodes in booking** → Verify quantity auto-decrements to 195
3. **Verify sync status** → Check database consistency

---

## 📝 Step-by-Step Testing

### **Test 1: Generate Barcoded Items & Verify Auto-Sync**

#### **1.1 Check Current Product**
```
1. Open http://localhost:3001 (dev server is running on port 3001)
2. Login to your account
3. Navigate to: Inventory → Products
4. Find "Barati Safa" (or any product you want to test)
5. Note the current stock_available number
```

#### **1.2 Generate Barcodes**
```
1. Click on the product row → "View Details"
2. In the product dialog, look for "Actions" menu (⋮)
3. Click "Generate Item Barcodes"
4. Enter quantity: 10 (start small for testing)
5. Click "Generate"
```

**Expected Result:**
```
✅ Success message: "Generated 10 items successfully"
✅ Product stock_available should AUTO-UPDATE to current + 10
```

#### **1.3 Verify in Database**

Run this query in **Supabase SQL Editor**:

```sql
-- Check if items were created and quantity synced
SELECT 
  p.name AS "Product Name",
  p.stock_available AS "Stock Available (Auto)",
  COUNT(pi.id) AS "Total Items Generated",
  COUNT(pi.id) FILTER (WHERE pi.status = 'available') AS "Available Items"
FROM products p
LEFT JOIN product_items pi ON pi.product_id = p.id
WHERE p.name ILIKE '%Barati Safa%'  -- Change to your product name
GROUP BY p.id, p.name, p.stock_available;
```

**Expected Result:**
```
Product Name | Stock Available (Auto) | Total Items | Available Items
-------------|------------------------|-------------|----------------
Barati Safa  | 10                    | 10          | 10
```

✅ **If these match → Trigger is working!**

---

### **Test 2: Scan Barcodes in Booking**

#### **2.1 Create a Test Booking**
```
1. Navigate to: Bookings
2. Click "New Booking" or select existing booking
3. Choose a customer
4. Fill basic details (event date, delivery date, etc.)
5. Save the booking (if new)
```

#### **2.2 Add Products via Barcode Scanner**
```
1. In the booking, click "Select Products" (or navigate to product selection)
2. You should see: "🔍 Quick Add by Barcode Scanner"
3. In the barcode input field, manually type a barcode:
   - Get barcode from database or check generated items
```

**Get a Test Barcode:**

Run this in Supabase:
```sql
-- Get 5 barcodes to test with
SELECT 
  item_code,
  barcode,
  status,
  product_id
FROM product_items
WHERE product_id = (
  SELECT id FROM products WHERE name ILIKE '%Barati Safa%' LIMIT 1
)
AND status = 'available'
ORDER BY item_code
LIMIT 5;
```

Copy one of the barcodes (e.g., `BAR20251020001`)

#### **2.3 Scan the Barcode**
```
1. Paste the barcode in the scanner input field
2. Press Enter
3. Expected: "✅ Item scanned! Barati Safa (TUR-0001) added to booking"
4. Repeat for 4 more barcodes (total 5 items)
5. Save the booking
```

#### **2.4 Verify Quantity Decreased**

Check in UI:
```
1. Go back to Inventory
2. Find "Barati Safa"
3. Stock should now show: 10 - 5 = 5
```

Check in Database:
```sql
-- Verify quantity synced after booking
SELECT 
  p.name AS "Product",
  p.stock_available AS "Stock (Should be 5)",
  COUNT(pi.id) FILTER (WHERE pi.status = 'available') AS "Available Items",
  COUNT(pi.id) FILTER (WHERE pi.status = 'booked') AS "Booked Items",
  COUNT(pi.id) AS "Total Items"
FROM products p
LEFT JOIN product_items pi ON pi.product_id = p.id
WHERE p.name ILIKE '%Barati Safa%'
GROUP BY p.id, p.name, p.stock_available;
```

**Expected Result:**
```
Product     | Stock (Should be 5) | Available Items | Booked Items | Total Items
------------|---------------------|-----------------|--------------|------------
Barati Safa | 5                  | 5               | 5            | 10
```

✅ **If stock_available = 5 → Auto-sync is working perfectly!**

---

### **Test 3: Full 200 Items Test** (Optional)

Once basic test passes, test with full scale:

```
1. Go to Inventory → Select "Barati Safa"
2. Generate Item Barcodes → Enter: 200
3. Wait for generation to complete
4. Check stock_available → Should be 210 (10 existing + 200 new)
5. Create booking and scan 50 barcodes
6. Check stock_available → Should be 160 (210 - 50)
```

---

## 🔍 Troubleshooting

### **Issue: Quantity not updating automatically**

**Check 1: Trigger exists?**
```sql
-- Run in Supabase SQL Editor
SELECT 
  tgname AS trigger_name,
  tgrelid::regclass AS table_name
FROM pg_trigger
WHERE tgname = 'trigger_sync_product_stock';
```

Expected: Should return 1 row with trigger name

**Fix:** Re-run the AUTO_SYNC_QUANTITY_FROM_BARCODES.sql script

---

**Check 2: Trigger function exists?**
```sql
-- Check if function exists
SELECT proname 
FROM pg_proc 
WHERE proname = 'sync_product_stock_from_items';
```

Expected: Should return 1 row

---

**Check 3: Manual trigger test**
```sql
-- Manually update an item status
UPDATE product_items
SET status = 'booked'
WHERE id = (
  SELECT id FROM product_items 
  WHERE status = 'available' 
  LIMIT 1
);

-- Check if product stock updated
SELECT 
  p.name,
  p.stock_available,
  COUNT(pi.id) FILTER (WHERE pi.status = 'available') AS available_count
FROM products p
LEFT JOIN product_items pi ON pi.product_id = p.id
WHERE EXISTS (SELECT 1 FROM product_items WHERE product_id = p.id)
GROUP BY p.id
LIMIT 5;
```

If stock_available matches available_count → Trigger works!

---

### **Issue: Barcode scanner not finding items**

**Check 1: Barcode exists?**
```sql
-- Search for a barcode
SELECT * 
FROM product_items 
WHERE barcode = 'YOUR_BARCODE_HERE';
```

**Check 2: Item status?**
```sql
-- Check item status
SELECT item_code, barcode, status
FROM product_items
WHERE status = 'available'
LIMIT 10;
```

Only items with `status='available'` can be scanned for booking.

---

### **Issue: Scanner UI not visible**

**Check:** 
1. Make sure you're on the correct page: `/bookings/[id]/select-products`
2. Navigate via: Bookings → View booking → "Help Customer Select Products"
3. Look for the card with "📱 Quick Add by Barcode Scanner"

**If still not visible:**
- Clear browser cache
- Restart dev server: `pkill -f "next dev" && pnpm dev`

---

## ✅ Success Criteria

Your system is working correctly if:

- [ ] ✅ Generate 10 items → stock_available increases by 10
- [ ] ✅ Scan 5 barcodes → stock_available decreases by 5
- [ ] ✅ Database query shows: stock_available = available items count
- [ ] ✅ Toast notification shows: "✅ Item scanned! [Product] ([Item Code]) added"
- [ ] ✅ Booking saves successfully with correct quantity

---

## 📊 Monitoring Dashboard Query

Use this query to monitor your system health:

```sql
-- Complete system status
WITH item_counts AS (
  SELECT 
    product_id,
    COUNT(*) FILTER (WHERE status = 'available') AS available,
    COUNT(*) FILTER (WHERE status = 'booked') AS booked,
    COUNT(*) FILTER (WHERE status = 'damaged') AS damaged,
    COUNT(*) FILTER (WHERE status = 'in_laundry') AS laundry,
    COUNT(*) AS total
  FROM product_items
  GROUP BY product_id
)
SELECT 
  p.name AS "Product Name",
  p.stock_available AS "Stock (System)",
  COALESCE(ic.available, 0) AS "Available Items",
  COALESCE(ic.booked, 0) AS "Booked Items",
  COALESCE(ic.damaged, 0) AS "Damaged Items",
  COALESCE(ic.laundry, 0) AS "In Laundry",
  COALESCE(ic.total, 0) AS "Total Items",
  CASE 
    WHEN p.stock_available = COALESCE(ic.available, 0) THEN '✅ Synced'
    ELSE '❌ OUT OF SYNC'
  END AS "Sync Status"
FROM products p
LEFT JOIN item_counts ic ON ic.product_id = p.id
WHERE ic.total > 0
ORDER BY p.name;
```

**All products should show "✅ Synced"**

---

## 🎓 Quick Reference

### **Scanner Keyboard Shortcuts**
- Type barcode manually → Press **Enter**
- Focus scanner input → **Tab** key
- Cancel scan → **Escape**

### **Common Barcodes Format**
```
TUR-0001 → TUR20251020001
TUR-0002 → TUR20251020002
BAR-0001 → BAR20251020001
```

### **Database Tables**
- `products` → Has stock_available (auto-updated)
- `product_items` → Has individual items with barcodes
- `barcode_scan_history` → Logs all scans
- `booking_item_links` → Links items to bookings

---

## 🚀 Next Steps After Testing

Once tests pass:

1. **Print Physical Labels**
   - Download barcodes from inventory
   - Print on adhesive labels
   - Apply to products

2. **Train Staff**
   - Show how to scan barcodes
   - Explain quantity auto-updates
   - Practice with test bookings

3. **Production Use**
   - Generate full 200 items for real products
   - Use in actual bookings
   - Monitor with dashboard query

---

## 📞 Need Help?

**If test fails:**
1. Check server is running (port 3001)
2. Verify SQL script ran successfully (check for errors)
3. Clear browser cache
4. Check Supabase connection
5. Review error messages in browser console (F12)

**Common Error Messages:**
- "Barcode not found" → Item doesn't exist or wrong barcode
- "Item not available" → Item status is not 'available'
- "Failed to save" → Check booking_items table permissions

---

## 🎉 You're Ready!

**Current Status:**
- ✅ SQL script executed
- ✅ Dev server running on port 3001
- ✅ Barcode scanner UI added
- ✅ Auto-sync trigger installed

**Start Testing:** http://localhost:3001

Good luck! 🚀
