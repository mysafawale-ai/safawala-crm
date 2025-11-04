# ⚡ QUICK START - Multi-Barcode Setup

## ✅ What's Ready

Your barcode system now supports **5 different code fields**:
- `product_code`
- `barcode_number`
- `alternate_barcode_1`
- `alternate_barcode_2`
- `sku`

**Build Status:** ✅ PASSED (TypeScript verified)

---

## 🚀 Do This Now (3 Steps)

### Step 1: Run Migration (2 minutes)

1. Open: **Supabase Dashboard**
2. Go to: **SQL Editor → New Query**
3. Open file: `/scripts/ADD_BARCODE_FIELDS_TO_PRODUCTS.sql`
4. Copy all content
5. Paste in SQL editor
6. Click **Run**
7. Wait for success ✅

### Step 2: Add Product Codes (5 minutes)

**Option A: SQL (recommended)**
```sql
UPDATE products
SET 
    product_code = 'PROD-1761634543481-66-006',
    barcode_number = '5901234123457',
    sku = 'SKU-TISSUE-001'
WHERE id = 'YOUR_PRODUCT_ID_HERE';
```

**Option B: Supabase UI**
- Open products table
- Click a product
- Fill in the new fields
- Save

### Step 3: Test It! (2 minutes)

1. Go to: `/create-product-order`
2. Scroll to: **"Quick Add by Barcode"**
3. Scan or type: `PROD-1761634543481-66-006`
4. ✅ Product should auto-add!

---

## 📊 What Each Field Is For

| Field | Use Case | Example |
|-------|----------|---------|
| `product_code` | Internal code | `PROD-1761634543481-66-006` |
| `barcode_number` | Scanned barcode | `5901234123457` |
| `sku` | Stock unit | `SKU-TISSUE-001` |
| `alternate_barcode_1` | 2nd barcode | Optional |
| `alternate_barcode_2` | 3rd barcode | Optional |

---

## 🔍 Verify Migration Worked

Run this query in Supabase:

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name IN ('product_code', 'barcode_number', 'sku');
```

**Should return 5 rows** ✓

---

## ✨ It Now Searches For

When you scan a barcode, it checks:
1. ✅ product_code field
2. ✅ barcode_number field
3. ✅ alternate_barcode_1 field
4. ✅ alternate_barcode_2 field
5. ✅ sku field
6. ✅ Plus local product array

**Much more comprehensive!**

---

## 💡 Pro Tips

**Tip 1:** Don't need all 5 fields? Just use 2:
- `product_code` for your internal codes
- `barcode_number` for scanned barcodes

**Tip 2:** Bulk update all products at once:
```sql
UPDATE products
SET product_code = CONCAT('PROD-', SUBSTRING(id::TEXT, 1, 12))
WHERE product_code IS NULL;
```

**Tip 3:** Test with database query first:
```sql
SELECT * FROM find_product_by_code('PROD-1761634543481-66-006');
```

---

## 🎯 Next: Add Your Codes

For each product, run:
```sql
UPDATE products
SET product_code = 'YOUR_CODE_HERE'
WHERE name = 'Product Name';
```

Replace:
- `YOUR_CODE_HERE` with actual product code
- `Product Name` with actual product name

---

## ❓ Still Not Working?

1. **Check migration ran:**
   ```sql
   SELECT * FROM products LIMIT 1;
   ```
   Look for new columns at the end

2. **Check data was saved:**
   ```sql
   SELECT product_code, barcode_number 
   FROM products 
   WHERE product_code IS NOT NULL;
   ```

3. **Open browser console (F12) and try scanning**
   - Look for debug logs
   - Share what logs say

---

**Status:** ✅ Code updated & ready  
**Build:** TypeScript PASSED  
**Next:** Run migration & test!

See detailed guide: `MULTI_BARCODE_SETUP_GUIDE.md`
