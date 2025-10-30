# Visual Flow Diagram - Items & Selection Pending

## User Interface States

### State 1: Package with Items Already Selected
```
┌──────────────────────────────────────────────────────────┐
│ Products Column                                          │
├──────────────────────────────────────────────────────────┤
│ ┌────────────────────┐                                   │
│ │ 📋 2 Items         │  ← Items badge (clickable)        │
│ └────────────────────┘                                   │
│ ✎ Edit              ← Edit button (clickable)           │
│                                                          │
│ Click either for:                                        │
│ • View item details (ItemsDisplayDialog)               │
│ • Edit products (ItemsSelectionDialog in EDIT mode)    │
└──────────────────────────────────────────────────────────┘
```

### State 2: Package Awaiting Selection (Confirmed but No Items)
```
┌──────────────────────────────────────────────────────────┐
│ Products Column                                          │
├──────────────────────────────────────────────────────────┤
│ ┌──────────────────────────┐                             │
│ │ ⏳ Selection Pending     │  ← Pending badge            │
│ └──────────────────────────┘                             │
│                                                          │
│ Click for:                                               │
│ • Show pending dialog                                    │
│ • Prompt user to select products                        │
│ • Transition to selection modal                         │
└──────────────────────────────────────────────────────────┘
```

---

## Dialog States

### ItemsDisplayDialog (View Mode)
```
╔════════════════════════════════════════╗
║  Selected Items - PKG-1761716270469    ║
╠════════════════════════════════════════╣
║                                        ║
║  [Product Image] Package Name (71)     ║
║  ────────────────────────────────────  ║
║  Quantity: 2 × Safas                   ║
║  Unit Price: ₹16,200                   ║
║  Subtotal: ₹32,400                     ║
║  Distance Add-on: ₹1,300               ║
║  Security Deposit: ₹700                ║
║  Total: ₹34,420                        ║
║                                        ║
║  ┌─────────────────────────────────┐  ║
║  │ [Edit]  Edit Products  [Blue]   │  ║
║  └─────────────────────────────────┘  ║
║                                        ║
║              [Close]                   ║
╚════════════════════════════════════════╝
```

### PendingSelectionDialog
```
╔════════════════════════════════════════╗
║  ⏳ Selection Pending                  ║
╠════════════════════════════════════════╣
║                                        ║
║  This booking is confirmed but         ║
║  products haven't been selected yet.   ║
║                                        ║
║  Please select items for this booking. ║
║                                        ║
║  ┌─────────────────────────────────┐  ║
║  │ Select Products                 │  ║
║  └─────────────────────────────────┘  ║
║                                        ║
║              [Close]                   ║
╚════════════════════════════════════════╝
```

### ItemsSelectionDialog (SELECT Mode - New Selection)
```
╔════════════════════════════════════════╗
║  Select Products                       ║
╠════════════════════════════════════════╣
║                                        ║
║  Search: [________________]            ║
║                                        ║
║  Available Products:                   ║
║  ┌─────────────────────────────────┐  ║
║  │ ☐ Amazing 200 Tent              │  ║
║  │ ☐ Amazing 200 Tent + Decor      │  ║
║  │ ☐ Premium Package (71 Safas)    │  ║
║  │ ☐ Deluxe Wedding (51 Safas)     │  ║
║  └─────────────────────────────────┘  ║
║                                        ║
║  Selected:                             ║
║  • Premium Package (1x) - Qty: 2      ║
║  • Additional Safas: 5                 ║
║                                        ║
║  Total: ₹34,420                        ║
║                                        ║
║   [Cancel]  [Save Changes]             ║
╚════════════════════════════════════════╝
```

### ItemsSelectionDialog (EDIT Mode - Modify Existing)
```
╔════════════════════════════════════════╗
║  Edit Products                         ║
╠════════════════════════════════════════╣
║                                        ║
║  Search: [________________]            ║
║                                        ║
║  Available Products:                   ║
║  ┌─────────────────────────────────┐  ║
║  │ ☐ Amazing 200 Tent              │  ║
║  │ ☑ Amazing 200 Tent + Decor ✓    │  ║
║  │ ☑ Premium Package (71 Safas) ✓  │  ║
║  │ ☐ Deluxe Wedding (51 Safas)     │  ║
║  └─────────────────────────────────┘  ║
║                                        ║
║  Currently Selected:                   ║
║  • Premium Package (1x) - Qty: 2      ║  (Can modify)
║    [Qty: -1] [2] [+1]                 │
║                                        ║
║  • Additional Safas: 5                 │
║    [Remove]                            │
║                                        ║
║  Total: ₹34,420                        ║
║                                        ║
║   [Cancel]  [Save Changes]             ║
╚════════════════════════════════════════╝
```

---

## Complete User Journey Map

```
START: View Bookings Table
│
├─ Booking has Items
│  │
│  ├─ Row shows: 📋 2 Items | ✎ Edit
│  │
│  ├─ User Action: Click "📋 2 Items"
│  │  └─→ ItemsDisplayDialog Opens
│  │     ├─ Shows: Item details, pricing
│  │     ├─ User Action: View only → Close
│  │     │  └─→ Back to Table
│  │     │
│  │     └─ User Action: Click "Edit Products"
│  │        └─→ ItemsSelectionDialog Opens (EDIT mode)
│  │           ├─ Pre-populated with current items
│  │           ├─ User can modify/add/remove
│  │           ├─ User Action: Save Changes
│  │           │  └─→ POST /api/bookings/[id]/items
│  │           │     └─→ Inventory adjusted
│  │           │        └─→ Dialog closes
│  │           │           └─→ Back to Table
│  │           │              └─→ Badge updates count
│  │           │
│  │           └─ User Action: Cancel
│  │              └─→ Back to ItemsDisplayDialog
│  │
│  └─ User Action: Click "✎ Edit"
│     └─→ Same as above (Opens ItemsSelectionDialog in EDIT)
│
│
└─ Booking has Selection Pending (Confirmed, 0 items)
   │
   ├─ Row shows: ⏳ Selection Pending
   │
   ├─ User Action: Click "⏳ Selection Pending"
   │  └─→ PendingSelectionDialog Opens
   │     ├─ Shows: Message + CTA
   │     │
   │     ├─ User Action: Click "Select Products"
   │     │  └─→ ItemsSelectionDialog Opens (SELECT mode)
   │     │     ├─ Empty/Fresh selection
   │     │     ├─ User picks products
   │     │     ├─ User Action: Save Changes
   │     │     │  └─→ POST /api/bookings/[id]/items
   │     │     │     └─→ Inventory reserved
   │     │     │        └─→ Dialog closes
   │     │     │           └─→ Back to Table
   │     │     │              └─→ Badge updates to "📋 X Items"
   │     │     │
   │     │     └─ User Action: Cancel
   │     │        └─→ Back to PendingSelectionDialog
   │     │
   │     └─ User Action: Close Dialog
   │        └─→ Back to Table (selection still pending)
   │
   └─ User Action: Click "Select Products" (row action)
      └─→ ItemsSelectionDialog Opens (SELECT mode)
         └─→ (Same flow as above)


END: Booking shows "📋 X Items" badge
```

---

## State Transition Matrix

```
Current State          │ Action              │ Dialog Opened        │ Mode   │ Next State
───────────────────────┼──────────────────── ┼──────────────────────┼────────┼────────────────────
Items Selected         │ Click Items Badge   │ ItemsDisplayDialog   │ VIEW   │ (view or edit)
Items Selected         │ Click Edit Button   │ ItemsSelectionDialog │ EDIT   │ (edit or cancel)
Items Selected         │ Edit → Save         │ (close)              │ EDIT   │ Items Updated
Items Selected         │ Edit → Cancel       │ ItemsDisplayDialog   │ VIEW   │ (unchanged)
───────────────────────┼──────────────────── ┼──────────────────────┼────────┼────────────────────
Selection Pending      │ Click Pending Badge │ PendingSelectionDlg  │ INFO   │ (select or close)
Selection Pending      │ Click Select Prod.  │ ItemsSelectionDialog │ SELECT │ (select or cancel)
Selection Pending      │ Select → Save       │ (close)              │ SELECT │ Items Added
Selection Pending      │ Select → Cancel     │ PendingSelectionDlg  │ INFO   │ (unchanged)
```

---

## API Call Sequence

### Scenario 1: View Items → Edit → Save
```
1. GET /api/bookings/[id]/items?source=package_booking
   ← Response: [{ id: 1, package_id: 2, quantity: 2, ... }]
   
2. ItemsDisplayDialog shows data
   
3. User clicks "Edit Products"
   └─→ ItemsSelectionDialog opens (pre-populated)
   
4. User modifies and clicks "Save"
   
5. POST /api/bookings/[id]/items
   ← Body: { items: [...modified], source: 'package_booking' }
   ← Response: { success: true, count: 1 }
   
6. POST /api/inventory/reserve
   ← Body: { operations: [{type: 'release', product_id: X, qty: 1}, ...] }
   ← Response: { success: true, adjusted: 2 }
   
7. Sync ItemsDisplayDialog or return to table
```

### Scenario 2: Selection Pending → Select → Save
```
1. GET /api/bookings/[id]/items?source=package_booking
   ← Response: { success: true, items: [], count: 0 }
   
2. ItemsSelectionDialog opens (empty, SELECT mode)
   
3. User selects products and clicks "Save"
   
4. POST /api/bookings/[id]/items
   ← Body: { items: [{package_id: 2, variant_id: 5, quantity: 2}], source: 'package_booking' }
   ← Response: { success: true, count: 1 }
   
5. POST /api/inventory/reserve
   ← Body: { operations: [{type: 'reserve', product_id: X, qty: 2}] }
   ← Response: { success: true, adjusted: 1 }
   
6. Update badge from "⏳ Selection Pending" → "📋 1 Items"
```

---

## Summary Table

| Feature | Items Flow | Selection Pending Flow |
|---------|-----------|----------------------|
| **Badge** | 📋 [count] Items | ⏳ Selection Pending |
| **Initial Action** | Click badge/Edit | Click badge/Select Prod |
| **First Dialog** | ItemsDisplayDialog | PendingSelectionDialog |
| **Second Dialog** | ItemsSelectionDialog | ItemsSelectionDialog |
| **Mode in Selection** | EDIT | SELECT |
| **Data Loaded** | From DB (pre-fill) | Empty (start fresh) |
| **Save Behavior** | Update existing | Create new |
| **Inventory Op** | Release + Reserve | Reserve |
| **Final Result** | Updated item count | New item count |
