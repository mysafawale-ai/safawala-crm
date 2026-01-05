# Hybrid Invoicing System - Testing Guide

## System Overview
The hybrid invoicing system allows you to:
1. Write ANY invoice number format (INV001, SALE500, TEST999, etc.)
2. System automatically increments from that number next time
3. No type separation - fully flexible

## Testing Steps

### Steplp -d Zebra_Technologies_ZTC_ZD230_203dpi_ZPL ~/Downloads/YOUR_FILE.zpl 1: Create First Invoice with Manual Number
1. Open Create Invoice page
2. **IMPORTANT**: Clear the auto-filled invoice number
3. Type your custom number: `INV0001`
4. Fill in required fields (Customer, Event Date, etc.)
5. Add at least one item to the cart
6. Click "Save & Continue"
7. Check browser console (F12 → Console tab) for logs:
   - `[CreateOrder] Creating order with invoice_number: INV0001`
   - `[CreateOrder] Order number "INV0001" is unique, using it`
   - `[Hybrid Invoice] Saved invoice number: INV0001`

### Step 2: Verify It Was Saved
1. Go to Bookings list
2. Find the booking you just created
3. Verify it shows "INV0001" as the order number

### Step 3: Create Second Invoice - Check Auto-Increment
1. Open Create Invoice page again
2. Check what number auto-loads
3. **Expected**: Should show `INV0002` (or whatever next number is)
4. Check console for:
   - `[LoadNextInvoice] User franchise_id: [your-id]`
   - `[InvoiceSequences] Found last order: INV0001`
   - `[InvoiceSequences] Extracted: prefix="INV", lastNum=1, next="INV0002"`
   - `[LoadNextInvoice] API returned: INV0002`

### Step 4: Test Different Format
1. Manually change "INV0002" to "SALE100"
2. Add items and save
3. Create new invoice
4. **Expected**: Should show `SALE101`
5. Check console logs match the new format

## Troubleshooting - What the Logs Mean

### If you see `ORD001` instead of your number:
- Check: `[LoadNextInvoice] API returned: ORD001` 
- Means: No previous orders found in database
- Solution: Verify your first order actually saved by checking Bookings list

### If you see regex error:
- Check: `[InvoiceSequences] Regex failed to parse: ...`
- Means: Number format doesn't match pattern `/^([A-Za-z0-9-]+?)(\d+)$/`
- Solution: Number must end with digits. Valid: `INV001`, `SALE-100`, `TEST999`. Invalid: `INV`, `TEST-`

### If auto-load doesn't happen:
- Check: `[LoadNextInvoice] Error loading next invoice number:`
- Means: API call failed
- Solution: Check network tab in DevTools to see error response

## Regex Pattern Explanation
The system uses: `/^([A-Za-z0-9-]+?)(\d+)$/`
- `^` = Start of string
- `([A-Za-z0-9-]+?)` = Prefix: letters, numbers, or hyphens (captured as group 1)
- `(\d+)$` = One or more digits at the end (captured as group 2)

**Valid formats:**
- INV001 (prefix: "INV", number: "001")
- SALE-500 (prefix: "SALE-", number: "500")
- TEST999 (prefix: "TEST", number: "999")
- CUSTOM-2024-100 (prefix: "CUSTOM-2024-", number: "100")

**Invalid formats:**
- INV (no trailing digits)
- 001 (no prefix - must have at least 1 letter)
- TEST-ABC (ends with letters, not digits)

## Padding Behavior
The system preserves the number of digits from your original number:
- INV001 → INV002 (3-digit padding preserved)
- SALE1 → SALE2 (1-digit padding)
- TEST00001 → TEST00002 (5-digit padding)

## Database Check (For Admins)
To verify data is actually being saved:
1. Open Supabase dashboard
2. Go to `product_orders` table
3. Find your test orders
4. Check `order_number` field matches what you entered
5. Check `created_at` is in descending order (latest first)

## Expected Console Output Flow

### Success Path:
```
[LoadNextInvoice] User franchise_id: uuid-123
[InvoiceSequences] Found last order: INV0001
[InvoiceSequences] Extracted: prefix="INV", lastNum=1, next="INV0002"
[LoadNextInvoice] API returned: INV0002

[CreateOrder] Creating order with invoice_number: INV0002
[CreateOrder] Order number "INV0002" is unique, using it
[Hybrid Invoice] Saved invoice number: INV0002
```

### Failure Path (If regex doesn't match):
```
[InvoiceSequences] Found last order: INVALID_NUMBER
[InvoiceSequences] Regex failed to parse: INVALID_NUMBER
[LoadNextInvoice] API returned: ORD001
```

## What Changed (Hybrid System)
- ❌ Removed: Type-based sequence separation (SALES/RENT tracking)
- ❌ Removed: Sequence table storage
- ❌ Removed: Type parameter from API calls
- ✅ Added: Pure database reading (reads product_orders directly)
- ✅ Added: Flexible prefix support (any text + digits)
- ✅ Added: Automatic increment from last created invoice
