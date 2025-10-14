# 🔍 Quotes Page Debug - 3 Quotes Showing Issue

**Issue:** Stats show 12 quotes, but only 3 displaying in list

---

## 🧪 Diagnostic Steps

### Open Browser Console and Check:

1. **Open Quotes Page**: `https://mysafawala.com/quotes`

2. **Open Console** (F12 or Cmd+Option+I)

3. **Check Console Logs**: Look for:
   ```
   📊 Stats query results:
     productCount: X
     packageCount: Y
   
   ✅ Successfully fetched quotes:
     total: 12
     product: X  
     package: Y
   ```

4. **Check What's Actually Loaded**:
   - In console, type: `window.quotes = []` 
   - Then refresh page
   - Check if data is being loaded

---

## 🔍 Possible Causes

### 1. **RLS (Row Level Security) Filtering**
**Most Likely Cause!**

The database might have RLS policies that filter quotes by `franchise_id`.

**Check:**
```sql
-- In Supabase SQL Editor
SELECT 
  id,
  order_number,
  franchise_id,
  status,
  is_quote
FROM product_orders
WHERE is_quote = true;

SELECT 
  id,
  package_number,
  franchise_id,
  status,
  is_quote  
FROM package_bookings
WHERE is_quote = true;
```

**Expected:** Should see 12 total quotes
**If you see less:** RLS is filtering by franchise

---

### 2. **Frontend Filter Applied**
Check if a filter is automatically applied on page load

**Current Code:**
```typescript
const [statusFilter, setStatusFilter] = useState("all")  // ✅ Set to "all"
const [dateFilter, setDateFilter] = useState("all")      // ✅ Set to "all"  
```

Filters look correct!

---

### 3. **Supabase Query Issues**
The `QuoteService.getAll()` might be failing to fetch all quotes

**Check Console for:**
- ❌ Error messages  
- ⚠️ "Error fetching product quotes"
- ⚠️ "Error fetching package quotes"

---

## 🎯 Solution Based on Root Cause

### If RLS is Filtering (Most Likely):

**Option A: Disable RLS for Quotes (Not Recommended)**
```sql
ALTER TABLE product_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE package_bookings DISABLE ROW LEVEL SECURITY;
```

**Option B: Update RLS Policy to Allow All Quotes**
```sql
-- For super_admin, show all quotes regardless of franchise
CREATE POLICY "Super admin can view all product order quotes"
ON product_orders FOR SELECT
TO authenticated
USING (
  is_quote = true AND (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'super_admin'
    )
    OR franchise_id = (
      SELECT franchise_id FROM users WHERE id = auth.uid()
    )
  )
);
```

**Option C: Add Franchise Filter to UI**
Show quotes only for user's franchise (current behavior is correct)

---

### If Frontend Filter Issue:

Check if there's a `useEffect` that sets a default filter:

```typescript
// Look for something like this:
useEffect(() => {
  setStatusFilter("quote")  // ← This would filter to only "quote" status
}, [])
```

---

### If Query Issue:

Check the actual API response:

1. Open Network tab in DevTools
2. Refresh quotes page  
3. Find API calls to `/api/...` or direct Supabase calls
4. Check response - how many quotes returned?

---

## 🔧 Quick Fix to Test

### Add Logging to Check What's Loaded:

**In Browser Console, paste:**
```javascript
// Check loaded quotes
console.log("Quotes in state:", quotes.length)
console.log("Filtered quotes:", filteredQuotes.length)
console.log("Status filter:", statusFilter)
console.log("Date filter:", dateFilter)
```

---

## 💡 Most Likely Scenario

Based on the symptoms:
- Stats show 12 (fetched via separate query without joins)
- List shows 3 (fetched with customer joins)

**Hypothesis:** RLS on `customers` table is filtering results!

When joining with customers:
```typescript
.select(`
  *,
  customer:customers(name, phone, email),  // ← Customer RLS might filter!
  product_order_items(...)
`)
```

If 3 quotes belong to customers in your franchise, but 9 quotes belong to customers in other franchises, the join would filter them out!

---

## ✅ Recommended Fix

### Update Quote Query to Handle Missing Customers:

```typescript
// Use LEFT JOIN instead of INNER JOIN
.select(`
  *,
  customer:customers!left(name, phone, email),  // Note the !left
  product_order_items(*)
`)
```

Or fetch customer data separately after fetching quotes.

---

## 🧪 Immediate Test

Run this in Supabase SQL Editor:

```sql
-- Count quotes WITHOUT customer join
SELECT COUNT(*) as total_quotes
FROM product_orders  
WHERE is_quote = true;

-- Count quotes WITH customer join
SELECT COUNT(*) as quotes_with_customers
FROM product_orders po
INNER JOIN customers c ON po.customer_id = c.id
WHERE po.is_quote = true;
```

If these numbers differ (12 vs 3), that's your answer!

---

**Next Step:** Check browser console and Supabase query results to identify exact cause.
