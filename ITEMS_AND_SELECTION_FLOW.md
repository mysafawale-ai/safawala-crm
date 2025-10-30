# Items Display & Selection Flow Documentation

## Overview
The booking system has two distinct states for product/item management:

1. **"📋 Items" Badge** - Items already selected
2. **"⏳ Selection Pending" Badge** - Items need to be selected

---

## Flow 1: "📋 Items" Badge (Items Already Selected)

### When Does It Show?
- When a booking already has items/products selected and saved
- Shows count of items: `📋 2 Items`, `📋 1 Items`, etc.

### User Journey:

```
User sees "📋 Items" badge in Products column
         ↓
Click on badge OR click "✎ Edit" button
         ↓
ItemsDisplayDialog opens
         ↓
Display all selected items with:
  • Product image & name
  • Quantity
  • Unit price
  • Total price
  • Subtotal breakdown
         ↓
Two options:
  A) Just view (close dialog)
  B) Click "Edit Products" button
         ↓
ItemsSelectionDialog opens in EDIT mode
         ↓
Shows pre-populated selections from DB
         ↓
User can:
  • Add more items
  • Remove existing items
  • Modify quantities
         ↓
Click "Save Changes"
         ↓
API saves to database
Inventory adjusted (reserve/release)
Dialog closes
Items display updates
```

### Code Flow:
```typescript
// User clicks "📋 Items" badge
onClick={() => {
  setProductDialogBooking(booking)
  setProductDialogType('items')
  setShowProductDialog(true)  // Opens ItemsDisplayDialog
}}

// In ItemsDisplayDialog, user clicks "Edit Products"
onEditProducts={() => {
  setShowProductDialog(false)  // Close display dialog
  setCurrentBookingForItems(booking)
  setShowItemsSelection(true)  // Open selection modal in EDIT mode
}}

// Save handler in ItemsSelectionDialog
await saveSelectedItems(bookingId, selectedItems, source)
```

### Database Impact:
- ✅ GET `/api/bookings/[id]/items?source=package_booking` - Fetch existing items
- ✅ POST `/api/bookings/[id]/items` - Save modified items
- ✅ POST `/api/inventory/reserve` - Adjust inventory (reserve/release)

---

## Flow 2: "⏳ Selection Pending" Badge (Selection Not Done)

### When Does It Show?
- When a booking is confirmed but no products/items have been selected yet
- Status typically: "Confirmed" but with 0 items
- Bookings awaiting staff to select products

### User Journey:

```
User sees "⏳ Selection Pending" badge in Products column
         ↓
Click on badge (or dedicated "Select Products" button)
         ↓
Dialog opens: "Product Selection Pending"
         ↓
Prompt message: "Please select items for this booking"
         ↓
"Select Products" CTA button
         ↓
ItemsSelectionDialog opens in SELECT mode (fresh/new)
         ↓
Empty selection state - user picks:
  • Package/Product
  • Variant (if applicable)
  • Quantity
  • Any customizations
         ↓
Click "Save Changes"
         ↓
API saves to database
Inventory reserved for items
Status may update to reflect selection complete
Dialog closes
Badge updates to "📋 Items"
```

### Code Flow:
```typescript
// User clicks "⏳ Selection Pending" badge
onClick={() => {
  setProductDialogBooking(booking)
  setProductDialogType('pending')
  setShowProductDialog(true)  // Opens pending dialog
}}

// In PendingSelectionDialog, click "Select Products"
onClick={() => {
  setShowProductDialog(false)  // Close pending dialog
  setCurrentBookingForItems(booking)
  setShowItemsSelection(true)  // Open selection modal in SELECT mode
}}

// Save handler in ItemsSelectionDialog
await saveSelectedItems(bookingId, selectedItems, source)
```

### Database Impact:
- ✅ GET `/api/bookings/[id]/items?source=...` - Check if items exist (returns empty)
- ✅ POST `/api/bookings/[id]/items` - Save newly selected items
- ✅ POST `/api/inventory/reserve` - Reserve inventory for new items

---

## Key Differences: Items vs Selection Pending

| Aspect | 📋 Items | ⏳ Selection Pending |
|--------|---------|-------------------|
| **Current State** | Items already saved | No items yet |
| **Dialog Type** | ItemsDisplayDialog | PendingSelectionDialog |
| **Modal Mode** | EDIT mode | SELECT mode |
| **Pre-populated** | Yes (from DB) | No (empty) |
| **Primary Action** | View/Edit existing | Create new selection |
| **Badge Style** | `variant="outline"` outline | `variant="default"` filled |
| **Icon** | 📋 | ⏳ |
| **Next State** | Stays as Items or Updates | Becomes Items after save |

---

## Interaction Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   BOOKINGS TABLE                            │
└─────────────────────────────────────────────────────────────┘
           ↓                          ↓
    ┌──────────────┐         ┌──────────────────┐
    │ 📋 Items (2) │         │ ⏳ Selection     │
    │   Badge      │         │   Pending Badge  │
    └──────────────┘         └──────────────────┘
           ↓                          ↓
    [Click/View]               [Click to Select]
           ↓                          ↓
    ┌────────────────────┐   ┌─────────────────────────┐
    │ItemsDisplayDialog  │   │PendingSelectionDialog   │
    │ - Show items       │   │ - Message              │
    │ - Prices          │   │ - "Select Products" CTA │
    │ - Edit button     │   │ - "Select Products" btn │
    └────────────────────┘   └─────────────────────────┘
            ↓                        ↓
    [Click Edit Products]   [Click Select Products]
            ↓                        ↓
    ┌─────────────────────────────────────────┐
    │ ItemsSelectionDialog (Modal)            │
    │ ─────────────────────────────────────── │
    │ Mode: EDIT or SELECT                    │
    │ • Pre-populated (EDIT) or Empty (SELECT)│
    │ • Pick packages/products                │
    │ • Choose variants                       │
    │ • Set quantities                        │
    │ • Review pricing                        │
    │                                         │
    │ [Cancel]  [Save Changes]                │
    └─────────────────────────────────────────┘
            ↓
    [Save to DB]
    Inventory Adjusted
    Dialog Close
            ↓
    Back to Table
    Badge updates
```

---

## Component Responsibilities

### ItemsDisplayDialog
- **Role**: View existing selected items
- **Shows**: Product details, pricing, quantities
- **Actions**: 
  - Close (just view)
  - Edit Products (opens selection modal in EDIT mode)

### PendingSelectionDialog  
- **Role**: Notify user of pending selection
- **Shows**: Message + CTA button
- **Actions**:
  - Select Products (opens selection modal in SELECT mode)

### ItemsSelectionDialog
- **Role**: Core selection and editing interface
- **Modes**:
  - SELECT: Create new selection (empty start)
  - EDIT: Modify existing selection (pre-populated)
- **Shows**: Product browser, variants, quantities
- **Actions**:
  - Save Changes (persists to DB)
  - Cancel (close without saving)

### Inventory Manager
- **Role**: Handle stock adjustments
- **Operations**:
  - RESERVE: When items selected (reserve stock)
  - RELEASE: When items removed (free stock)
  - CONFIRM: When order fulfilled (use stock)
  - RETURN: When items returned (restore stock)

---

## State Variables (Bookings Page)

```typescript
const [showItemsSelection, setShowItemsSelection] = useState(false)    // Toggle selection modal
const [currentBookingForItems, setCurrentBookingForItems] = useState() // Current booking context
const [showProductDialog, setShowProductDialog] = useState(false)      // Display/Pending dialog
const [productDialogType, setProductDialogType] = useState('items')   // 'items' or 'pending'
const [productDialogBooking, setProductDialogBooking] = useState()    // Booking for dialog
```

---

## Summary

### "📋 Items" Flow
1. Badge shows items exist
2. Click to open ItemsDisplayDialog (view-only)
3. Click "Edit Products" to edit selection
4. Modify and save
5. Badge updates with new count

### "⏳ Selection Pending" Flow
1. Badge shows selection needed
2. Click to open PendingSelectionDialog (info)
3. Click "Select Products" to begin
4. Add items to empty selection
5. Save and badge changes to "📋 Items"

Both flows converge on **ItemsSelectionDialog** which handles the actual product selection, and both call **saveSelectedItems()** which persists to database and manages inventory.
