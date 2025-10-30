# Implementation Checklist - Items & Selection Flow

## Current Implementation Status

### ✅ Already Implemented

#### 1. Display Layer - Bookings Table
- [x] Show "📋 Items" badge when items exist
- [x] Show "⏳ Selection Pending" badge when no items
- [x] Make badges clickable
- [x] Show count of items in Items badge
- [x] Add "✎ Edit" button next to Items badge

#### 2. ItemsDisplayDialog Component
- [x] Accept items list from parent
- [x] Display item details (product name, quantity, price)
- [x] Show pricing breakdown
- [x] Add "Edit Products" button
- [x] Make "Edit Products" button trigger selection modal in EDIT mode
- [x] Implement close/cancel functionality

#### 3. ItemsSelectionDialog Component
- [x] Support both SELECT and EDIT modes
- [x] Pre-populate with existing items in EDIT mode
- [x] Show empty state in SELECT mode
- [x] Product browser/search
- [x] Variant selection
- [x] Quantity controls
- [x] Price calculation
- [x] "Save Changes" button
- [x] "Cancel" button

#### 4. Inventory Management API
- [x] Create `/api/inventory/reserve` endpoint
- [x] Support reserve operation
- [x] Support release operation
- [x] Support confirm operation
- [x] Support return operation
- [x] Validate stock availability

#### 5. Items Save API
- [x] GET `/api/bookings/[id]/items` - Fetch items
- [x] POST `/api/bookings/[id]/items` - Save items
- [x] Handle product_order and package_booking sources

#### 6. State Management
- [x] `showItemsSelection` state
- [x] `currentBookingForItems` state
- [x] `showProductDialog` state
- [x] `productDialogType` state
- [x] `productDialogBooking` state

---

## Missing/Todo Items

### 🔄 Enhancement Opportunities

#### 1. PendingSelectionDialog Component
- [ ] Create dedicated dialog for "Selection Pending" state
- [ ] Show informational message
- [ ] Add "Select Products" button
- [ ] Add "Skip for now" option (optional)
- [ ] Show booking details (customer, event date)
- [ ] Show deadline warning if approaching event date

#### 2. Selection Pending Badge Enhancements
- [ ] Add icon/visual indicator (⏳ or 🚨)
- [ ] Optional: Pulsing animation to draw attention
- [ ] Show in different color than Items badge
- [ ] Add tooltip: "Click to select products for this booking"

#### 3. Items Display Enhancements
- [ ] Show variant name if applicable
- [ ] Show add-ons (distance, security deposit)
- [ ] Add quick edit for quantity inline
- [ ] Show last modified timestamp
- [ ] Show who last edited

#### 4. Selection Modal Enhancements
- [ ] Search/filter by product type
- [ ] Filter by category
- [ ] Show stock availability in product list
- [ ] Quick add buttons for common packages
- [ ] Show saved templates/recent selections
- [ ] Bulk action buttons

#### 5. Validation & Error Handling
- [ ] Validate stock before save
- [ ] Show warning if stock insufficient
- [ ] Show confirmation if removing all items
- [ ] Handle network errors gracefully
- [ ] Show retry option on failure
- [ ] Toast notifications for all operations

#### 6. Inventory Notifications
- [ ] Show reserved inventory count
- [ ] Show available count vs reserved
- [ ] Warn if approaching low stock
- [ ] Alert if item out of stock but selected

#### 7. Audit & History
- [ ] Track who selected items
- [ ] Track when items were selected
- [ ] Show selection history modal
- [ ] Allow rollback to previous selection (optional)

#### 8. Bulk Operations
- [ ] Select multiple bookings
- [ ] Bulk assign same items to multiple bookings
- [ ] Bulk edit quantities
- [ ] Bulk copy selection from one booking to others

#### 9. Mobile Responsiveness
- [ ] Ensure dialogs work on mobile
- [ ] Optimize touch targets for selection
- [ ] Make quantity controls thumb-friendly
- [ ] Responsive product grid

#### 10. Performance
- [ ] Lazy load product images
- [ ] Debounce search input
- [ ] Virtualize product list if 1000+ items
- [ ] Cache recent selections
- [ ] Pagination for large item lists

---

## Testing Checklist

### Unit Tests

#### ItemsDisplayDialog
- [ ] Render with sample items
- [ ] Edit button triggers callback
- [ ] Close button works
- [ ] Displays correct pricing breakdown
- [ ] Handles empty items array

#### ItemsSelectionDialog
- [ ] SELECT mode shows empty state
- [ ] EDIT mode pre-populates data
- [ ] Save button calls API
- [ ] Cancel button closes dialog
- [ ] Quantity controls increment/decrement
- [ ] Product selection works

#### Inventory API
- [ ] Reserve operation reduces available stock
- [ ] Release operation restores stock
- [ ] Prevent over-reservation
- [ ] Validate inputs
- [ ] Return proper error messages

#### Items API
- [ ] GET returns correct items
- [ ] POST saves items to DB
- [ ] POST handles product_order source
- [ ] POST handles package_booking source
- [ ] Delete old items before insert
- [ ] Validate required fields

### Integration Tests

- [ ] Complete Items flow (View → Edit → Save)
- [ ] Complete Selection Pending flow (Empty → Select → Save)
- [ ] Switching between tabs/dialogs
- [ ] Multiple concurrent saves
- [ ] Inventory sync after save
- [ ] Badge updates reflect saved changes
- [ ] State persistence across page refresh

### E2E Tests

- [ ] User selects items on confirmed booking
- [ ] Items display correctly in table
- [ ] Can edit items multiple times
- [ ] Inventory reflects all reservations
- [ ] Can cancel mid-workflow
- [ ] Error states handled gracefully

---

## Database Queries Needed

### Check Inventory Status
```sql
SELECT 
  id, 
  name, 
  stock_available, 
  qty_reserved, 
  qty_in_use 
FROM products 
WHERE stock_available > 0 
ORDER BY name;
```

### Check Items for Booking
```sql
SELECT 
  pbi.*, 
  ps.name as package_name,
  pv.name as variant_name
FROM package_booking_items pbi
LEFT JOIN package_sets ps ON pbi.package_id = ps.id
LEFT JOIN package_variants pv ON pbi.variant_id = pv.id
WHERE pbi.booking_id = $1
ORDER BY pbi.created_at;
```

### Check Pending Selections (Confirmed, 0 items)
```sql
SELECT 
  pb.id,
  pb.booking_ref,
  pb.customer_name,
  pb.event_date,
  COUNT(pbi.id) as item_count
FROM package_bookings pb
LEFT JOIN package_booking_items pbi ON pb.id = pbi.booking_id
WHERE pb.status = 'confirmed' 
  AND pb.franchise_id = $1
GROUP BY pb.id
HAVING COUNT(pbi.id) = 0
ORDER BY pb.event_date ASC;
```

---

## Documentation Files

- [x] ITEMS_AND_SELECTION_FLOW.md - Complete flow documentation
- [x] ITEMS_AND_SELECTION_VISUAL.md - Visual diagrams and UI states
- [x] This file - Implementation checklist

---

## Key Files to Reference

### Core Components
- `/components/shared/dialogs/items-display-dialog.tsx` - View items
- `/components/shared/dialogs/items-selection-dialog.tsx` - Select/edit items
- `/app/bookings/page.tsx` - Main bookings page logic

### API Routes
- `/app/api/bookings/[id]/items/route.ts` - Fetch/save items
- `/app/api/inventory/reserve/route.ts` - Manage inventory

### Utilities
- `/lib/utils.ts` - Format currency, etc.

---

## Critical Implementation Notes

### 1. Column Availability Check
```typescript
// Only insert columns that exist in table:

// ✅ product_order_items: 
// order_id, product_id, quantity, unit_price, total_price

// ✅ package_booking_items:
// booking_id, package_id, variant_id, quantity, extra_safas, 
// unit_price, total_price, distance_addon, security_deposit
```

### 2. Inventory Operation Sequences

**When Selecting NEW Items (Selection Pending → Items):**
```
1. Save items to DB
2. POST /api/inventory/reserve with type: 'reserve'
3. Reduce stock_available, increase qty_reserved
```

**When EDITING Items (More items):**
```
1. Get old selection
2. Calculate difference
3. If more: reserve additional stock
4. If less: release freed stock
5. Save updated items to DB
```

### 3. State Synchronization
- Always refetch items after save
- Update badge count in real-time
- Close dialogs in correct order
- Clear selection state after successful save

### 4. Error Scenarios to Handle
- Insufficient stock
- Database connection errors
- API timeout
- Concurrent edits (optimistic locking)
- Invalid product IDs
- Missing required fields

---

## Deployment Checklist

- [ ] All tests passing
- [ ] API endpoints working
- [ ] Inventory calculations correct
- [ ] Database migrations complete
- [ ] Environment variables set
- [ ] Error logging configured
- [ ] Performance benchmarks met
- [ ] Security review passed
- [ ] User acceptance testing done
- [ ] Documentation updated

---

## Success Criteria

### Functional
- [x] Users can view selected items
- [x] Users can edit existing items
- [x] Users can create new selections
- [x] Inventory updates correctly
- [ ] UI responds within 1 second
- [ ] No data loss on save

### User Experience
- [ ] Clear visual distinction between states
- [ ] Intuitive navigation between dialogs
- [ ] Helpful error messages
- [ ] Smooth transitions
- [ ] Mobile-friendly
- [ ] Accessibility compliant (WCAG)

### System
- [ ] API response < 500ms
- [ ] Database queries optimized
- [ ] No memory leaks
- [ ] Error logging comprehensive
- [ ] Backup/recovery procedures
- [ ] Audit trail maintained
