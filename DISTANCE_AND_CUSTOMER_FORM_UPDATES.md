# Distance Calculation & Customer Form Updates

## Date: 2025-10-09

## Changes Made

### 1. ✅ Updated Base Pincode for Distance Calculation

**Change:** Changed base pincode from `400001` to `390001`

**File:** `/app/book-package/page.tsx`

**Before:**
```typescript
const basePincode = 400001  // Mumbai
```

**After:**
```typescript
const basePincode = 390001  // Your address
```

**Impact:**
- Distance calculations in package bookings now use 390001 as the base/reference pincode
- Distance formula: `Math.abs(customerPincode - 390001) / 1000` = estimated km
- Examples:
  - Customer pincode 390001 → 0 km (same location)
  - Customer pincode 400001 → 10 km
  - Customer pincode 380001 → 10 km
  - Customer pincode 500001 → 110 km

**Location:** This affects the distance display in:
- Package booking wizard (Step 3 - Review sidebar)
- Distance-based pricing calculations

---

### 2. ✅ Removed Notes Field from Add Customer Dialog

**File:** `/components/customers/customer-form-dialog.tsx`

**Changes:**
1. Removed `notes` from `CustomerFormData` interface
2. Removed `notes: ""` from initial state
3. Removed the entire Notes textarea section from the UI
4. Removed `notes` from form reset

**UI Changes:**
- Notes field no longer appears in the "Add New Customer" dialog
- Form is now cleaner with only essential fields
- No impact on existing customer records (notes column still exists in database)

**Fields Remaining:**
- Name *
- Phone *
- WhatsApp
- Email
- Address
- City
- State
- Pincode *

---

### 3. ✅ Removed Notes Field from Edit Customer Page

**File:** `/app/customers/[id]/edit/page.tsx`

**Changes:**
1. Removed `notes` from formData state
2. Removed notes field from data loading
3. Removed notes field from update query
4. Removed the entire Notes textarea section from the UI

**UI Changes:**
- Notes field no longer appears in the customer edit page
- Same essential fields as the add customer dialog
- Existing notes in database are preserved but not editable

---

## Files Modified

1. `/app/book-package/page.tsx` - Changed base pincode to 390001
2. `/components/customers/customer-form-dialog.tsx` - Removed notes field
3. `/app/customers/[id]/edit/page.tsx` - Removed notes field

---

## Database Notes

### Notes Column Still Exists
The `notes` column still exists in the `customers` table in the database. This means:
- ✅ Existing customer notes are preserved
- ✅ No data loss
- ✅ Can be re-enabled in future if needed
- ✅ Other parts of the system can still use notes if they access it directly

### To Completely Remove (Optional)
If you want to remove the notes column from the database entirely:

```sql
-- Remove notes column from customers table
ALTER TABLE customers DROP COLUMN IF EXISTS notes;
```

**Note:** Only do this if you're sure you won't need the notes field in the future.

---

## Testing Checklist

### Distance Calculation (390001 Base)
- [ ] Open `/book-package`
- [ ] Select a customer with pincode 390001
- [ ] Verify distance shows as 0 km
- [ ] Select a customer with pincode 400001
- [ ] Verify distance shows as ~10 km
- [ ] Create a booking and verify pricing is calculated correctly

### Add Customer (No Notes)
- [ ] Open package booking or product order page
- [ ] Click "Add New Customer"
- [ ] Verify Notes field is NOT present
- [ ] Fill required fields (Name, Phone, Pincode)
- [ ] Save customer successfully
- [ ] Verify customer appears in dropdown

### Edit Customer (No Notes)
- [ ] Go to `/customers`
- [ ] Click "Edit" on any customer
- [ ] Verify Notes field is NOT present
- [ ] Modify some fields (e.g., phone, address)
- [ ] Save changes
- [ ] Verify changes are saved correctly
- [ ] Verify existing notes in database (if any) are not deleted

---

## Rollback Instructions

### To Revert Base Pincode Back to 400001
```typescript
// In /app/book-package/page.tsx, change line ~303:
const basePincode = 400001  // Revert to Mumbai
```

### To Re-enable Notes Field

**In customer-form-dialog.tsx:**
```typescript
// Add to interface
interface CustomerFormData {
  // ... other fields
  notes: string
}

// Add to initial state
const [formData, setFormData] = useState<CustomerFormData>({
  // ... other fields
  notes: "",
})

// Add UI section before Action Buttons
<div className="space-y-2">
  <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
  <Textarea
    id="notes"
    value={formData.notes}
    onChange={(e) => handleInputChange("notes", e.target.value)}
    placeholder="Any additional notes"
    rows={2}
  />
</div>
```

**In edit page.tsx:**
Similar changes to add notes back to formData, loading, saving, and UI.

---

## Summary

✅ **Base Pincode Updated** - Distance now calculated from 390001 (your location)

✅ **Customer Forms Simplified** - Notes field removed from both add and edit

✅ **Data Preserved** - Existing notes in database remain intact

✅ **Clean UI** - Forms now show only essential customer information

---

## Benefits

- 🎯 **Accurate Distance** - Distance calculations now reflect your actual location (390001)
- 🧹 **Cleaner Forms** - Removed unnecessary notes field for faster data entry
- 💾 **Data Safety** - No data deleted, notes column still exists in database
- ⚡ **Faster Workflow** - Less fields to fill when adding/editing customers
