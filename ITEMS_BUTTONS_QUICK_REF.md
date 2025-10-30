# Quick Reference Guide - Two Button States

## At a Glance

```
┌─────────────────────────────────────────────────────────────────┐
│                         TWO STATES                              │
├─────────────────────────────┬─────────────────────────────────────┤
│      📋 ITEMS BADGE         │  ⏳ SELECTION PENDING BADGE         │
├─────────────────────────────┼─────────────────────────────────────┤
│ Meaning:                    │ Meaning:                             │
│ Items already selected      │ Items need to be selected            │
│                             │                                      │
│ Example: "📋 2 Items"       │ Example: "⏳ Selection Pending"      │
│                             │                                      │
│ User sees:                  │ User sees:                           │
│ • Badge with count          │ • Badge with warning icon           │
│ • Edit button               │ • (No edit button)                  │
│                             │                                      │
│ Click badge:                │ Click badge:                        │
│ → ItemsDisplayDialog        │ → PendingSelectionDialog            │
│ → Shows current items       │ → Shows message + CTA               │
│                             │                                      │
│ Click Edit:                 │ Click "Select Products":            │
│ → ItemsSelectionDialog      │ → ItemsSelectionDialog              │
│ → EDIT MODE (pre-filled)    │ → SELECT MODE (empty)               │
│ → Modify & save             │ → Choose products & save            │
│                             │                                      │
│ Result after save:          │ Result after save:                   │
│ ✓ Updated item count        │ ✓ Badge changes to "📋 1 Items"    │
│ ✓ Inventory adjusted        │ ✓ Inventory reserved                │
│ ✓ Stays on table            │ ✓ Back to table                     │
└─────────────────────────────┴─────────────────────────────────────┘
```

---

## Flow Decision Tree

```
START: Looking at Products column
│
├─ Badge says "📋 2 Items"?
│  │
│  ├─ Click the badge?
│  │  └─→ See item details (ItemsDisplayDialog)
│  │     ├─ Just view? → Close
│  │     └─ Click "Edit Products"? → Edit mode (ItemsSelectionDialog)
│  │        ├─ Modify items
│  │        └─ Save → Back to table
│  │
│  └─ Click "✎ Edit"?
│     └─→ Edit mode directly (ItemsSelectionDialog)
│        ├─ Modify items
│        └─ Save → Back to table
│
│
└─ Badge says "⏳ Selection Pending"?
   │
   ├─ Click the badge?
   │  └─→ See message (PendingSelectionDialog)
   │     └─ Click "Select Products"? → Select mode (ItemsSelectionDialog)
   │        ├─ Choose products
   │        └─ Save → Badge updates to "📋 1 Items"
   │
   └─ Click "Select Products" row action?
      └─→ Select mode directly (ItemsSelectionDialog)
         ├─ Choose products
         └─ Save → Badge updates to "📋 X Items"

END: Badge updated
```

---

## Component Mapping

| Button/Badge | First Dialog | Second Dialog | Mode | Action |
|---|---|---|---|---|
| **📋 Items** badge | ItemsDisplayDialog | ItemsSelectionDialog | VIEW/EDIT | See items or edit |
| **✎ Edit** button | (skip) | ItemsSelectionDialog | EDIT | Edit items |
| **⏳ Pending** badge | PendingSelectionDialog | ItemsSelectionDialog | INFO/SELECT | See message or select |
| **Select Products** action | (skip) | ItemsSelectionDialog | SELECT | Select items |

---

## Code Entry Points

### From Items Badge (Already Selected)
```typescript
// User clicks "📋 2 Items"
onClick={() => {
  setProductDialogBooking(booking)
  setProductDialogType('items')
  setShowProductDialog(true)  // ← ItemsDisplayDialog opens
}}
```

### From Selection Pending Badge (Not Selected)
```typescript
// User clicks "⏳ Selection Pending"
onClick={() => {
  setProductDialogBooking(booking)
  setProductDialogType('pending')
  setShowProductDialog(true)  // ← PendingSelectionDialog opens
}}
```

### From Edit Products (In ItemsDisplayDialog)
```typescript
// User clicks "Edit Products" button in ItemsDisplayDialog
onEditProducts={() => {
  setShowProductDialog(false)  // Close display dialog
  setCurrentBookingForItems(booking)
  setShowItemsSelection(true)  // ← ItemsSelectionDialog opens (EDIT)
}}
```

### From Select Products (In PendingSelectionDialog)
```typescript
// User clicks "Select Products" button in PendingSelectionDialog
onClick={() => {
  setShowProductDialog(false)  // Close pending dialog
  setCurrentBookingForItems(booking)
  setShowItemsSelection(true)  // ← ItemsSelectionDialog opens (SELECT)
}}
```

---

## Key Differences Table

| Aspect | 📋 Items | ⏳ Pending |
|--------|---------|----------|
| **DB State** | Has items | No items (0) |
| **First View** | ItemsDisplayDialog | PendingSelectionDialog |
| **User Intent** | View/Edit | Create |
| **Selection Mode** | EDIT (pre-filled) | SELECT (empty) |
| **Badge Color** | Outline/Secondary | Default/Primary |
| **Icon** | 📋 (document) | ⏳ (timer) |
| **CTA** | "Edit Products" | "Select Products" |
| **Inventory Op** | Release + Reserve | Reserve only |

---

## Save Flow (Both Use Same Function)

```typescript
const saveSelectedItems = async (
  bookingId: string, 
  items: SelectedItem[], 
  source: 'product_orders' | 'package_bookings'
) => {
  // 1. POST /api/bookings/[id]/items (save to DB)
  // 2. POST /api/inventory/reserve (adjust stock)
  // 3. Show toast notification
  // 4. Close dialogs
  // 5. Refetch items (update UI)
  // 6. Badge updates: "⏳ Pending" → "📋 X Items"
}
```
