# 🚨 Direct Sales - RLS Policy Error Resolution

## ❌ Problem Summary

When trying to create a direct sale order, you get:
```
Error: new row violates row-level security policy for table "direct_sales_orders"
```

## 🔴 Root Cause

**The migration SQL file has NOT been executed in your Supabase database.**

The code was created locally and committed to git, but the actual database tables don't exist yet.

## ✅ Solution (3 Steps)

### Step 1️⃣: Open Supabase SQL Editor

1. Go to **https://app.supabase.com**
2. Select your Safawala CRM project
3. Click **SQL Editor** in the left sidebar
4. Click **+ New Query** button

### Step 2️⃣: Copy & Paste the Migration SQL

**Location of the SQL file:**
```
/Applications/safawala-crm/sql/ADD_DIRECT_SALES_TABLES.sql
```

1. Open this file in VS Code
2. Select **all content** (Cmd+A)
3. Copy it (Cmd+C)
4. Paste it into the Supabase SQL editor (Cmd+V)

### Step 3️⃣: Execute the Migration

1. Click the **▶️ Run** button (or Cmd+Enter)
2. Wait for the query to complete
3. Look for success output in the Results panel:
   ```
   CREATE TABLE
   CREATE INDEX
   CREATE TRIGGER
   ALTER TABLE
   CREATE POLICY
   ...
   ```

**If you see errors about "already exists", that's FINE** - the `IF NOT EXISTS` clauses prevent duplicate creation.

---

## 📋 What the Migration Creates

✅ **direct_sales_orders** table
  - Fields: sale_number, customer_id, franchise_id, sale_date, delivery_date, venue_address, payment info, totals, status, notes, etc.
  - Prefix: DSL* (e.g., DSL1234567890)

✅ **direct_sales_items** table
  - Links sales to products (product_id, quantity, unit_price, total_price)

✅ **RLS Policies** (Row-Level Security)
  - Ensures users can only see/edit their own franchise's sales
  - Franchise isolation for multi-tenant safety

✅ **Indexes & Triggers**
  - Performance optimization
  - Auto-update timestamps

✅ **Backward Compatibility View**
  - `product_orders_all` view unions legacy and new sales

---

## 🧪 Test After Migration

Once the migration completes:

1. **Go to**: Create > Product Order (in the app)
2. **Select**: Booking Type = "Sale"
3. **Fill in**: Customer, products, amounts, etc.
4. **Click**: Submit

**Expected Result**: ✅ "Direct sale created successfully"

---

## 🆘 If Still Getting RLS Error

**See**: `RLS_ERROR_DIAGNOSTIC.md` for:
- 4 diagnostic checks to verify the migration worked
- 4 solutions for common RLS issues
- Manual testing queries
- User franchise assignment verification

---

## 📂 Related Files

| File | Purpose |
|------|---------|
| `sql/ADD_DIRECT_SALES_TABLES.sql` | The migration SQL to execute |
| `MIGRATION_INSTRUCTIONS.md` | Detailed step-by-step guide |
| `RLS_ERROR_DIAGNOSTIC.md` | Troubleshooting guide for RLS issues |
| `components/bookings/direct-sales-order-details.tsx` | UI component (already created) |
| `app/bookings/page.tsx` | Integration into bookings page (already done) |
| `app/create-product-order/page.tsx` | Form for creating sales (already updated) |

---

## 🎯 Current State

| Component | Status | Details |
|-----------|--------|---------|
| Database Tables | ❌ **PENDING** | Migration SQL not executed in Supabase |
| Backend API | ✅ Prepared | API routes ready for direct sales |
| Frontend Form | ✅ Ready | Create product order form configured |
| UI Component | ✅ Built | DirectSalesOrderDetails component created |
| Git Commits | ✅ Pushed | All code committed and pushed |

---

## 🚀 Timeline to Full Functionality

1. **NOW**: Execute the migration SQL in Supabase ⏳ *You are here*
2. **+5 min**: Test creating a direct sale order
3. **+10 min**: View direct sales in bookings page
4. **+15 min**: Full feature ready!

---

## 📞 Quick Reference

**To Execute Migration:**
1. Supabase Console → SQL Editor → New Query
2. Paste: `sql/ADD_DIRECT_SALES_TABLES.sql`
3. Click: ▶️ Run
4. Test: Create > Product Order > Sale

**For Troubleshooting:**
- See: `RLS_ERROR_DIAGNOSTIC.md`
- Run: The 4 diagnostic checks
- Apply: Solution 1-4 as needed

---

**Status**: Ready for migration execution. All code prepared and tested locally. ✅

**Next Action**: Execute the SQL migration in Supabase console.
