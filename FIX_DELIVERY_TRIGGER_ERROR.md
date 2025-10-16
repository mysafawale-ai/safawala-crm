# 🚨 CRITICAL FIX #2 - Delivery Trigger Error

## ❌ ERROR
```
{code: '42703', message: 'record "new" has no field "order_type"'}
```

## 🔍 ROOT CAUSE
**File**: `MIGRATION_DELIVERY_RETURN_SYSTEM.sql` (Line 306)

The trigger function `auto_create_delivery()` tries to access:
```sql
booking_type_val := NEW.order_type; -- ❌ WRONG!
```

But the `product_orders` table has the column named `booking_type`, not `order_type`!

---

## ✅ THE FIX

### Step 1: Run This SQL in Supabase

```sql
CREATE OR REPLACE FUNCTION auto_create_delivery()
RETURNS TRIGGER AS $$
DECLARE
  new_delivery_number TEXT;
  delivery_address TEXT;
  delivery_date DATE;
  booking_type_val TEXT;
BEGIN
  new_delivery_number := 'DEL-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('delivery_seq')::TEXT, 5, '0');
  
  IF TG_TABLE_NAME = 'product_orders' THEN
    booking_type_val := NEW.booking_type; -- ✅ FIXED: was NEW.order_type
    delivery_address := COALESCE(NEW.delivery_address, NEW.venue_address, 'To be confirmed');
    delivery_date := COALESCE(NEW.delivery_date, NEW.event_date, CURRENT_DATE + INTERVAL '1 day');
  ELSIF TG_TABLE_NAME = 'package_bookings' THEN
    booking_type_val := 'rental';
    delivery_address := COALESCE(NEW.venue_address, 'To be confirmed');
    delivery_date := COALESCE(NEW.delivery_date, NEW.event_date, CURRENT_DATE + INTERVAL '1 day');
  ELSE
    booking_type_val := COALESCE(NEW.type, 'rental');
    delivery_address := COALESCE(NEW.delivery_address, NEW.venue_address, 'To be confirmed');
    delivery_date := COALESCE(NEW.delivery_date, NEW.event_date, CURRENT_DATE + INTERVAL '1 day');
  END IF;
  
  INSERT INTO deliveries (
    delivery_number, customer_id, booking_id, booking_source,
    booking_type, delivery_address, delivery_date, status,
    franchise_id, created_by, created_at
  ) VALUES (
    new_delivery_number, NEW.customer_id, NEW.id,
    CASE 
      WHEN TG_TABLE_NAME = 'product_orders' THEN 'product_order'
      WHEN TG_TABLE_NAME = 'package_bookings' THEN 'package_booking'
      ELSE 'booking'
    END,
    booking_type_val, delivery_address, delivery_date, 'pending',
    NEW.franchise_id, NEW.created_by, NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Or run the file**: `FIX_DELIVERY_TRIGGER_ORDER_TYPE.sql`

---

## 📊 WHAT CHANGED

| Before (Broken) | After (Fixed) |
|-----------------|---------------|
| `NEW.order_type` | `NEW.booking_type` |

**Simple one-word fix!** 🎯

---

## 🧪 VERIFY THE FIX

```sql
-- Check the function definition
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'auto_create_delivery';
```

Should show `NEW.booking_type` (not `NEW.order_type`)

---

## 🎯 WHY THIS HAPPENED

The trigger was written when the column might have been called `order_type`, but the actual table uses `booking_type`:

```sql
-- product_orders table schema
CREATE TABLE product_orders (
  id uuid PRIMARY KEY,
  order_number text,
  booking_type text, -- ✅ This is the actual column name
  -- NOT order_type!
  ...
);
```

---

## 📝 COMPLETE MIGRATION CHECKLIST

Now you need to run **TWO** migrations:

### ✅ Migration 1: Add security_deposit column
```sql
ALTER TABLE product_orders 
ADD COLUMN IF NOT EXISTS security_deposit numeric(12,2) DEFAULT 0;
```

### ✅ Migration 2: Fix delivery trigger
```sql
-- Run the CREATE OR REPLACE FUNCTION from above
```

---

## 🚀 DEPLOYMENT STATUS

| Issue | File | Status |
|-------|------|--------|
| Missing `security_deposit` column | `ADD_SECURITY_DEPOSIT_TO_PRODUCT_ORDERS.sql` | ⚠️ Pending |
| Wrong column in trigger | `FIX_DELIVERY_TRIGGER_ORDER_TYPE.sql` | ⚠️ Pending |

**Priority**: 🔴 **BOTH CRITICAL - RUN IMMEDIATELY**

---

## 🎬 TESTING AFTER FIX

1. Go to create product order page
2. Fill in details
3. Add products
4. Click **CREATE ORDER**
5. ✅ Should create order
6. ✅ Should auto-create delivery
7. ✅ No more errors!

---

## 📁 FILES CREATED

1. `FIX_DELIVERY_TRIGGER_ORDER_TYPE.sql` ← Run this
2. `FIX_DELIVERY_TRIGGER_ERROR.md` ← This doc

---

**Next Step**: Run BOTH SQL migrations in Supabase! 🚀
