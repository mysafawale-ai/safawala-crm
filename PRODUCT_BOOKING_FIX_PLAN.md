# 🔧 Product Booking System - Complete Fix Plan

**Date:** October 14, 2025  
**Priority:** 🔴 CRITICAL  
**Estimated Time:** 2-3 hours

---

## 📋 Issues to Fix

### ✅ **Issue #1: Redirect after order creation**
**Current:** Redirects to `/invoices` or `/quotes`  
**Required:** Redirect to `/bookings`  
**Files:** `app/create-product-order/page.tsx` (line 427)  
**Time:** 2 minutes  
**Status:** READY TO FIX

---

### 🚨 **Issue #2: Inventory NOT decreasing**
**Problem:** When product order created, stock_available NOT reducing  
**Current:** Only validates stock, doesn't deduct  
**Required:** Automatic stock deduction on order creation  
**Solution:** Add database trigger OR manual deduction in API  
**Files:** Need to create trigger or update API  
**Time:** 30 minutes  
**Status:** CRITICAL - NEEDS IMMEDIATE FIX

---

### 📝 **Issue #3: Edit Booking Page Missing**
**Problem:** Cannot edit product orders after creation  
**Required:** Create edit page with prefilled data  
**Files:** Need to create `app/bookings/[id]/edit/page.tsx`  
**Features:**
- Load existing booking data
- Support both package and product bookings
- Prefill all fields (customer, dates, products, amounts)
- Update inventory on quantity changes
- Recalculate totals
- Save changes
**Time:** 2 hours  
**Status:** HIGH PRIORITY

---

### 👁️ **Issue #4: View Booking Enhancement**
**Problem:** View dialog doesn't show complete info  
**Required:** Show complete price breakdown  
**Show:**
- All booking details
- Customer info with city
- Venue with city  
- Line items with quantities
- **Price Breakdown:**
  - Subtotal
  - GST (18% or configurable)
  - Security Deposit
  - Discount
  - Total Amount
  - Amount Paid
  - Balance Remaining
**Files:** `components/bookings/booking-details-dialog.tsx`  
**Time:** 1 hour  
**Status:** MEDIUM PRIORITY

---

### 🔗 **Issue #5: Invoice Sync**
**Problem:** When booking edited, invoice not updating  
**Required:** Auto-update invoice when booking changes  
**Logic:**
- When booking total changes → update invoice total
- When items change → update invoice line items
- When payment changes → update invoice payment status
**Files:** Edit API needs to trigger invoice update  
**Time:** 30 minutes  
**Status:** MEDIUM PRIORITY

---

## 🎯 Implementation Order

### **Phase 1: Quick Wins (15 minutes)**
1. ✅ Fix redirect to /bookings
2. ✅ Add price breakdown to view dialog

### **Phase 2: Critical (1 hour)**
3. 🚨 Add inventory deduction logic
4. 🧪 Test inventory decrease

### **Phase 3: Edit Functionality (2 hours)**
5. 📝 Create edit booking page
6. 🔄 Add inventory adjustment on edit
7. 🧪 Test edit flow

### **Phase 4: Invoice Sync (30 minutes)**
8. 🔗 Add invoice update trigger
9. 🧪 Test invoice sync

---

## 💻 Technical Details

### **Inventory Deduction Logic**

**Option A: Database Trigger (Recommended)**
```sql
-- Create function to deduct inventory
CREATE OR REPLACE FUNCTION deduct_inventory_on_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Deduct stock for each order item
  UPDATE inventory
  SET stock_available = stock_available - NEW.quantity
  WHERE id = NEW.product_id;
  
  -- Prevent negative stock
  IF (SELECT stock_available FROM inventory WHERE id = NEW.product_id) < 0 THEN
    RAISE EXCEPTION 'Insufficient stock for product %', NEW.product_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on product_order_items insert
CREATE TRIGGER inventory_deduction_trigger
AFTER INSERT ON product_order_items
FOR EACH ROW
EXECUTE FUNCTION deduct_inventory_on_order();
```

**Option B: Manual in API**
```typescript
// After inserting order items
for (const item of items) {
  const { data: product } = await supabase
    .from('inventory')
    .select('stock_available')
    .eq('id', item.product_id)
    .single()
    
  if (product.stock_available < item.quantity) {
    throw new Error(`Insufficient stock for ${item.product_name}`)
  }
  
  await supabase
    .from('inventory')
    .update({ stock_available: product.stock_available - item.quantity })
    .eq('id', item.product_id)
}
```

---

### **Edit Page Structure**

```typescript
// app/bookings/[id]/edit/page.tsx
interface EditBookingPageProps {
  params: { id: string }
  searchParams: { type?: 'package' | 'product_order' }
}

// Load existing data
useEffect(() => {
  const loadBooking = async () => {
    const type = searchParams.type || 'package'
    const table = type === 'package' ? 'package_bookings' : 'product_orders'
    
    // Fetch booking with items
    const { data } = await supabase
      .from(table)
      .select(`
        *,
        customer:customers(*),
        items:${type === 'package' ? 'package_booking_items' : 'product_order_items'}(*)
      `)
      .eq('id', params.id)
      .single()
      
    // Prefill form
    setFormData(data)
    setItems(data.items)
  }
  
  loadBooking()
}, [])
```

---

### **Price Breakdown Display**

```typescript
// In BookingDetailsDialog
const PriceBreakdown = ({ booking }) => {
  const subtotal = calculateSubtotal(booking.items)
  const gst = subtotal * 0.18 // 18% GST
  const deposit = booking.security_deposit || 0
  const discount = booking.discount_amount || 0
  const total = subtotal + gst + deposit - discount
  const paid = booking.amount_paid || 0
  const balance = total - paid
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <span>Subtotal:</span>
        <span>₹{subtotal.toLocaleString()}</span>
      </div>
      <div className="flex justify-between text-sm text-gray-600">
        <span>GST (18%):</span>
        <span>₹{gst.toLocaleString()}</span>
      </div>
      {deposit > 0 && (
        <div className="flex justify-between text-sm text-gray-600">
          <span>Security Deposit:</span>
          <span>₹{deposit.toLocaleString()}</span>
        </div>
      )}
      {discount > 0 && (
        <div className="flex justify-between text-sm text-green-600">
          <span>Discount:</span>
          <span>-₹{discount.toLocaleString()}</span>
        </div>
      )}
      <Separator />
      <div className="flex justify-between font-bold text-lg">
        <span>Total:</span>
        <span>₹{total.toLocaleString()}</span>
      </div>
      <div className="flex justify-between text-green-600">
        <span>Paid:</span>
        <span>₹{paid.toLocaleString()}</span>
      </div>
      <div className="flex justify-between font-bold text-orange-600">
        <span>Balance:</span>
        <span>₹{balance.toLocaleString()}</span>
      </div>
    </div>
  )
}
```

---

### **Invoice Sync Logic**

```typescript
// When booking edited
const syncInvoiceWithBooking = async (bookingId: string, changes: any) => {
  // Find related invoice
  const { data: invoice } = await supabase
    .from('invoices')
    .select('*')
    .eq('booking_id', bookingId)
    .single()
    
  if (!invoice) return // No invoice yet
  
  // Update invoice
  await supabase
    .from('invoices')
    .update({
      subtotal_amount: changes.subtotal,
      tax_amount: changes.gst,
      total_amount: changes.total,
      amount_paid: changes.paid,
      pending_amount: changes.balance,
      updated_at: new Date().toISOString()
    })
    .eq('id', invoice.id)
    
  // Update invoice items if items changed
  if (changes.items) {
    await supabase
      .from('invoice_items')
      .delete()
      .eq('invoice_id', invoice.id)
      
    await supabase
      .from('invoice_items')
      .insert(changes.items.map(item => ({
        invoice_id: invoice.id,
        ...item
      })))
  }
}
```

---

## 🧪 Testing Checklist

### **Inventory Deduction:**
- [ ] Create product order with 3 units
- [ ] Check inventory before: 10 units
- [ ] Check inventory after: 7 units ✅
- [ ] Try ordering more than available → Should fail
- [ ] Delete order → Inventory restored?

### **Edit Page:**
- [ ] Navigate to edit page
- [ ] All fields prefilled correctly
- [ ] Change quantity → Total recalculates
- [ ] Add new product → Inventory deducted
- [ ] Remove product → Inventory restored
- [ ] Save changes → Database updated

### **View Dialog:**
- [ ] Open view dialog
- [ ] All details visible
- [ ] Price breakdown shows correctly
- [ ] Subtotal + GST + Deposit - Discount = Total
- [ ] Total - Paid = Balance

### **Invoice Sync:**
- [ ] Edit booking amount
- [ ] Check invoice updated
- [ ] Edit items
- [ ] Check invoice items updated

---

## 📝 Files to Modify

1. ✅ `app/create-product-order/page.tsx` - Fix redirect
2. 🚨 `CREATE_INVENTORY_TRIGGER.sql` - Add deduction logic
3. 📝 `app/bookings/[id]/edit/page.tsx` - NEW FILE
4. 👁️ `components/bookings/booking-details-dialog.tsx` - Add breakdown
5. 🔗 `app/api/bookings/[id]/route.ts` - Add invoice sync

---

**Status:** 📋 Plan Complete, Ready to Implement  
**Next:** Start with Phase 1 (Quick Wins)
