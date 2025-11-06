# 🚨 CRITICAL BUG FIXED: event_date NOT NULL Constraint

## Error
```
Order insert error: null value in column "event_date" of relation "product_orders" violates not-null constraint
```

## Root Cause
The `product_orders` table has `event_date` as **NOT NULL**, but:
- For rental bookings: `event_date` is required (correct)
- For direct sales: `event_date` was optional (validation passed)
- When submitting a direct sale **without event_date**, NULL was inserted into the NOT NULL column

## The Bug Flow
1. User creates direct sales order
2. Validation allows empty `event_date` for sales (only requires `delivery_date`)
3. Form submission converts empty date to `null`
4. Database insert fails: cannot insert NULL into NOT NULL column

## Solution Applied
For direct sales orders without `event_date`:
- **Use `delivery_date` as `event_date`**
- This satisfies the NOT NULL constraint
- Makes logical sense: delivery date is when the transaction happens for direct sales

## Code Changes
**File:** `/app/create-product-order/page.tsx`

**Location 1 - Edit Mode (lines ~700-710):**
```typescript
// BEFORE:
const eventDateTime = combineDateAndTime(formData.event_date, formData.event_time)

// AFTER:
let eventDateTime = combineDateAndTime(formData.event_date, formData.event_time)
if (!eventDateTime && formData.booking_type === "sale" && formData.delivery_date) {
  // For direct sales, use delivery_date as event_date if event_date is missing
  eventDateTime = combineDateAndTime(formData.delivery_date, formData.delivery_time)
}
```

**Location 2 - Create Mode (lines ~776-788):**
```typescript
// BEFORE:
const eventDateTime = combineDateAndTime(formData.event_date, formData.event_time)

// AFTER:
let eventDateTime = combineDateAndTime(formData.event_date, formData.event_time)
if (!eventDateTime && formData.booking_type === "sale" && formData.delivery_date) {
  // For direct sales, use delivery_date as event_date if event_date is missing
  eventDateTime = combineDateAndTime(formData.delivery_date, formData.delivery_time)
}
```

## Validation Status
✅ TypeScript: **PASS** (no errors)
✅ Logic: **SOUND** (uses delivery date for sales, works for rentals)
✅ UX: **IMPROVED** (no unnecessary required fields)

## Testing
To test the fix:
1. Create a direct sales order
2. Add products
3. Set delivery date (required for sales)
4. Leave event date empty (optional for sales)
5. Submit order
6. ✅ Should succeed (no more NULL constraint error)

## Impact
- ✅ **CRITICAL** - Allows direct sales orders to be created
- ✅ **Backward Compatible** - Rental orders unaffected
- ✅ **Data Integrity** - event_date now always has a valid value
