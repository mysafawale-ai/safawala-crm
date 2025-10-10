# 🔧 Fix Customer Code Error

## Problem
When creating a new customer, you get this error:
```
Error: null value in column "customer_code" of relation "customers" violates not-null constraint
```

## Root Cause
The `customers` table requires a `customer_code` field, but:
1. The API doesn't generate it
2. There's no auto-generation trigger in the database

## Solution
Run the updated fix script that:
1. ✅ Creates `generate_customer_code()` function
2. ✅ Creates auto-trigger to generate codes like `CUS-0001`, `CUS-0002`, etc.
3. ✅ Adds `created_by` column
4. ✅ Adds `updated_by` column
5. ✅ Verifies all other columns exist

## 📝 Steps to Fix

### Option A: Copy from Editor (Easiest)
The file is already open in your VS Code editor!

1. **Select All**: `Cmd+A` in the editor
2. **Copy**: `Cmd+C`
3. **Open Supabase**: Go to https://supabase.com/dashboard
4. **Navigate**: Your Project → SQL Editor → New Query
5. **Paste**: `Cmd+V`
6. **Run**: Click "Run" button
7. **Verify**: You should see success messages with ✅ checkmarks

### Option B: Use File Path
File location: `/Applications/safawala-crm/scripts/fixes/fix-customers-table-complete.sql`

## ✅ Expected Output
After running, you should see:
```
✅ Created generate_customer_code function
✅ Created auto-generation trigger
✅ Added created_by column
✅ Added updated_by column
✅ All standard columns verified
```

## 🧪 Test After Fix

1. Go to: http://localhost:3000/customers/new
2. Fill in:
   - Name: "Test Customer"
   - Phone: "9999999999"
   - WhatsApp: "9999999999"
   - Email: "test@example.com"
   - Address: "Test Address"
   - City: "Vadodara"
   - State: "Gujarat"
   - Pincode: "390011"
   - Notes: "Test notes"
3. Click "CREATE CUSTOMER"
4. **Should work now!** ✅

## 🔍 What the Fix Does

### Auto-Generate Customer Code
```sql
-- Trigger will automatically generate codes like:
CUS-0001  -- First customer
CUS-0002  -- Second customer
CUS-0003  -- Third customer
```

### Add Missing Columns
- `created_by` - Tracks who created the customer
- `updated_by` - Tracks who last updated the customer

### Backfill Existing Data
The script will also update existing customers to have a `created_by` value (set to the franchise admin).

## 🎯 Next Steps After Fix
1. Test customer creation
2. Verify customer code appears in the list
3. Check that franchise isolation still works
4. Test editing existing customers

## 📌 Important Notes
- This fix is **idempotent** - safe to run multiple times
- It won't affect existing customer data
- Customer codes will be sequential and unique
- All new customers will automatically get a code

---

**Need Help?** If you see any errors after running the script, share the error message!
