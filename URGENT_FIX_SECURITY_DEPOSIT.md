# 🚨 URGENT FIX - Missing security_deposit Column

## ❌ ERROR
```
PGRST204: Could not find the 'security_deposit' column of 'product_orders' in the schema cache
```

## 🔍 ROOT CAUSE
**File**: `/app/create-product-order/page.tsx` (Line 556)

The code tries to insert `security_deposit` into `product_orders`:
```typescript
const { data: order, error } = await supabase
  .from("product_orders")
  .insert({
    order_number: orderNumber,
    customer_id: selectedCustomer.id,
    // ... other fields ...
    security_deposit: totals.deposit, // ← THIS COLUMN DOESN'T EXIST!
    amount_paid: amountPaidNow,
    // ... rest ...
  })
```

**But the `product_orders` table is MISSING this column!**

---

## ✅ SOLUTION

### Step 1: Run Migration in Supabase SQL Editor

Open your **Supabase Dashboard** → **SQL Editor** → Paste and execute:

```sql
-- Add security_deposit column to product_orders table
ALTER TABLE product_orders 
ADD COLUMN IF NOT EXISTS security_deposit numeric(12,2) DEFAULT 0;

-- Add index
CREATE INDEX IF NOT EXISTS idx_product_orders_security_deposit 
ON product_orders(security_deposit) 
WHERE security_deposit > 0;

-- Add comment
COMMENT ON COLUMN product_orders.security_deposit IS 'Refundable security deposit amount for rental orders';
```

**Or run the complete file**: `ADD_SECURITY_DEPOSIT_TO_PRODUCT_ORDERS.sql`

---

### Step 2: Verify Column Exists

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'product_orders' 
AND column_name = 'security_deposit';
```

**Expected Output**:
```
column_name       | data_type | column_default
------------------|-----------|----------------
security_deposit  | numeric   | 0
```

---

### Step 3: Test the Fix

1. Go to: `https://mysafawala.com/create-product-order`
2. Fill in customer and event details
3. Add products (rental type)
4. Click **"CREATE ORDER"**
5. ✅ Should work without errors!

---

## 📊 WHY THIS HAPPENED

1. **Migration Mismatch**: 
   - ✅ `package_bookings` has `security_deposit` (added via `ADD_SECURITY_DEPOSIT_TO_PACKAGE_BOOKINGS.sql`)
   - ❌ `product_orders` was MISSING `security_deposit`

2. **Code Assumed Column Exists**:
   - The frontend code at line 556 was already written to use `security_deposit`
   - But database migration was never run

3. **Schema Cache Error**:
   - Supabase caches table schemas
   - When column doesn't exist, it throws `PGRST204` error

---

## 🔄 RELATED TABLES

### ✅ Already Have security_deposit
- `product_order_items` ← Item-level deposit ✅
- `package_bookings` ← Order-level deposit ✅
- `booking_items` ← Legacy item-level deposit ✅

### ❌ Was Missing (Now Fixed)
- `product_orders` ← Order-level deposit (FIXED!)

---

## 📝 SCHEMA COMPARISON

### Before (Broken)
```sql
CREATE TABLE product_orders (
  id uuid PRIMARY KEY,
  order_number text,
  customer_id uuid,
  total_amount numeric(12,2),
  -- security_deposit MISSING! ❌
  status text,
  created_at timestamptz
);
```

### After (Fixed)
```sql
CREATE TABLE product_orders (
  id uuid PRIMARY KEY,
  order_number text,
  customer_id uuid,
  total_amount numeric(12,2),
  security_deposit numeric(12,2) DEFAULT 0, -- ✅ ADDED
  status text,
  created_at timestamptz
);
```

---

## 🧪 POST-FIX VALIDATION

Run this query to check recent orders:

```sql
SELECT 
  order_number,
  booking_type,
  total_amount,
  security_deposit,
  amount_paid,
  pending_amount,
  status,
  created_at
FROM product_orders
WHERE booking_type = 'rental'  -- Rentals should have deposits
ORDER BY created_at DESC
LIMIT 10;
```

**Expected**:
- Rental orders with `security_deposit > 0`
- Sale orders with `security_deposit = 0`

---

## 🎯 SUMMARY

| Issue | Status | Action Required |
|-------|--------|----------------|
| Missing column | ✅ Fixed | Run migration SQL |
| Code references column | ✅ Correct | No change needed |
| Schema cache | ✅ Will refresh | After migration |
| Production impact | ⚠️ Critical | **Deploy ASAP** |

---

## 🚀 DEPLOYMENT PRIORITY

**Priority**: 🔴 **CRITICAL - PRODUCTION BROKEN**

**Impact**: 
- ❌ **ALL product orders are failing**
- ❌ Cannot create rental orders
- ❌ Cannot create sale orders
- ✅ Package bookings still working (different table)

**Time to Fix**: ~2 minutes (just run the SQL migration)

---

## 📁 FILES CREATED

1. `ADD_SECURITY_DEPOSIT_TO_PRODUCT_ORDERS.sql` ← Run this migration
2. `URGENT_FIX_SECURITY_DEPOSIT.md` ← This documentation

---

## ✅ CHECKLIST

- [ ] Run `ADD_SECURITY_DEPOSIT_TO_PRODUCT_ORDERS.sql` in Supabase
- [ ] Verify column exists (query above)
- [ ] Test creating a product order
- [ ] Test creating a rental order with deposit
- [ ] Verify `security_deposit` is saved correctly
- [ ] Check that amount_paid includes deposit for rentals

---

**Status**: 🟡 **AWAITING MIGRATION EXECUTION**

**Next Step**: Run the SQL migration in Supabase SQL Editor NOW! 🚀
