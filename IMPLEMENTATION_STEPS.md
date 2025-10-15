# 🚀 EDIT QUOTE IMPLEMENTATION - STEP BY STEP GUIDE

## ✅ Prerequisites Already Done
1. ✓ Imports added (Textarea, Label, Loader2, etc.)
2. ✓ State variables added (showEditDialog, editFormData, isSaving)
3. ✓ All dependencies already imported

## 📝 Step-by-Step Implementation

### STEP 1: Add Handler Functions (2 functions)

**Location:** After `handleDownloadPDF` function in `export default function QuotesPage()` section (around line 1489)

**What to add:** Copy and paste from `EDIT_QUOTE_FUNCTIONS.txt`

The two functions are:
- `handleEditQuote()` - Opens dialog with quote data
- `handleSaveQuote()` - Saves changes to database

### STEP 2: Update Edit Button

**Location:** Find the Edit button in the quotes table (around line 1893)

**Current code:**
```tsx
<Button
  size="sm"
  variant="ghost"
  onClick={() => {
    // Redirect to edit page based on booking_type
    const editPath = quote.booking_type === 'package' 
      ? `/book-package?edit=${quote.id}` 
      : `/create-product-order?edit=${quote.id}`
    router.push(editPath)
  }}
  title="Edit Quote"
>
  <Pencil className="h-3.5 w-3.5" />
</Button>
```

**Replace with:**
```tsx
<Button
  size="sm"
  variant="ghost"
  onClick={() => handleEditQuote(quote)}
  title="Edit Quote"
>
  <Pencil className="h-3.5 w-3.5" />
</Button>
```

### STEP 3: Add Edit Quote Dialog UI

**Location:** RIGHT BEFORE the line `</div></div>)` at the END of `export default function QuotesPage()` (around line 2176)

**What to add:** Copy and paste entire content from `EDIT_DIALOG_UI.txt`

This adds the full dialog with all form fields.

## 🎯 Quick Copy-Paste Locations

```
Line ~1489: Add handler functions from EDIT_QUOTE_FUNCTIONS.txt
Line ~1893: Update Edit button onClick
Line ~2176: Add dialog UI from EDIT_DIALOG_UI.txt
```

## 🧪 Testing After Implementation

1. Click Edit button on any quote
2. Dialog should open with current data
3. Change some fields
4. Click "Save Changes"
5. Should see success toast
6. Quote list should refresh
7. View the quote to verify changes

## 📊 What Gets Edited

The dialog allows editing:
- Event Type, Participant, Payment Type
- Event/Delivery/Return dates and times
- Venue Address
- Groom Name, WhatsApp, Address (if applicable)
- Bride Name, WhatsApp, Address (if applicable)
- Special Instructions/Notes

Updates either `product_orders` or `package_bookings` table automatically.

## 🐛 If You See Errors

1. **"handleEditQuote is not defined"**
   - You didn't add the handler functions (Step 1)

2. **"setEditFormData is not a function"**
   - State variables weren't added (already done in your file)

3. **"Dialog doesn't open"**
   - Check if `showEditDialog` state exists
   - Check if button onClick calls `handleEditQuote(quote)`

4. **"Can't save changes"**
   - Check browser console for errors
   - Verify Supabase connection
   - Check if `handleSaveQuote` function was added

## ✨ Features Included

✅ All 17 form fields from booking creation
✅ Conditional Groom/Bride sections
✅ Date/time pickers for better UX
✅ Loading state during save
✅ Success/error toasts
✅ Auto-refresh after save
✅ Cancel button to discard changes
✅ Multi-table support (product_orders & package_bookings)

---

## 🎉 That's It!

After these 3 steps, your Edit Quote feature will be fully functional and match the booking creation form exactly!

Need help? Check the generated files:
- `EDIT_QUOTE_FUNCTIONS.txt` - Handler functions
- `EDIT_DIALOG_UI.txt` - Dialog UI
- `EDIT_QUOTE_FEATURE_SUMMARY.md` - Complete overview
