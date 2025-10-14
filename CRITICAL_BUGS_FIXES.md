# 🔧 CRITICAL BUGS - IMMEDIATE FIXES

## Summary of Issues Found

After comprehensive QA testing with 5 CRUD operations, found **5 CRITICAL bugs** that must be fixed before production.

---

## 🔴 BUG #1: Hard-Coded Franchise ID

### Problem:
```typescript
// Line 362 in create-product-order/page.tsx
franchise_id: "00000000-0000-0000-0000-000000000001",  // ❌ HARD-CODED!
```

**Impact:** ALL bookings go to same franchise, breaking multi-franchise isolation

### Fix:
```typescript
// At top of component, fetch user session
const [currentUser, setCurrentUser] = useState<any>(null)

useEffect(() => {
  (async () => {
    try {
      const res = await fetch('/api/auth/user')
      if (res.ok) {
        const user = await res.json()
        setCurrentUser(user)
      }
    } catch (err) {
      toast.error('Failed to fetch user session')
    }
  })()
}, [])

// In handleSubmit, use dynamic franchise_id
franchise_id: currentUser?.franchise_id,  // ✅ DYNAMIC!

// Add validation before submit
if (!currentUser?.franchise_id) {
  toast.error("Session error: No franchise ID")
  return
}
```

### Files to Update:
- `/app/create-product-order/page.tsx` (Line 362)
- `/app/book-package/page.tsx` (Same issue likely exists)

---

## 🔴 BUG #2: amount_paid Always Set to 0

### Problem:
```typescript
// Line 395 in create-product-order/page.tsx
amount_paid: 0,  // ❌ WRONG! User selected "Advance Payment"
pending_amount: totals.grand,
```

**Impact:** 
- Invoice trigger will see `amount_paid = 0`
- Sets invoice status to "draft" even though user paid advance
- Financial reports incorrect

### Fix:
```typescript
// Calculate actual payment based on payment_type
let actualPayment = 0
if (formData.payment_type === "full") {
  actualPayment = totals.grand
} else if (formData.payment_type === "advance") {
  actualPayment = totals.grand * 0.5  // 50% advance
} else if (formData.payment_type === "partial") {
  actualPayment = Math.min(totals.grand, Math.max(0, formData.custom_amount))
}

// In INSERT statement:
amount_paid: actualPayment,              // ✅ Actual payment!
pending_amount: totals.grand - actualPayment,  // ✅ Correct balance!
```

### Alternative (Better):
Use the already-calculated `totals.payable`:
```typescript
amount_paid: totals.payable,           // Already correct from useMemo
pending_amount: totals.remaining,       // Already correct from useMemo
```

### Files to Update:
- `/app/create-product-order/page.tsx` (Line 395-396)
- `/app/book-package/page.tsx` (Same fix needed)

---

## 🔴 BUG #3: No Invoice Auto-Generation (Trigger Not Deployed)

### Problem:
User creates booking → No invoice generated → User confused

### Fix:
Deploy SQL files in order:

```bash
# Step 1: Verify schema (30 seconds)
# Run in Supabase SQL Editor
VERIFY_SCHEMA_FOR_INVOICES.sql

# Step 2: Deploy trigger (5 seconds)
AUTO_GENERATE_INVOICE_PRODUCTION.sql

# Step 3: Test (10 seconds)
TEST_AUTO_INVOICE_SYSTEM.sql
```

### Files Already Created:
- ✅ `VERIFY_SCHEMA_FOR_INVOICES.sql`
- ✅ `AUTO_GENERATE_INVOICE_PRODUCTION.sql`
- ✅ `TEST_AUTO_INVOICE_SYSTEM.sql`

**Status:** Ready to deploy, just needs user to run in Supabase

---

## 🔴 BUG #4: Edit Page Doesn't Exist

### Problem:
```typescript
// Line 175 in bookings/page.tsx
router.push(`/bookings/${bookingId}/edit${qs}`)
```

**Result:** 404 Not Found

### Fix Options:

#### Option A: Create Dedicated Edit Page (Recommended)
```bash
# Create new file
/app/bookings/[id]/edit/page.tsx
```

Features:
- Load existing booking data
- Pre-populate all fields
- Show "Update Booking" button
- Validate changes
- Update product_orders + items tables

#### Option B: Reuse Create Page with Edit Mode
```typescript
// Add mode prop to create page
// If ?edit=booking_id, load data and switch to edit mode

// In create-product-order/page.tsx
const searchParams = useSearchParams()
const editId = searchParams.get('edit')
const isEditMode = !!editId

// Load data if edit mode
useEffect(() => {
  if (isEditMode && editId) {
    loadBookingData(editId)
  }
}, [isEditMode, editId])

// Change button text
<Button onClick={() => handleSubmit(false)}>
  {isEditMode ? "Update Booking" : "Create Booking"}
</Button>
```

### Recommendation:
Create proper edit pages for better separation of concerns.

---

## 🔴 BUG #5: No Inventory Validation

### Problem:
User can book 1000 safas even if only 200 available

### Fix:
Add validation before adding items:

```typescript
// In handleAddItem function
const handleAddItem = async (product: Product, quantity: number) => {
  // ✅ Check stock availability
  if (quantity > product.stock_available) {
    toast.error(
      `Insufficient stock! Only ${product.stock_available} available`,
      { duration: 5000 }
    )
    return
  }

  // ✅ Check if already in cart
  const existingItem = items.find(i => i.product_id === product.id)
  if (existingItem) {
    const totalQuantity = existingItem.quantity + quantity
    if (totalQuantity > product.stock_available) {
      toast.error(
        `Cannot add ${quantity} more. Cart has ${existingItem.quantity}, stock has ${product.stock_available}`,
        { duration: 5000 }
      )
      return
    }
  }

  // ✅ Add item
  // ... existing code
}
```

### Enhanced Version (Check Real-Time Availability):
```typescript
// Query bookings with same date range
const { data: conflicts } = await supabase
  .from('product_order_items')
  .select('quantity, order:product_orders!inner(event_date, delivery_date, return_date)')
  .eq('product_id', product.id)
  .filter('order.event_date', 'lte', formData.return_date)
  .filter('order.return_date', 'gte', formData.event_date)

const bookedQuantity = conflicts?.reduce((sum, item) => sum + item.quantity, 0) || 0
const availableForDate = product.stock_available - bookedQuantity

if (quantity > availableForDate) {
  toast.error(
    `Only ${availableForDate} available for this date (${bookedQuantity} already booked)`,
    { duration: 6000 }
  )
  return
}
```

### Files to Update:
- `/app/create-product-order/page.tsx` (Add to item addition logic)
- `/app/book-package/page.tsx` (Same validation)

---

## 🟠 HIGH PRIORITY: Status Transition Validation

### Problem:
User can change "Delivered" → "Pending Payment" (invalid!)

### Fix:
```typescript
// Define valid state machine
const VALID_TRANSITIONS: Record<string, string[]> = {
  'pending_payment': ['confirmed', 'cancelled'],
  'pending_selection': ['confirmed', 'cancelled'],
  'confirmed': ['delivered', 'cancelled'],
  'delivered': ['returned', 'order_complete', 'cancelled'],
  'returned': ['order_complete'],
  'order_complete': [],  // Final state
  'cancelled': []         // Final state
}

// In handleStatusUpdate
const handleStatusUpdate = async (bookingId: string, newStatus: string, source?: string) => {
  const booking = bookings.find(b => b.id === bookingId)
  if (!booking) return

  const currentStatus = booking.status
  
  // ✅ Validate transition
  const allowedTransitions = VALID_TRANSITIONS[currentStatus] || []
  if (!allowedTransitions.includes(newStatus)) {
    toast.error(
      `Cannot change from "${currentStatus}" to "${newStatus}"`,
      { description: `Allowed transitions: ${allowedTransitions.join(', ') || 'None'}` }
    )
    return
  }

  // ... rest of update logic
}
```

### Files to Update:
- `/app/bookings/page.tsx` (Line 200-230)

---

## 🟠 HIGH PRIORITY: Add Soft Delete with Undo

### Problem:
Accidental deletes are permanent

### Fix:
```typescript
// Option 1: Toast with Undo Button (Simplest)
const handleDeleteBooking = async (bookingId: string, source?: string) => {
  showConfirmation({
    title: "Delete booking?",
    description: "This will move the booking to trash. You can restore it within 30 days.",
    confirmText: "Move to Trash",
    variant: "destructive",
    onConfirm: async () => {
      // Soft delete
      const url = `/api/bookings/${bookingId}${source ? `?type=${source}` : ''}`
      const res = await fetch(url, {
        method: 'PATCH',
        body: JSON.stringify({ is_deleted: true, deleted_at: new Date() })
      })
      
      if (!res.ok) throw new Error('Failed to delete')
      
      // Remove from UI
      const deletedBooking = bookings.find(b => b.id === bookingId)
      refresh()
      
      // Show undo toast
      toast.success("Booking moved to trash", {
        duration: 10000,  // 10 second window
        action: {
          label: "Undo",
          onClick: async () => {
            await fetch(url, {
              method: 'PATCH',
              body: JSON.stringify({ is_deleted: false, deleted_at: null })
            })
            refresh()
            toast.success("Booking restored!")
          }
        }
      })
    }
  })
}
```

### Database Changes Needed:
```sql
-- Add soft delete columns
ALTER TABLE product_orders ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE product_orders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE package_bookings ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE package_bookings ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Update queries to exclude soft-deleted
-- In GET /api/bookings:
.eq("is_deleted", false)
```

### Files to Update:
- `/app/bookings/page.tsx` (Delete function)
- `/app/api/bookings/route.ts` (Add is_deleted filter)
- Database (Add columns via SQL)

---

## 🟡 MEDIUM: Fix Audit Log Missing "before" State

### Problem:
```typescript
changes: { after: { status: newStatus } }  // ❌ Can't see what changed FROM
```

### Fix:
```typescript
const handleStatusUpdate = async (bookingId: string, newStatus: string, source?: string) => {
  try {
    // ✅ Get current booking first
    const currentBooking = bookings.find(b => b.id === bookingId)
    if (!currentBooking) return

    const oldStatus = currentBooking.status

    // Update status
    const url = `/api/bookings/${bookingId}${source ? `?type=${source}` : ''}`
    const response = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })

    if (!response.ok) throw new Error("Failed to update")

    toast.success("Booking status updated")

    // ✅ Audit log with before AND after
    try {
      fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_type: 'booking',
          entity_id: bookingId,
          action: 'update',
          changes: {
            before: { status: oldStatus },      // ✅ Now we know what it was
            after: { status: newStatus }
          }
        })
      })
    } catch {}

    refresh()
  } catch (error) {
    toast.error("Failed to update status", { variant: "destructive" })
  }
}
```

### Files to Update:
- `/app/bookings/page.tsx` (Line 215)

---

## 📋 IMPLEMENTATION CHECKLIST

### Before Deploying to Production:

- [ ] **BUG #1** - Fix hard-coded franchise_id (create-product-order + book-package)
- [ ] **BUG #2** - Fix amount_paid calculation (create-product-order + book-package)
- [ ] **BUG #3** - Deploy invoice auto-generation trigger (Supabase SQL)
- [ ] **BUG #4** - Create edit page or add edit mode to create page
- [ ] **BUG #5** - Add inventory validation (stock check before adding items)
- [ ] **HIGH** - Add status transition validation
- [ ] **HIGH** - Implement soft delete with undo
- [ ] **MED** - Fix audit log to include "before" state
- [ ] Test all fixes in development environment
- [ ] Run full regression test
- [ ] Get approval from user
- [ ] Deploy to production

---

## 🚀 DEPLOYMENT ORDER

**Day 1 (Today - Critical Fixes):**
1. Fix franchise_id (2 files)
2. Fix amount_paid (2 files)
3. Deploy invoice trigger (Supabase)
4. Test end-to-end booking creation
5. Commit and push

**Day 2 (Edit Functionality):**
1. Create edit pages or add edit mode
2. Add inventory validation
3. Test edit flow
4. Commit and push

**Day 3 (Enhanced UX):**
1. Add status transition rules
2. Add soft delete + undo
3. Fix audit logs
4. Test all scenarios
5. Final commit

**Day 4 (Production Ready):**
1. Full regression testing
2. Performance testing
3. Security review
4. Deploy to production
5. Monitor logs

---

## 📝 NOTES FOR DEVELOPER

1. **franchise_id Fix:**
   - Pattern already exists in bookings/page.tsx (lines 69-77)
   - Copy same pattern to create forms

2. **amount_paid Fix:**
   - `totals.payable` already calculated correctly
   - Just use it instead of hardcoded 0

3. **Invoice Trigger:**
   - Files ready: Just copy-paste to Supabase SQL Editor
   - Test with one booking first

4. **Edit Page:**
   - Can reuse 90% of create page code
   - Add `mode` prop and `editId` state
   - Load data with `useEffect`

5. **Inventory Check:**
   - Simple version: Just check `stock_available`
   - Advanced version: Check date conflicts (future enhancement)

---

**All fixes documented. Ready for implementation!** 🔧✅
