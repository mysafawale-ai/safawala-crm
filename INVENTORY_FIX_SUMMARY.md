# Inventory Management System - Schema Mismatch Fix

## Problem Identified

**Error:** `column products.qty_reserved does not exist`

When saving selected items for a booking, the inventory reservation API was failing because it was trying to use columns that don't exist in the Supabase `products` table.

### Root Cause

The API code was written expecting these columns:
- `qty_reserved` ❌ (doesn't exist)
- `qty_in_use` ❌ (doesn't exist)

But the actual `products` table schema has:
- `stock_total` ✅
- `stock_available` ✅
- `stock_booked` ✅
- `stock_damaged` ✅

## Solution Implemented

### File: `/app/api/inventory/reserve/route.ts`

**Changed all inventory column references:**

1. **SELECT Query** (Line 51)
   - Before: `select('id, stock_available, qty_reserved, qty_in_use')`
   - After: `select('id, stock_available, stock_booked, stock_total')`

2. **Reserve Operation** (Lines 87-90)
   - Before: Increasing `qty_reserved`
   - After: Increasing `stock_booked`
   - Logic: When items are selected, reduce `stock_available` and increase `stock_booked`

3. **Release Operation** (Lines 92-96)
   - Before: Decreasing `qty_reserved`
   - After: Decreasing `stock_booked`
   - Logic: When items are removed, increase `stock_available` and decrease `stock_booked`

4. **Confirm Operation** (Lines 98-101)
   - Before: Moving from `qty_reserved` to `qty_in_use`
   - After: No inventory change (just status update)
   - Logic: Confirmed items are already in `stock_booked`

5. **Return Operation** (Lines 103-108)
   - Before: Decreasing `qty_in_use` and increasing `stock_available`
   - After: Decreasing `stock_booked` and increasing `stock_available`
   - Logic: When items are returned after use, restore them to available stock

## Inventory State Mapping

### Products Table Columns
```
stock_total     = Total quantity of product (stock_available + stock_booked + stock_damaged)
stock_available = Items available for booking
stock_booked    = Items reserved/selected for bookings (equivalent to qty_reserved)
stock_damaged   = Items that cannot be used
```

### Operation Flow
```
1. RESERVE (when items are selected)
   stock_available --  (decrease by quantity)
   stock_booked ++     (increase by quantity)

2. RELEASE (when items are deselected)
   stock_available ++  (increase by quantity)
   stock_booked --     (decrease by quantity)

3. CONFIRM (when booking is delivered)
   No change - items are already tracked in stock_booked

4. RETURN (when items are returned after delivery)
   stock_available ++  (increase by quantity)
   stock_booked --     (decrease by quantity)
```

## Testing

After this fix, the item selection workflow should now complete successfully:

1. ✅ User selects items for a booking
2. ✅ Items are saved to database
3. ✅ Inventory is reserved (stock_available decreases, stock_booked increases)
4. ✅ Booking status updates to reflect item selection

## Files Modified

- `/app/api/inventory/reserve/route.ts` - Fixed column references and logic

## Status

✅ **FIXED** - All column references corrected to match Supabase schema
