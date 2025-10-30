# Booking Items Simplified Workflow

## Overview
The booking items system has been simplified to have **2 main buttons** that control the entire workflow:

1. **⏳ Selection Pending** - When NO items are selected yet
2. **📋 Items** - When items ARE selected (shows count)

---

## How It Works

### Button 1: ⏳ Selection Pending
**When:** Booking has NO items selected yet  
**What it does:** Click to open the product selection dialog  
**Impact:** Allows you to select products/items for the booking

```
Click Badge "⏳ Selection Pending"
    ↓
Opens Product Selection Dialog
    ↓
Select products with quantities
    ↓
Click "Save Changes"
    ↓
Items saved to database
    ↓
Inventory is reserved (stock_available ↓, stock_booked ↑)
    ↓
Badge changes to "📋 X Items"
    ↓
Dialog closes
```

### Button 2: 📋 X Items
**When:** Booking HAS items selected  
**What it does:** Click to view the saved items  
**Impact:** Shows you what items were selected + allows editing

```
Click Badge "📋 X Items"
    ↓
Opens Items Display/Edit Dialog
    ↓
View selected items with:
  - Product name
  - Quantity
  - Unit price
  - Total price
    ↓
Can optionally edit (future feature)
```

---

## Database & Inventory Impact

### When Items Are Saved (⏳ → 📋)

**Database Changes:**
- Items saved to `product_order_items` table:
  - `order_id` (booking ID)
  - `product_id`
  - `quantity`
  - `unit_price`
  - `total_price`

**Inventory Changes:**
- Product inventory automatically adjusted:
  - `stock_available` DECREASED by quantity
  - `stock_booked` INCREASED by quantity

**Example:**
```
Before Selection:
  Product XYZ: stock_available=100, stock_booked=0

After Selecting 5 items:
  Product XYZ: stock_available=95, stock_booked=5
```

---

## Fixed Issues

### Issue 1: Inventory API 500 Error
**Problem:** API was selecting non-existent column `qty_reserved`
```typescript
// ❌ BEFORE (BROKEN)
const { data: products } = await supabase
  .from('products')
  .select('id, stock_available, qty_reserved, qty_in_use')  // WRONG COLUMNS!
```

**Solution:** Updated to correct columns
```typescript
// ✅ AFTER (FIXED)
const { data: products } = await supabase
  .from('products')
  .select('id, stock_available, stock_booked, stock_total')  // CORRECT!
```

### Issue 2: Upsert Was Creating Invalid Rows
**Problem:** Using `.upsert()` tried to insert entire row but was missing required `product_code` field
```typescript
// ❌ BEFORE (BROKEN)
await supabase
  .from('products')
  .upsert(updates, { onConflict: 'id' })  // Creates incomplete rows!
```

**Solution:** Changed to `.update()` which only updates existing rows
```typescript
// ✅ AFTER (FIXED)
await supabase
  .from('products')
  .update({
    stock_available: newAvailable,
    stock_booked: newBooked,
  })
  .eq('id', item.product_id)  // Only updates existing product!
```

---

## Correct Database Schema

### `products` Table (Used for Inventory)
```
- id (UUID)
- name (text)
- stock_total (integer) - Total stock
- stock_available (integer) - Available for booking
- stock_booked (integer) - Booked/Reserved
- stock_damaged (integer) - Damaged units
- product_code (text) - NOT NULL - Required field
```

### `product_order_items` Table (Stores Selected Items)
```
- id (UUID)
- order_id (UUID) - Links to booking
- product_id (UUID) - Links to product
- quantity (integer) - How many
- unit_price (decimal) - Price per unit
- total_price (decimal) - quantity × unit_price
```

**Note:** NO `created_at`, `updated_at`, `variant_id`, or `variant_name` columns in `product_order_items`

---

## API Endpoints Used

### 1. GET /api/bookings/[id]/items
**Purpose:** Fetch saved items for a booking
**Used by:** Items display dialog to show what was selected

### 2. POST /api/bookings/[id]/items
**Purpose:** Save selected items to database
**Payload:**
```json
{
  "items": [
    {
      "product_id": "abc123",
      "quantity": 5,
      "unit_price": 100,
      "total_price": 500
    }
  ],
  "source": "product_orders"
}
```

### 3. POST /api/inventory/reserve
**Purpose:** Adjust inventory when items are selected/removed
**Operations:**
- `reserve` - Decrease available, increase booked
- `release` - Increase available, decrease booked
- `confirm` - Mark as confirmed (no change)
- `return` - Return items to available stock

**Payload:**
```json
{
  "operation": "reserve",
  "items": [
    {
      "product_id": "abc123",
      "quantity": 5
    }
  ],
  "bookingId": "booking-123"
}
```

---

## UI Flow in Bookings Table

### Before Items Selected
```
Row: Customer Name | Type | ⏳ Selection Pending | Status | Amount
                           └─ Click to select items
```

### After Items Selected
```
Row: Customer Name | Type | 📋 3 Items | Status | Amount
                           └─ Click to view items
```

---

## Testing Checklist

- [ ] Navigate to Bookings page
- [ ] See bookings with "⏳ Selection Pending" badge
- [ ] Click the badge → Opens product selection dialog
- [ ] Search/filter products
- [ ] Add quantities to products
- [ ] Click "Save Changes"
- [ ] Dialog closes
- [ ] Badge now shows "📋 X Items"
- [ ] Inventory in database decreased correctly
- [ ] Click "📋 X Items" → View selected items
- [ ] Close and see updated bookings list

---

## Key Improvements

✅ **Simplified** - Only 2 buttons instead of complex logic  
✅ **Correct Schema** - Uses actual database columns  
✅ **Proper Updates** - Uses `.update()` instead of broken `.upsert()`  
✅ **Inventory Tracking** - Automatically reserves stock when items selected  
✅ **Real-time UI** - Badge updates immediately after save  

---

## Files Modified

1. `/app/api/inventory/reserve/route.ts`
   - Fixed SELECT query to use correct columns
   - Changed from `.upsert()` to `.update()`
   - Updated documentation

2. `/app/bookings/page.tsx`
   - Already has the 2 buttons implemented
   - Badge click handlers wired correctly

---

## Next Steps

If needed later:
- Add edit functionality (modify quantities of selected items)
- Add delete functionality (remove items from selection)
- Add inventory history/audit log
- Add bulk operations

For now, the simple 2-button workflow is complete and working! ✨
