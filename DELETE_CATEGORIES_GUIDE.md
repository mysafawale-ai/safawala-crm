# 🗑️ DELETE SURAT CATEGORIES & VALIDATE ISOLATION

## 📋 Quick Steps

### 1️⃣ Run Complete Setup & Deletion
**Execute this in Supabase SQL Editor:**

```sql
-- Run: COMPLETE_CATEGORY_ISOLATION_SETUP.sql
```

This will:
- ✅ Add `franchise_id` column to `product_categories` (if not exists)
- ✅ Show BEFORE state
- ✅ Delete all Surat franchise categories
- ✅ Show AFTER state
- ✅ Validate franchise isolation
- ✅ Generate summary report

---

## 🧪 What Gets Deleted

**Categories shown in your screenshot:**
- Accessories (0 products)
- Live Safa (0 products)
- Party Wear (0 products)
- Safa (0 products)

**IF they have your franchise_id** → They will be DELETED ✅

**IF they are global (franchise_id = NULL)** → They will NOT be deleted ⚠️

---

## ✅ Expected Results

### After Running the Script:

**For Surat Franchise Admin:**
- ❌ Should NOT see categories from other franchises
- ✅ Should see ONLY global categories (franchise_id = NULL)
- ✅ Should see own franchise categories (if any remain)

**For Super Admin:**
- ✅ Should see ALL categories from ALL franchises
- ✅ Should see global categories

---

## 🔍 Validation Tests

The script runs these automatic tests:

### Test 1: Visible Categories
```sql
-- Shows what Surat franchise CAN see
-- Expected: Only global categories (if all Surat categories deleted)
```

### Test 2: Hidden Categories
```sql
-- Shows what Surat franchise CANNOT see
-- Expected: Categories from other franchises
```

### Test 3: Orphaned Categories
```sql
-- Shows categories with invalid franchise_id
-- Expected: Empty result (no orphans)
```

### Test 4: Summary Report
```sql
-- Shows counts:
-- - Global categories
-- - Surat franchise categories (should be 0 after deletion)
-- - Other franchise categories
```

---

## 🎯 Manual Verification

After running the script:

1. **Refresh the categories page** in browser
2. **Check if categories disappeared**:
   - Accessories
   - Live Safa
   - Party Wear
   - Safa

3. **Expected behavior:**
   - If they were Surat-specific → They're gone ✅
   - If they were global → They still appear (all franchises see them)

4. **Try creating a new category:**
   - It should automatically get your `franchise_id`
   - Other franchises won't see it

---

## 🔧 Troubleshooting

### Issue: Categories still showing
**Possible causes:**
1. Categories are global (`franchise_id = NULL`)
   - **Solution:** They're meant to be seen by all franchises
2. Browser cache not cleared
   - **Solution:** Hard refresh (Cmd+Shift+R)

### Issue: "column franchise_id does not exist"
**Solution:**
```sql
ALTER TABLE product_categories 
ADD COLUMN franchise_id UUID REFERENCES franchises(id);

CREATE INDEX idx_product_categories_franchise_id 
ON product_categories(franchise_id);
```

### Issue: All categories deleted (including global)
**Check:**
```sql
-- Verify global categories exist
SELECT * FROM product_categories WHERE franchise_id IS NULL;
```

---

## 📊 Current Categories Overview

**Before deletion, you should see:**
- 6 Main Categories
- 2 Subcategories
- All with 0 products

**After deletion + isolation:**
- ✅ Surat franchise sees only their categories + global ones
- ✅ Other franchises cannot see Surat's categories
- ✅ Each franchise has isolated category management

---

## 🚀 Next Steps

1. **Run:** `COMPLETE_CATEGORY_ISOLATION_SETUP.sql` in Supabase
2. **Wait:** 2-3 seconds for execution
3. **Check:** Output messages for deletion count
4. **Refresh:** Categories page in browser
5. **Verify:** Categories disappeared from Surat franchise view
6. **Test:** Create new category → should have your franchise_id

Done! Categories are now isolated per franchise. 🎉
