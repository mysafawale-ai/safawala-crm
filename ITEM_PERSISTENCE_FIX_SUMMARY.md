# Item Persistence Fix - Complete Solution

## Problem Identified
Items selected for bookings/quotes were NOT persisting when editing. After creating a booking with products and then editing it, the items showed as "No items added yet".

## Root Cause Analysis
The issue was discovered by comparing working code (lost/damaged items) with broken code (regular items):

**Why Lost/Damaged Items WORKED:**
- Saved all product details denormalized: `product_name`, `barcode`, `type`, `quantity`, `charge_per_item`, `total_charge`, `notes`
- Loaded directly from table without JOIN: `SELECT * FROM order_lost_damaged_items`
- No dependency on products table - items persist even if product deleted

**Why Regular Items FAILED:**
- Saved only minimal data: `product_id`, `quantity`, `unit_price`, `total_price`
- Tried to load with JOIN: `SELECT ... FROM product_order_items JOIN products ON ...`
- If product deleted or RLS blocked → JOIN returns NULL → items appear missing

## Solution Implemented

### Step 1: Database Migration
**File:** `FIX_PRODUCT_ORDER_ITEMS_DENORMALIZATION.sql`

Added denormalized columns to `product_order_items` table:
```sql
ALTER TABLE product_order_items ADD COLUMN IF NOT EXISTS product_name TEXT;
ALTER TABLE product_order_items ADD COLUMN IF NOT EXISTS barcode TEXT;
ALTER TABLE product_order_items ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE product_order_items ADD COLUMN IF NOT EXISTS image_url TEXT;

CREATE INDEX IF NOT EXISTS idx_product_order_items_barcode ON product_order_items(barcode);
CREATE INDEX IF NOT EXISTS idx_product_order_items_product_name ON product_order_items(product_name);
```

### Step 2: Code Changes in `create-invoice/page.tsx`

#### A. Save Items - handleCreateOrder() function
**BEFORE:** Minimal data
```typescript
const itemsData = invoiceItems.map(item => ({
  order_id: order.id,
  product_id: item.product_id,
  quantity: item.quantity,
  unit_price: item.unit_price,
  total_price: item.total_price,
}))
```

**AFTER:** Denormalized data
```typescript
const itemsData = invoiceItems.map(item => ({
  order_id: order.id,
  product_id: item.product_id,
  quantity: item.quantity,
  unit_price: item.unit_price,
  total_price: item.total_price,
  // DENORMALIZE product details
  product_name: item.product_name || "",
  barcode: item.barcode || "",
  category: item.category || "",
  image_url: item.image_url || "",
}))
```

#### B. Save Items - handleSaveAsQuote() function
Applied same denormalization pattern to quote saves.

#### C. Load Items - loadExistingOrder() function
**BEFORE:** Query with JOIN (fails if product missing)
```typescript
const { data: orderItems } = await supabase
  .from("product_order_items")
  .select(`
    id, product_id, quantity, unit_price, total_price,
    products (id, name, barcode, product_code, category, image_url, ...)
  `)
  .eq("order_id", order.id)

const items = orderItems.map(item => ({
  product_id: item.product_id,
  product_name: item.products?.name || "Unknown", // ← NULL if JOIN fails
  barcode: item.products?.barcode,
  ...
}))
```

**AFTER:** Query denormalized columns directly
```typescript
const { data: orderItems } = await supabase
  .from("product_order_items")
  .select("*")  // Get all columns including denormalized data
  .eq("order_id", order.id)

const items = orderItems.map(item => ({
  product_id: item.product_id,
  product_name: item.product_name || "Unknown",  // ← Read directly from column
  barcode: item.barcode || "",                    // ← Read directly from column
  category: item.category || "",                  // ← Read directly from column
  image_url: item.image_url || "",                // ← Read directly from column
  ...
}))
```

## Files Modified
- `/app/create-invoice/page.tsx` - Updated save and load logic (3 functions)
- `/FIX_PRODUCT_ORDER_ITEMS_DENORMALIZATION.sql` - Migration file
- `/supabase/migrations/[timestamp]_fix_product_order_items_denormalization.sql` - Migration in migrations folder
- `/APPLY_MIGRATION_INSTRUCTIONS.sql` - Instructions for applying migration

## How to Apply

### Option 1: Manual (Supabase Dashboard)
1. Go to Supabase Dashboard > SQL Editor
2. Create a new query
3. Copy-paste the SQL from `FIX_PRODUCT_ORDER_ITEMS_DENORMALIZATION.sql`
4. Click "Run"

### Option 2: Supabase CLI
```bash
supabase migrations push
```

## Testing the Fix

1. **Create a new booking:**
   - Select a package or add products
   - Click "Create Order"
   - Verify items appear in summary

2. **Edit the booking:**
   - Click "Edit" on the created booking
   - **BEFORE FIX:** Items would be missing ("No items added yet")
   - **AFTER FIX:** Items should display correctly with all details (name, barcode, etc.)

3. **Verify data:**
   - In Supabase, query: `SELECT * FROM product_order_items WHERE order_id = '<order-id>'`
   - Should see `product_name`, `barcode`, `category`, `image_url` populated

## Why This Solves the Problem

1. **No JOIN dependency:** Items load regardless of products table state
2. **RLS-proof:** Denormalized data bypasses RLS restrictions on products table
3. **Deletion-safe:** If product is deleted, items still display with saved details
4. **Matches working pattern:** Same approach as order_lost_damaged_items which works perfectly

## Deployment
- Build: ✅ Successful (`pnpm build`)
- Git commit: ✅ Committed with detailed message
- Ready to deploy and apply migration
