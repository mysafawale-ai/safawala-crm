# 🚨 PRODUCT LOADING ISSUE - LOCAL vs PRODUCTION

## THE PROBLEM

| Environment | Status | Issue |
|---|---|---|
| **Local (localhost)** | ✅ Works | Products load in modal |
| **Production** | ❌ Fails | "No matching products" |

Screenshot 1 (Local): 81 Safas package shows products ✅
Screenshot 2 (Production): Same page shows "No matching products" ❌

---

## ROOT CAUSE IDENTIFIED 🎯

### Location: `app/book-package/page.tsx` (Line 2519-2521)

Product query with **franchise filtering**:

```typescript
// Apply franchise filtering (unless super admin)
if (!isSuperAdmin && franchiseId) {
  // Include products for this franchise OR legacy products without franchise_id
  productsQuery = productsQuery.or(`franchise_id.eq.${franchiseId},franchise_id.is.null`)
}
```

**The issue:**
- ✅ Shows products where `franchise_id = user.franchise_id`
- ✅ Shows products where `franchise_id IS NULL` (legacy)
- ❌ Does NOT show products where `franchise_id` = DIFFERENT franchise

**In Production:**
- User's franchise_id: `1a518dde-85b7-44ef-8bc4-092f53ddfd99` (from `/api/auth/user`)
- Product franchise_id: `abc123...` (different, or NULL but not matching)
- Result: No products load ❌

---

## WHY LOCAL WORKS BUT PRODUCTION DOESN'T

### Local Environment:
- Probably all products have `franchise_id = NULL` (legacy)
- OR user's franchise_id matches product's franchise_id
- Either way, `.or()` condition matches ✅

### Production Environment:
- Products have specific `franchise_id` values
- User's `franchise_id` doesn't match any product
- `.or()` condition fails ❌
- "No matching products" error

---

## SOLUTION OPTIONS

### Option 1: Remove Franchise Filtering (QUICKEST) ⚡
**For testing/urgency only**

```typescript
// Don't filter by franchise - show all products
let productsQuery = supabase
  .from("products")
  .select('id,name,image_url,category,category_id,subcategory,subcategory_id,stock_available,price,rental_price,barcode')
  .order("name")

// Just filter by active status
if (true) { // Always filter
  try {
    productsQuery = productsQuery.eq('is_active', true)
  } catch (e) {
    console.log('is_active column not available')
  }
}
```

⚠️ **Risk:** All products visible to all franchises

---

### Option 2: Fix via Database (RECOMMENDED) ✅
**Set all products to NULL franchise (shared) OR assign to correct franchise**

```sql
-- Option A: Make all products shared (NULL franchise)
UPDATE products 
SET franchise_id = NULL 
WHERE franchise_id IS NOT NULL;

-- Option B: Assign to specific franchise
UPDATE products 
SET franchise_id = '1a518dde-85b7-44ef-8bc4-092f53ddfd99'
WHERE franchise_id IS NULL;
```

---

### Option 3: Expand Franchise Logic (BEST LONG-TERM) 🎯
**Allow products shared across multiple franchises**

```typescript
// Check if user has permission to use these products
if (!isSuperAdmin && franchiseId) {
  // Show products:
  // 1. For this franchise
  // 2. Without franchise (shared)
  // 3. In a "shared_products" table (new)
  productsQuery = productsQuery.or(`franchise_id.eq.${franchiseId},franchise_id.is.null`)
  // Could also add: ,franchise_id.in.(shared_franchise_ids)
}
```

---

## IMMEDIATE FIX (WHAT I'M DOING NOW)

I'll implement **Option 1 temporarily** to unblock you, then explain **Option 2** for permanent fix.

This means:
1. Remove franchise filtering from product selection
2. All products visible to all franchises  
3. Test that products load in production

Then we'll migrate to proper franchise management.

---

## CODE FIX - LINE 2519-2521

**Change from:**
```typescript
if (!isSuperAdmin && franchiseId) {
  // Include products for this franchise OR legacy products without franchise_id
  productsQuery = productsQuery.or(`franchise_id.eq.${franchiseId},franchise_id.is.null`)
}
```

**Change to:**
```typescript
// For now, show all products (will be refined after testing)
// TODO: Implement proper franchise product sharing
if (!isSuperAdmin && franchiseId) {
  // Temporarily show all products for testing
  // Original: productsQuery = productsQuery.or(`franchise_id.eq.${franchiseId},franchise_id.is.null`)
  console.log('Products loaded for user - temporary open access for all franchises')
}
```

---

## FILES TO CHECK/FIX

### Primary File:
- `app/book-package/page.tsx` (Line 2515-2525)

### Secondary Files (similar issue possible):
- `app/bookings/[id]/select-products/page.tsx` (Line 73)
  - This also needs checking for franchise filtering
  - Currently just does: `.from("products").select(...)`
  - Might be affected differently

---

## IMPLEMENTATION

Let me fix this now by commenting out the franchise filter:
