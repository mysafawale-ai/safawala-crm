# 🧪 Payment Scenarios Testing Guide

## Test Cases for Enhanced Payment Status Display

### 📊 **Test Data Setup**

```javascript
// Test booking data for different scenarios
const testBookings = {
  fullPayment: {
    total_amount: 39165,
    paid_amount: 39165,
    payment_type: 'full',
    security_deposit: 10000,
    booking_number: 'PKG-001'
  },
  
  advancePayment: {
    total_amount: 39165,
    paid_amount: 19582.5, // 50% advance
    payment_type: 'advance',
    security_deposit: 10000,
    booking_number: 'PKG-002'
  },
  
  partialPayment: {
    total_amount: 39165,
    paid_amount: 15000, // Custom amount
    payment_type: 'partial',
    custom_amount: 15000,
    security_deposit: 10000,
    booking_number: 'PKG-003'
  },
  
  unpaidBooking: {
    total_amount: 39165,
    paid_amount: 0, // No payment yet
    payment_type: 'full',
    security_deposit: 10000,
    booking_number: 'PKG-004'
  }
}
```

## 🎯 **Expected Display Results**

### **1. FULL PAYMENT Scenario** ✅
```
💳 Payment Status Breakdown
┌──────────────────────────────────────────────────────────┐
│ ✅ Paid: ₹39,165 (100%)                    [COMPLETE]   │
│ 💰 Total: ₹39,165                          [FULL]       │
│ 🔒 Security Deposit: ₹10,000               [REFUNDABLE] │
└──────────────────────────────────────────────────────────┘
```

### **2. ADVANCE PAYMENT Scenario** 💵
```
💳 Payment Status Breakdown
┌──────────────────────────────────────────────────────────┐
│ ✅ Paid: ₹19,582 (50%)                     [COMPLETE]   │
│ ⏳ Pending: ₹19,582 (50%)                  [DUE]        │
│ 💰 Total: ₹39,165                          [ADVANCE]    │
│ 🔒 Security Deposit: ₹10,000               [REFUNDABLE] │
└──────────────────────────────────────────────────────────┘
Payment Type: advance
50% advance collected, 50% due on delivery
```

### **3. PARTIAL PAYMENT Scenario** 💳
```
💳 Payment Status Breakdown
┌──────────────────────────────────────────────────────────┐
│ ✅ Paid: ₹15,000 (38%)                     [COMPLETE]   │
│ ⏳ Pending: ₹24,165 (62%)                  [DUE]        │
│ 💰 Total: ₹39,165                          [PARTIAL]    │
│ 🔒 Security Deposit: ₹10,000               [REFUNDABLE] │
└──────────────────────────────────────────────────────────┘
Payment Type: partial
Custom amount paid, balance due later
```

### **4. UNPAID SCENARIO** ❌
```
💳 Payment Status Breakdown
┌──────────────────────────────────────────────────────────┐
│ ✅ Paid: ₹0 (0%)                           [COMPLETE]   │
│ ⏳ Pending: ₹39,165 (100%)                 [DUE]        │
│ 💰 Total: ₹39,165                          [FULL]       │
│ 🔒 Security Deposit: ₹10,000               [REFUNDABLE] │
└──────────────────────────────────────────────────────────┘
```

## 🔧 **Testing Instructions**

### **Step 1: Test Full Payment**
1. Open a booking with `paid_amount = total_amount`
2. Should show:
   - ✅ Green "Paid" section with 100%
   - No "Pending" section (hidden when 0)
   - Blue "Total" section with FULL badge

### **Step 2: Test Advance Payment**
1. Open a booking with `payment_type = 'advance'` and `paid_amount = total_amount / 2`
2. Should show:
   - ✅ Green "Paid" section with 50%
   - ⏳ Amber "Pending" section with 50%
   - Blue "Total" section with ADVANCE badge
   - Payment explanation text

### **Step 3: Test Partial Payment**
1. Open a booking with `payment_type = 'partial'` and custom `paid_amount`
2. Should show:
   - ✅ Green "Paid" section with calculated %
   - ⏳ Amber "Pending" section with remaining %
   - Blue "Total" section with PARTIAL badge
   - Payment explanation text

### **Step 4: Test Unpaid Booking**
1. Open a booking with `paid_amount = 0`
2. Should show:
   - ✅ Green "Paid" section with ₹0 (0%)
   - ⏳ Amber "Pending" section with full amount (100%)
   - Blue "Total" section
   - No payment explanation (since it's full payment type)

## ✅ **Validation Checklist**

- [ ] **Color Consistency**: Same colors as status badges (green/amber/blue/purple)
- [ ] **Format Consistency**: Exact same format as status badges
- [ ] **Percentage Accuracy**: Calculations match the status badge percentages
- [ ] **Conditional Display**: Pending section hidden when amount is 0
- [ ] **Badge Labels**: Correct status badges (COMPLETE, DUE, FULL, ADVANCE, PARTIAL, REFUNDABLE)
- [ ] **Typography**: Bold amounts, proper font weights
- [ ] **Responsive Design**: Works on mobile and desktop
- [ ] **Dark Mode**: Proper colors in dark theme
- [ ] **Security Deposit**: Only shows when > 0
- [ ] **Payment Explanations**: Show for advance/partial, hide for full

## 🎯 **Success Criteria**

✅ **Users can instantly see**:
1. Exact amount paid and percentage
2. Exact amount pending and percentage  
3. Total booking value
4. Security deposit (if applicable)
5. Payment type and timeline explanation

✅ **Display matches status badges exactly**:
- Same icons (✅⏳💰🔒)
- Same colors and styling
- Same amount formatting
- Same percentage calculations

✅ **All payment scenarios work**:
- Full payment (100% paid, no pending)
- Advance payment (50% paid, 50% pending)
- Partial payment (custom % paid, remaining pending)
- Unpaid booking (0% paid, 100% pending)

## 🚀 **Ready for Production**

Once all test cases pass, the enhanced payment status display will provide users with **complete financial transparency** in a format they already recognize from the booking list status badges!