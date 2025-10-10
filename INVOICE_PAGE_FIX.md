# 🔧 Invoice Page Error Fix

## Problem
The invoice page at `localhost:3000/invoices` is showing errors:
- ❌ Failed to load resource: 400 status
- ❌ Error fetching product orders
- ❌ Product query error details

## Root Cause
The database tables `product_orders` and `package_bookings` are missing the `is_quote` column that the invoice service requires to filter quotes from actual orders/invoices.

## Solution

Run **TWO database migrations** in the Supabase SQL Editor:

### 📋 Quick Fix

```bash
# Run the helper script for guided instructions
node fix-invoice-page.js
```

### 🚀 Manual Fix

#### Step 1: Create Tables (if not exist)
1. Open Supabase SQL Editor: https://app.xplnyaxkusvuajtmorss.supabase.co/sql/new
2. Copy migration 1:
   ```bash
   cat MIGRATION_SPLIT_PRODUCT_AND_PACKAGE_BOOKINGS.sql | pbcopy
   ```
3. Paste in SQL Editor and click **Run**

#### Step 2: Add is_quote Column
1. Clear the SQL Editor
2. Copy migration 2:
   ```bash
   cat ADD_QUOTE_SUPPORT.sql | pbcopy
   ```
3. Paste in SQL Editor and click **Run**

#### Step 3: Verify
```bash
node check-invoice-schema.js
```

You should see:
```
✅ product_orders.is_quote - EXISTS
✅ package_bookings.is_quote - EXISTS
🎉 SUCCESS! Invoice page should work now.
```

#### Step 4: Test
Refresh `localhost:3000/invoices` in your browser. The page should now load without errors! 🎉

## What These Migrations Do

### Migration 1: MIGRATION_SPLIT_PRODUCT_AND_PACKAGE_BOOKINGS.sql
- Creates `product_orders` table (for individual product rentals/sales)
- Creates `product_order_items` table
- Creates `package_bookings` table (for package bookings)
- Creates `package_booking_items` table
- Adds indexes and triggers

### Migration 2: ADD_QUOTE_SUPPORT.sql
- Adds `is_quote` boolean column to `product_orders` (defaults to FALSE)
- Adds `is_quote` boolean column to `package_bookings` (defaults to FALSE)
- Creates indexes for efficient queries
- Allows system to distinguish:
  - **Quotes** (`is_quote = true`) - shown on `/quotes` page
  - **Orders/Invoices** (`is_quote = false`) - shown on `/invoices` page

## Files Created

- ✅ `fix-invoice-page.js` - Interactive helper script with guided instructions
- ✅ `check-invoice-schema.js` - Verification script to check if migrations ran successfully
- ✅ `INVOICE_PAGE_FIX.md` - This documentation

## Architecture

```
┌─────────────────────────────────────────────────┐
│  Invoice Page (/invoices)                      │
│  Uses: lib/services/invoice-service.ts         │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│  Queries Database:                              │
│  • product_orders WHERE is_quote = false        │
│  • package_bookings WHERE is_quote = false      │
└─────────────────────────────────────────────────┘
```

## Troubleshooting

### Error: "relation product_orders does not exist"
Run Migration 1 first (MIGRATION_SPLIT_PRODUCT_AND_PACKAGE_BOOKINGS.sql)

### Error: "column is_quote does not exist"
Run Migration 2 (ADD_QUOTE_SUPPORT.sql)

### Still seeing errors after migrations?
1. Check browser console for specific error messages
2. Run: `node check-invoice-schema.js` to verify schema
3. Check Supabase logs: https://app.xplnyaxkusvuajtmorss.supabase.co/project/_/logs/explorer
4. Ensure `.env.local` has correct credentials

## Need Help?

Run the helper script for interactive guidance:
```bash
node fix-invoice-page.js
```

The script will:
- ✅ Check if migration files exist
- ✅ Guide you through each step
- ✅ Offer to copy SQL to clipboard
- ✅ Provide verification commands
