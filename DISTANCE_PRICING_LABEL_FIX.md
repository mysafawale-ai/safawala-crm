# Distance Pricing Label Fix

## Date: 2025-10-09

## Issue
The distance label in the package booking wizard was showing:
```
Distance (from pincode 410001)  ← Customer's pincode
```

This was confusing because the distance is actually calculated **FROM your store location (390001) TO the customer's location**.

## Solution
Changed the label to always show the correct source pincode:
```
Distance (from pincode 390001)  ← Your store pincode
```

## How Distance Pricing Works

### 1. Distance Calculation
The system calculates distance from **your store (390001)** to the customer's pincode:

```typescript
const basePincode = 390001  // Your store location
const customerPincode = parseInt(customer.pincode)  // e.g., 410001
const estimatedKm = Math.abs(customerPincode - basePincode) / 1000

// Example:
// Customer pincode: 410001
// Distance: |410001 - 390001| / 1000 = 20 km
```

### 2. Distance Pricing Lookup
Once distance is calculated, the system automatically fetches pricing:

#### A. Per-Variant Distance Pricing (First Priority)
Checks `distance_pricing` table for the selected package variant:
```sql
SELECT min_km, max_km, base_price_addition, extra_price, price_multiplier
FROM distance_pricing
WHERE variant_id = '<selected_variant_id>'
```

Example pricing rules:
| Min KM | Max KM | Pricing Rule |
|--------|--------|--------------|
| 0 | 10 | No extra charge |
| 11 | 25 | +₹500 flat |
| 26 | 50 | +₹1500 flat |
| 51 | 100 | 1.2x multiplier (20% extra) |

#### B. Global Distance Pricing (Fallback)
If no variant-specific pricing exists, checks `distance_pricing_tiers`:
```sql
SELECT min_distance, max_distance, price_multiplier, extra_price
FROM distance_pricing_tiers
WHERE is_active = true
```

### 3. Price Application
The distance surcharge is added to each booking item:
- **Flat Addition**: `base_price_addition` or `extra_price` added directly
- **Multiplier**: `price_multiplier` × base_price (e.g., 1.2 = 20% extra)
- **Combined Total**: Shows in "Items Subtotal" (distance charges included)

## Visual Example

### Before Fix ❌
```
┌────────────────────────────────────┐
│ Distance (from pincode 410001)     │ ← Wrong! (Customer's pincode)
│ 20 km                              │
└────────────────────────────────────┘
```

### After Fix ✅
```
┌────────────────────────────────────┐
│ Distance (from pincode 390001)     │ ← Correct! (Your store pincode)
│ 20 km                              │
└────────────────────────────────────┘
```

## Database Tables Used

### `distance_pricing`
Per-variant distance pricing rules:
```sql
variant_id          | uuid (FK to package_variants)
min_km              | integer
max_km              | integer (nullable = unlimited)
base_price_addition | numeric (flat charge)
extra_price         | numeric (alternative flat charge)
price_multiplier    | numeric (e.g., 1.2 = 20% markup)
```

### `distance_pricing_tiers`
Global fallback pricing:
```sql
min_distance        | integer
max_distance        | integer (nullable = unlimited)
price_multiplier    | numeric
extra_price         | numeric
is_active           | boolean
```

## Testing

1. **View Package Booking**
   - Go to `/book-package`
   - Select customer "Out of vadodara" (pincode 410001)
   - Verify label shows: "Distance (from pincode 390001)"
   - Verify distance shows: "20 km"

2. **Check Distance Pricing**
   - Add a package variant to booking
   - Check if the price includes distance surcharge
   - The distance addon is automatically calculated based on:
     - Variant's distance_pricing rules
     - OR global distance_pricing_tiers
     - Added to Items Subtotal

3. **Different Customer Pincodes**
   - Customer at 390001: Distance = 0 km (same location)
   - Customer at 400001: Distance = 10 km
   - Customer at 380001: Distance = 10 km
   - Customer at 500001: Distance = 110 km

## Files Modified

1. `/app/book-package/page.tsx` - Fixed distance label to show 390001

## Related Files

- `/app/book-package/page.tsx` lines 145-188: `computeDistanceAddon()` function
- `/app/book-package/page.tsx` lines 290-310: Distance calculation from 390001
- `/app/book-package/page.tsx` line 766: Distance label display

## Summary

✅ **Label Fixed** - Now correctly shows "Distance (from pincode 390001)"

✅ **Distance Pricing Working** - System automatically fetches and applies distance-based pricing

✅ **Clear Communication** - Customers see accurate distance from your store

---

## How to Set Up Distance Pricing

If you want to configure distance-based pricing for your packages:

### Option 1: Per-Variant Pricing (Recommended)
Configure specific pricing for each package variant in `distance_pricing` table.

### Option 2: Global Pricing
Set up universal distance tiers in `distance_pricing_tiers` table.

Contact your developer to set up these pricing rules based on your business needs!
