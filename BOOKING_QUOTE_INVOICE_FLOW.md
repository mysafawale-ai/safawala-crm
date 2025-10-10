# Booking, Quote & Invoice Flow - Complete Understanding

## 📋 System Flow Overview

### 1. **Quote Flow** (Estimation/Proposal)
```
Customer Inquiry → Create Quote → Send to Customer → Customer Reviews
                ↓
    Quote Accepted → Convert to Booking/Order → Generate Invoice
    Quote Rejected → End
```

**Database:**
- Stored in `product_orders` OR `package_bookings` with `is_quote = TRUE`
- Status: generated, sent, accepted, rejected, converted

**UI Pages:**
- `/quotes` - List all quotes
- `/quotes/new` - Create new quote (with type selection)
- `/create-order` - Old booking page (can create quotes or orders)

---

### 2. **Booking/Order Flow** (Confirmed Reservation)
```
Customer Confirmed → Create Booking/Order → Generate Invoice → Track Payment
                                          ↓
                              Delivery → Event → Return → Complete
```

**Database:**
- Stored in `product_orders` OR `package_bookings` with `is_quote = FALSE`
- Status: confirmed, processing, delivered, completed, cancelled

**UI Pages:**
- `/bookings` - List all bookings/orders
- `/book-package` - Create package booking
- Product booking - Through quote conversion or `/create-order`

---

### 3. **Invoice Flow** (Payment Tracking)
```
Booking Created → Auto-generate Invoice → Send to Customer → Track Payments
                                       ↓
                           Paid → Partially Paid → Overdue
```

**Database:**
- Invoices are **NOT stored separately**
- They are **views** of bookings where `is_quote = FALSE`
- Invoice data comes from `product_orders` and `package_bookings`
- Payment tracking: `amount_paid`, `pending_amount`, `payment_status`

**UI Pages:**
- `/invoices` - List all invoices (bookings with payment info)
- Invoice generation - Automatic when booking is created

---

## 🔄 Complete User Journeys

### Journey A: Quote → Order → Invoice
```
1. Sales person creates QUOTE in /quotes
   - is_quote = TRUE
   - Customer reviews the quote

2. Customer accepts → Click "Convert to Booking"
   - Creates new entry with is_quote = FALSE
   - Original quote status = "converted"

3. System auto-shows in /invoices
   - Same entry, just filtered by is_quote = FALSE
   - Track payments against this booking

4. Delivery & completion workflow in /bookings
```

### Journey B: Direct Booking → Invoice
```
1. Customer ready to book → Create booking in /book-package or /create-order
   - is_quote = FALSE (direct order)
   - Status = "confirmed"

2. System auto-shows in /invoices
   - Same entry for payment tracking

3. Process delivery & completion in /bookings
```

---

## 📊 Database Structure

### Product Orders Table: `product_orders`
```sql
id, order_number, customer_id, 
is_quote (BOOLEAN),  -- TRUE = quote, FALSE = order/invoice
status,              -- For quotes: generated/sent/accepted/rejected/converted
                     -- For orders: confirmed/processing/delivered/completed
total_amount, amount_paid, pending_amount,
delivery_date, return_date, event_date,
created_at, updated_at
```

### Package Bookings Table: `package_bookings`
```sql
id, package_number, customer_id,
is_quote (BOOLEAN),  -- TRUE = quote, FALSE = order/invoice
status,              -- Same as product_orders
total_amount, amount_paid, pending_amount,
delivery_date, return_date, event_date,
created_at, updated_at
```

### Key Insight:
**There is NO separate invoices table!**
- Invoices = Bookings where `is_quote = FALSE`
- Invoice service queries both tables with `is_quote = false` filter

---

## 🐛 Current Issues Identified

### Issue 1: Invoice Page Shows Wrong Count
**Problem:** Stats show "2 invoices" but table is empty

**Root Cause:** 
- Stats query is correct: `SELECT * WHERE is_quote = false`
- But the actual data might be stored as quotes (`is_quote = true`)
- Or status filtering is removing the records

**Fix Needed:**
- Check database: `SELECT * FROM product_orders WHERE is_quote = false`
- Check database: `SELECT * FROM package_bookings WHERE is_quote = false`
- Verify sample data has `is_quote = false` entries

### Issue 2: Package Booking UX Poor
**Problem:** Single page with all fields, not step-by-step

**Solution Needed:**
- Step 1: Customer Selection (search existing or create new)
- Step 2: Package Selection (grid of package cards with prices)
- Step 3: Event Details (date, venue, participants)
- Step 4: Review & Confirm (summary with totals)
- Sidebar: Show selected packages and running total

### Issue 3: No Placeholder Text
**Problem:** Empty form fields are confusing

**Solution:** Add helpful placeholders:
- "Enter venue address like: Grand Palace, Connaught Place, Delhi"
- "Select event date and time"
- "Enter groom's full name"

### Issue 4: Button Navigation Wrong
**Problem:** Buttons don't navigate correctly

**Current:**
- "Create Quote for Now" - Does nothing
- "Create Order" - Does nothing

**Should Be:**
- "Create Quote for Now" → Navigate to `/quotes` after saving with `is_quote = true`
- "Create Order" → Navigate to `/invoices` after saving with `is_quote = false`

---

## ✅ Correct Implementation

### When Creating a Quote:
```typescript
// Set is_quote = TRUE
const quoteData = {
  ...formData,
  is_quote: true,
  status: 'generated', // or 'draft'
}
await supabase.from('product_orders').insert(quoteData)
// Navigate to /quotes
router.push('/quotes')
```

### When Creating a Booking/Order:
```typescript
// Set is_quote = FALSE
const orderData = {
  ...formData,
  is_quote: false,
  status: 'confirmed',
}
await supabase.from('product_orders').insert(orderData)
// Navigate to /invoices (to track payment)
router.push('/invoices')
```

### When Converting Quote to Order:
```typescript
// 1. Update original quote
await supabase
  .from('product_orders')
  .update({ status: 'converted' })
  .eq('id', quoteId)

// 2. Create new order with is_quote = false
const orderData = {
  ...quoteData,
  is_quote: false,
  status: 'confirmed',
  order_number: generateOrderNumber(), // New order number
  converted_from_quote_id: quoteId
}
await supabase.from('product_orders').insert(orderData)
```

---

## 🎯 Summary

**Flow Understanding:**
1. **Quotes** = Proposals/Estimates (`is_quote = true`)
2. **Bookings** = Confirmed Orders (`is_quote = false`)
3. **Invoices** = Same as Bookings (just a different view for payment tracking)

**Key Point:** 
There's only ONE set of tables (`product_orders` + `package_bookings`). The `is_quote` flag determines whether it appears in:
- `/quotes` page (is_quote = true)
- `/bookings` and `/invoices` pages (is_quote = false)

**Current Problem:**
The system is working correctly in code, but the **sample data might all be quotes** (`is_quote = true`), so nothing shows in the invoices page.

**Solution:**
1. Check database and ensure some entries have `is_quote = false`
2. Or create new bookings through the UI with the correct flag
3. Fix the booking creation buttons to set `is_quote` correctly

---

## 📝 Next Steps

1. ✅ Fix invoice display - Verify database has `is_quote = false` entries
2. ✅ Redesign package booking page - Multi-step wizard
3. ✅ Add placeholder text to all forms
4. ✅ Fix "Create Quote" button - Set `is_quote = true`, navigate to `/quotes`
5. ✅ Fix "Create Order" button - Set `is_quote = false`, navigate to `/invoices`
6. ✅ Test the complete flow: Quote → Convert → Order → Invoice → Payment

