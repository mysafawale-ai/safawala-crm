# 🚨 QUICK FIX: Coupon Creation Failed - Database Setup Required

**Error:** "Failed to create coupon" with 500 Internal Server Error  
**Cause:** The `coupons` table doesn't exist in your Supabase database yet  
**Solution:** Run the migration SQL below ⬇️

---

## ✅ Quick Fix (2 Minutes)

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase Dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Copy & Run This SQL
Copy the entire migration from `ADD_COUPON_SYSTEM.sql` file or run this:

```sql
-- =====================================================
-- COUPON CODE SYSTEM - DATABASE MIGRATION
-- =====================================================

-- 1. CREATE COUPONS TABLE
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'flat', 'free_shipping', 'buy_x_get_y')),
    discount_value DECIMAL(10, 2) NOT NULL CHECK (discount_value >= 0),
    min_order_value DECIMAL(10, 2) DEFAULT 0,
    max_discount DECIMAL(10, 2),
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0 NOT NULL,
    per_user_limit INTEGER,
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true NOT NULL,
    franchise_id UUID REFERENCES franchises(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    CONSTRAINT valid_discount_value CHECK (
        (discount_type = 'percentage' AND discount_value <= 100) OR
        (discount_type IN ('flat', 'free_shipping'))
    ),
    CONSTRAINT valid_date_range CHECK (valid_until IS NULL OR valid_until > valid_from)
);

-- 2. CREATE COUPON USAGE TRACKING TABLE
CREATE TABLE IF NOT EXISTS coupon_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id),
    order_id UUID,
    order_type VARCHAR(20) CHECK (order_type IN ('product_order', 'package_booking')),
    discount_applied DECIMAL(10, 2) NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    franchise_id UUID REFERENCES franchises(id) ON DELETE CASCADE,
    
    CONSTRAINT fk_order_type CHECK (
        (order_type = 'product_order' OR order_type = 'package_booking')
    )
);

-- 3. ADD COUPON FIELDS TO PRODUCT_ORDERS
ALTER TABLE product_orders 
ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50),
ADD COLUMN IF NOT EXISTS coupon_discount DECIMAL(10, 2) DEFAULT 0 CHECK (coupon_discount >= 0);

-- 4. ADD COUPON FIELDS TO PACKAGE_BOOKINGS
ALTER TABLE package_bookings 
ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50),
ADD COLUMN IF NOT EXISTS coupon_discount DECIMAL(10, 2) DEFAULT 0 CHECK (coupon_discount >= 0);

-- 5. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_franchise ON coupons(franchise_id);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupons_valid_dates ON coupons(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon ON coupon_usage(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_customer ON coupon_usage(customer_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_order ON coupon_usage(order_id, order_type);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_franchise ON coupon_usage(franchise_id);
CREATE INDEX IF NOT EXISTS idx_product_orders_coupon ON product_orders(coupon_code);
CREATE INDEX IF NOT EXISTS idx_package_bookings_coupon ON package_bookings(coupon_code);

-- 6. CREATE UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION update_coupons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_coupons_updated_at
    BEFORE UPDATE ON coupons
    FOR EACH ROW
    EXECUTE FUNCTION update_coupons_updated_at();

-- 7. CREATE USAGE COUNT TRIGGER
CREATE OR REPLACE FUNCTION increment_coupon_usage()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE coupons 
    SET usage_count = usage_count + 1 
    WHERE id = NEW.coupon_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_coupon_usage
    AFTER INSERT ON coupon_usage
    FOR EACH ROW
    EXECUTE FUNCTION increment_coupon_usage();

-- SUCCESS MESSAGE
DO $$
BEGIN
    RAISE NOTICE '✅ Coupon system tables created successfully!';
    RAISE NOTICE '✅ You can now create coupons in the CRM';
END $$;
```

### Step 3: Click "Run" or Press Cmd/Ctrl + Enter

You should see success messages like:
```
✅ Coupon system tables created successfully!
✅ You can now create coupons in the CRM
```

### Step 4: Test Coupon Creation
1. Go back to your CRM
2. Refresh the page (Cmd/Ctrl + R)
3. Try creating the coupon again

---

## 🎯 What This Migration Does

### Tables Created:
1. **`coupons`** - Stores all coupon codes
   - Code, description, discount type/value
   - Usage limits, validity dates
   - Franchise isolation
   
2. **`coupon_usage`** - Tracks coupon usage
   - Who used which coupon
   - On which order
   - Discount amount applied

### Fields Added:
- **`product_orders.coupon_code`** - Store applied coupon code
- **`product_orders.coupon_discount`** - Store discount amount
- **`package_bookings.coupon_code`** - Store applied coupon code
- **`package_bookings.coupon_discount`** - Store discount amount

### Triggers Created:
- **Auto-increment usage count** when coupon is used
- **Auto-update timestamp** when coupon is modified

---

## 🧪 Test Your Coupon System

After running the migration, try creating this test coupon:

**Test Coupon:**
- Code: `TEST10`
- Description: `10% off for testing`
- Discount Type: `Percentage Discount`
- Percentage: `10%`
- Min Order Value: `500`
- Max Discount Cap: `1000`

**It should work!** ✅

---

## 📊 Verify Tables Were Created

Run this query to check:
```sql
SELECT 
    table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('coupons', 'coupon_usage')
ORDER BY table_name;
```

Should return:
```
coupon_usage
coupons
```

---

## 🔍 Common Issues & Solutions

### Issue 1: "relation does not exist"
**Problem:** Table wasn't created  
**Solution:** Run the migration SQL again

### Issue 2: "permission denied"
**Problem:** Database user doesn't have CREATE TABLE permissions  
**Solution:** Check you're logged in as database owner in Supabase

### Issue 3: Still getting 500 error
**Problem:** Old data cached  
**Solution:** 
1. Clear browser cache
2. Restart Next.js dev server
3. Try again

---

## 🎉 After Setup

Once tables are created, you can:
- ✅ Create unlimited coupons
- ✅ Set percentage or flat discounts
- ✅ Configure usage limits
- ✅ Set min order values
- ✅ Track coupon usage
- ✅ Apply coupons at checkout
- ✅ See discount in quotes and invoices

---

## 📝 Alternative: Use Supabase Dashboard UI

If SQL Editor doesn't work:

1. Go to **Database** → **Tables**
2. Click **Create a new table**
3. Use this approach for each table manually (not recommended, SQL is faster)

---

**Need Help?** Check the full migration file at: `/ADD_COUPON_SYSTEM.sql`

---

**Status after fix:** 
- ✅ Tables created
- ✅ Indexes added
- ✅ Triggers working
- ✅ Ready to create coupons!
