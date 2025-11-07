# 🚀 How to Execute Direct Sales Migration in Supabase

## Problem
The `direct_sales_orders` and `direct_sales_items` tables don't exist in your Supabase database yet. The SQL migration file was created but never executed.

## Solution: Run the Migration in Supabase Console

### Step 1: Open Supabase SQL Editor
1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **+ New Query**

### Step 2: Copy the Migration SQL
The migration file is at:
```
/Applications/safawala-crm/sql/ADD_DIRECT_SALES_TABLES.sql
```

Copy the **entire content** of this file.

### Step 3: Paste & Execute
1. Paste the SQL into the Supabase SQL editor
2. Click the **▶️ Run** button (or press Cmd+Enter on Mac)
3. Watch for any errors in the output panel

### Expected Success Output
```
CREATE TABLE
CREATE INDEX
CREATE TRIGGER
ALTER TABLE
CREATE POLICY
GRANT
CREATE OR REPLACE VIEW
```

If you see any errors about "already exists", that's fine - the `IF NOT EXISTS` clauses handle that.

---

## What This Migration Does

✅ Creates `direct_sales_orders` table with 30+ fields
✅ Creates `direct_sales_items` table for line items
✅ Adds indexes for performance (franchise, status, created_at, etc.)
✅ Adds triggers for auto-updating timestamps
✅ Enables RLS (Row-Level Security) policies
✅ Creates backward compatibility view `product_orders_all`
✅ Grants permissions to authenticated users

---

## After Migration: Testing

Once the migration runs successfully, try creating a direct sale in the app:

1. Go to **Create > Product Order**
2. Fill in the form
3. Select **Sale** as booking type
4. Click **Submit**

Should now show: ✅ "Direct sale created successfully"

---

## Troubleshooting

### Error: "relation 'direct_sales_orders' does not exist"
→ The migration didn't run. Execute it again.

### Error: "new row violates row-level security policy"
→ The RLS policies are too restrictive. Check that:
   - Your user has a `franchise_id` set in the users table
   - The `franchise_id` you're inserting matches your user's franchise
   - Your user role is `super_admin` or has a franchise assigned

### Error: "syntax error in SQL"
→ There may be a formatting issue. Try running one section at a time:
   - First, just the table creation (lines 1-100)
   - Then, the indexes (lines 100-150)
   - Then, the RLS policies (lines 150-250)
   - Finally, the view (lines 250+)

---

## Quick Copy-Paste Links

**SQL Migration File**:
Open this file and copy all content:
```
./sql/ADD_DIRECT_SALES_TABLES.sql
```

**Supabase Console**:
1. Go to your project: https://app.supabase.com
2. Click SQL Editor
3. Click "+ New Query"
4. Paste the SQL from the file above
5. Click "▶️ Run"

---

## Expected Result After Successful Migration

The app will now:
✅ Allow creating direct sales orders with DSL* prefix
✅ Store products, amounts, payment info in direct_sales tables
✅ Show direct sales in the bookings page
✅ Display DirectSalesOrderDetails component when viewing DSL* orders
✅ Deduct inventory from products when sales are created

---

**Note**: This migration is idempotent (safe to run multiple times). All statements use `IF NOT EXISTS` and `DROP POLICY IF EXISTS` to avoid errors.
