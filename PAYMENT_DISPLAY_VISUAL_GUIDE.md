# Payment Calculation - Visual Reference Guide

## How Different Payment Types Are Displayed in Booking Dialog

### 1️⃣ FULL PAYMENT
When `payment_type = 'full'`

**Visual Display:**
```
┌─ PAYMENT TYPE ──────────────────────────────────────────┐
│ 💰 Full Payment                                         │
│ Complete amount paid upfront                            │
└──────────────────────────────────────────────────────────┘

┌─ PAYMENT STATUS ────────────────────────────────────────┐
│                                                          │
│          ✅ Fully Paid                                  │
│                                                          │
│          Grand Total: ₹10,000                           │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Calculation:**
```
Paid Now:    ₹10,000 (100%)
Pending:     ₹0
Total:       ₹10,000
```

---

### 2️⃣ ADVANCE PAYMENT (50%)
When `payment_type = 'advance'`

**Visual Display:**
```
┌─ PAYMENT TYPE ──────────────────────────────────────────┐
│ 💵 Advance Payment (50%)                                │
│ Half paid now, half pending                             │
└──────────────────────────────────────────────────────────┘

┌─ PAYMENT SPLIT (50-50) ─────────────────────────────────┐
│                                                          │
│  ┌──────────────────┐  ┌──────────────────┐             │
│  │  Paid Now        │  │  Pending         │             │
│  │  ₹5,000          │  │  ₹5,000          │             │
│  └──────────────────┘  └──────────────────┘             │
│                                                          │
├──────────────────────────────────────────────────────────┤
│ Total Amount: ₹10,000                                    │
│ Actual Amount Paid: ₹5,000                               │
│ Still Pending: ₹5,000                                    │
└──────────────────────────────────────────────────────────┘
```

**Calculation:**
```
Paid Now:    ₹5,000 (50% of ₹10,000)
Pending:     ₹5,000 (50% of ₹10,000)
Total:       ₹10,000
```

**When to use:**
- Standard 50-50 payment arrangement
- Half deposit, half on delivery
- Common for event bookings

---

### 3️⃣ PARTIAL PAYMENT (Custom Amount)
When `payment_type = 'partial'`

**Example 1: Custom amount ₹3,000 on ₹10,000 total**

**Visual Display:**
```
┌─ PAYMENT TYPE ──────────────────────────────────────────┐
│ 💳 Partial Payment                                       │
│ ₹3,000 paid now                                          │
└──────────────────────────────────────────────────────────┘

┌─ CUSTOM PAYMENT SPLIT ──────────────────────────────────┐
│                                                          │
│  ┌──────────────────┐  ┌──────────────────┐             │
│  │  Paid Now        │  │  Pending         │             │
│  │  ₹3,000          │  │  ₹7,000          │             │
│  └──────────────────┘  └──────────────────┘             │
│                                                          │
├──────────────────────────────────────────────────────────┤
│ Total Amount: ₹10,000                                    │
│ Actual Amount Paid: ₹3,000                               │
│ Still Pending: ₹7,000                                    │
└──────────────────────────────────────────────────────────┘
```

**Example 2: Custom amount ₹7,500 on ₹10,000 total**

```
                   ┌───────────────────┐  ┌───────────────┐
                   │  Paid Now         │  │  Pending      │
                   │  ₹7,500           │  │  ₹2,500       │
                   └───────────────────┘  └───────────────┘
```

**Calculation:**
```
Paid Now:    ₹<custom_amount> (user-defined)
Pending:     ₹(Total - custom_amount)
Total:       ₹<total_amount>
```

**When to use:**
- Negotiated payment amounts
- Special discounts or arrangements
- Phased payments based on agreement

---

## Color Legend

| Color | Meaning | Usage |
|-------|---------|-------|
| 🟢 **Green** | Amount Paid | "Paid Now" section |
| 🟠 **Orange** | Pending Amount | "Pending" section |
| 🔵 **Blue** | Payment Info | Type badge and descriptions |
| 🟣 **Purple** | Security Deposit | Deposit amount display |
| 🟡 **Amber/Yellow** | Advance Info | 50-50 split explanation |

---

## Key Differences at a Glance

| Aspect | Full | Advance | Partial |
|--------|------|---------|---------|
| **Icon** | 💰 | 💵 | 💳 |
| **Display Type** | Single box | 2-column grid | 2-column grid |
| **Paid Now** | 100% | 50% | Custom % |
| **Pending** | ₹0 | 50% | Custom % |
| **Background** | Green | Amber | Blue |
| **Verification Row** | ✅ N/A | ✅ Shows | ✅ Shows |

---

## Implementation Flow

```
┌─ Get Selected Booking ─────────────┐
│                                    │
├─ Call getPaymentBreakdown()        │
│  ├─ Extract payment_type           │
│  ├─ Calculate amounts based on:    │
│  │  ├─ total_amount                │
│  │  ├─ paid_amount                 │
│  │  ├─ custom_amount (if partial)  │
│  │  └─ payment_type                │
│  │                                 │
│  └─ Return breakdown object        │
│                                    │
└─ Render UI based on breakdown ────┘
   ├─ Show payment type badge
   ├─ If 'full' → show green box
   ├─ If 'advance' → show 50-50 grid
   └─ If 'partial' → show custom grid
```

---

## Data Flow Example

### ADVANCE PAYMENT

**Database (booking record):**
```
{
  "id": "pkg_12345",
  "booking_number": "PKG-001",
  "total_amount": 10000,
  "paid_amount": 5000,
  "payment_type": "advance",
  "custom_amount": 0,
  "security_deposit": 1000
}
```

**Helper Function Output:**
```javascript
getPaymentBreakdown(booking) returns {
  totalAmount: 10000,
  paidAmount: 5000,
  pendingAmount: 5000,
  paymentType: 'advance',
  customAmount: 0,
  securityDeposit: 1000,
  breakdown: {
    label: 'Advance Payment (50%)',
    description: 'Half paid now, half pending',
    paidNow: 5000,      // 10000 / 2
    pendingNow: 5000,   // 10000 / 2
    icon: '💵'
  }
}
```

**UI Rendered:**
```
💵 Advance Payment (50%)
Half paid now, half pending

[Paid Now: ₹5,000] [Pending: ₹5,000]

Total: ₹10,000 | Paid: ₹5,000 | Pending: ₹5,000
```

---

## Testing Scenarios

### Scenario 1: Full Payment Booking
- **Setup**: Booking with payment_type='full', paid_amount=₹10,000, total_amount=₹10,000
- **Expected**: Single green box showing "₹10,000 - Fully Paid"
- **Verify**: No pending section visible

### Scenario 2: Advance Payment Booking
- **Setup**: Booking with payment_type='advance', paid_amount=₹5,000, total_amount=₹10,000
- **Expected**: 2-column grid (₹5,000 paid | ₹5,000 pending)
- **Verify**: Verification row shows correct totals

### Scenario 3: Partial Payment - 30% Paid
- **Setup**: Booking with payment_type='partial', custom_amount=₹3,000, total_amount=₹10,000, paid_amount=₹3,000
- **Expected**: 2-column grid (₹3,000 paid | ₹7,000 pending)
- **Verify**: Custom amount matches paid_amount

### Scenario 4: With Security Deposit
- **Setup**: Booking with security_deposit=₹1,000 (appears before payment split)
- **Expected**: Purple box showing security deposit amount
- **Verify**: Deposit displays correctly regardless of payment type

---

## Benefits

✅ **Clarity** - Payment types are visually distinct and immediately recognizable
✅ **Simplicity** - No complex calculations shown to user  
✅ **Speed** - Quick scanning with color coding
✅ **Consistency** - Same pattern across all booking types
✅ **Flexibility** - Works with any payment arrangement
✅ **Professional** - Color-coded, well-organized display
✅ **Audit Trail** - Verification rows show all amounts
