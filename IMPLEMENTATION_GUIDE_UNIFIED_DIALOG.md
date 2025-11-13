# Implementation Guide: Unified Booking Dialog Architecture

## 📌 Executive Summary

**Problem:** Current booking dialog shows payment incorrectly and lacks unified structure for different booking types (product rental, direct sale, package).

**Solution:** Implement a single, unified booking dialog component that:
1. ✅ Shows ACTUAL payment status (NOW FIXED)
2. ✅ Handles all booking types consistently
3. ✅ Provides complete booking details
4. ✅ Enables payment actions
5. ✅ Maintains audit trail

**Recommendation:** Single unified component (NOT multiple pages)

---

## 🏗️ Recommended Architecture

### File Structure
```
components/
├── bookings/
│   ├── unified-booking-dialog/
│   │   ├── index.tsx                    # Main component
│   │   ├── header.tsx                   # Status badges, titles
│   │   ├── sections/
│   │   │   ├── customer-section.tsx     # Customer details (common)
│   │   │   ├── product-rental-section.tsx # For rentals
│   │   │   ├── direct-sale-section.tsx  # For direct sales
│   │   │   ├── package-section.tsx      # For packages
│   │   │   ├── financial-summary.tsx    # Breakdown
│   │   │   ├── payment-status.tsx       # Payment display (uses fixed logic)
│   │   │   ├── timeline-section.tsx     # Events timeline
│   │   │   ├── items-section.tsx        # Booking items
│   │   │   └── actions-section.tsx      # Buttons (edit, status, delete, etc)
│   │   └── hooks/
│   │       └── useBookingData.ts        # Data extraction logic
│   └── [existing components...]
│
lib/
├── booking-helpers/
│   ├── payment-status.ts                # getActualPaymentStatus()
│   ├── booking-type.ts                  # getBookingType()
│   ├── booking-formatter.ts             # Format data for display
│   └── payment-timeline.ts              # Payment schedule logic
```

---

## 🔧 Implementation Steps

### Step 1: Extract Helper Functions (FOUNDATION)

**File:** `lib/booking-helpers/payment-status.ts`

```typescript
export interface PaymentStatus {
  totalAmount: number
  paidAmount: number
  pendingAmount: number
  securityDeposit: number
  isFullyPaid: boolean
  isUnpaid: boolean
  isPartiallyPaid: boolean
  paymentPercentage: number
  status: 'fully_paid' | 'unpaid' | 'partially_paid'
  breakdown: {
    label: string
    description: string
    paidNow: number
    pendingNow: number
    icon: string
    status: string
  }
}

export const getActualPaymentStatus = (booking: any): PaymentStatus => {
  const totalAmount = booking?.total_amount || 0
  const paidAmount = booking?.paid_amount || 0
  const securityDeposit = booking?.security_deposit || 0
  const pendingAmount = Math.max(0, totalAmount - paidAmount)

  const isFullyPaid = paidAmount >= totalAmount
  const isUnpaid = paidAmount === 0
  const isPartiallyPaid = paidAmount > 0 && paidAmount < totalAmount
  const paymentPercentage = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0

  return {
    totalAmount,
    paidAmount,
    pendingAmount,
    securityDeposit,
    isFullyPaid,
    isUnpaid,
    isPartiallyPaid,
    paymentPercentage,
    status: isFullyPaid ? 'fully_paid' : isUnpaid ? 'unpaid' : 'partially_paid',
    breakdown: isFullyPaid
      ? {
          label: '✅ Full Payment - Received',
          description: 'Complete amount received',
          paidNow: totalAmount,
          pendingNow: 0,
          icon: '💰',
          status: 'paid',
        }
      : isUnpaid
      ? {
          label: '❌ No Payment - Due',
          description: 'Full amount still pending',
          paidNow: 0,
          pendingNow: totalAmount,
          icon: '⏳',
          status: 'unpaid',
        }
      : {
          label: `⏳ Partial Payment - ${Math.round(paymentPercentage)}% Received`,
          description: `₹${paidAmount.toLocaleString()} received, ₹${pendingAmount.toLocaleString()} pending`,
          paidNow: paidAmount,
          pendingNow: pendingAmount,
          icon: '💳',
          status: 'partial',
        },
  }
}
```

### Step 2: Booking Type Detection

**File:** `lib/booking-helpers/booking-type.ts`

```typescript
export type BookingType = 'product_rental' | 'direct_sale' | 'package_booking'

export const getBookingType = (booking: any): BookingType => {
  const source = booking?.source
  const type = booking?.type

  if (source === 'package_bookings') return 'package_booking'
  if (source === 'product_orders') {
    return type === 'rental' ? 'product_rental' : 'direct_sale'
  }
  if (source === 'direct_sales_orders') return 'direct_sale'

  return 'product_rental' // Default fallback
}

export const getBookingTypeLabel = (type: BookingType): string => {
  return {
    product_rental: '🛍️ Product Rental',
    direct_sale: '💳 Direct Sale',
    package_booking: '📦 Package Booking',
  }[type]
}
```

### Step 3: Payment Status Component

**File:** `components/bookings/unified-booking-dialog/sections/payment-status.tsx`

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getActualPaymentStatus } from '@/lib/booking-helpers/payment-status'
import type { PaymentStatus } from '@/lib/booking-helpers/payment-status'

interface PaymentStatusDisplayProps {
  booking: any
}

export function PaymentStatusDisplay({ booking }: PaymentStatusDisplayProps) {
  const paymentStatus = getActualPaymentStatus(booking)

  return (
    <Card>
      <CardHeader>
        <CardTitle>💰 Payment Status</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status Header with Progress */}
        <div className={`
          p-4 rounded-lg border-l-4
          ${paymentStatus.isFullyPaid 
            ? 'bg-green-50 dark:bg-green-950/30 border-l-green-500' 
            : paymentStatus.isUnpaid 
            ? 'bg-red-50 dark:bg-red-950/30 border-l-red-500'
            : 'bg-amber-50 dark:bg-amber-950/30 border-l-amber-500'
          }
        `}>
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{paymentStatus.breakdown.icon}</span>
              <div>
                <p className={`font-bold ${
                  paymentStatus.isFullyPaid ? 'text-green-700' :
                  paymentStatus.isUnpaid ? 'text-red-700' :
                  'text-amber-700'
                }`}>
                  {paymentStatus.breakdown.label}
                </p>
                <p className={`text-xs ${
                  paymentStatus.isFullyPaid ? 'text-green-600' :
                  paymentStatus.isUnpaid ? 'text-red-600' :
                  'text-amber-600'
                }`}>
                  {paymentStatus.breakdown.description}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-2xl font-bold ${
                paymentStatus.isFullyPaid ? 'text-green-700' :
                paymentStatus.isUnpaid ? 'text-red-700' :
                'text-amber-700'
              }`}>
                {Math.round(paymentStatus.paymentPercentage)}%
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all ${
                paymentStatus.isFullyPaid ? 'bg-green-500' :
                paymentStatus.isUnpaid ? 'bg-red-500' :
                'bg-amber-500'
              }`}
              style={{ width: `${paymentStatus.paymentPercentage}%` }}
            />
          </div>
        </div>

        {/* 3-Column Breakdown */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-green-100 dark:bg-green-900/50 p-3 rounded text-center border border-green-300">
            <p className="text-xs text-green-700 font-medium mb-1">✅ Paid</p>
            <p className="font-bold text-green-700">
              ₹{paymentStatus.paidAmount.toLocaleString()}
            </p>
          </div>

          <div className="bg-orange-100 dark:bg-orange-900/50 p-3 rounded text-center border border-orange-300">
            <p className="text-xs text-orange-700 font-medium mb-1">⏳ Pending</p>
            <p className="font-bold text-orange-700">
              ₹{paymentStatus.pendingAmount.toLocaleString()}
            </p>
          </div>

          <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded text-center border border-blue-300">
            <p className="text-xs text-blue-700 font-medium mb-1">💰 Total</p>
            <p className="font-bold text-blue-700">
              ₹{paymentStatus.totalAmount.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Security Deposit if applicable */}
        {paymentStatus.securityDeposit > 0 && (
          <div className="bg-purple-50 dark:bg-purple-950/30 p-3 rounded border-l-4 border-purple-500">
            <div className="flex justify-between items-center">
              <span className="font-medium text-purple-700 dark:text-purple-300">
                🔒 Security Deposit
              </span>
              <span className="font-bold text-purple-700 dark:text-purple-400">
                ₹{paymentStatus.securityDeposit.toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

### Step 4: Main Unified Dialog Component

**File:** `components/bookings/unified-booking-dialog/index.tsx`

```typescript
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getBookingType, getBookingTypeLabel } from '@/lib/booking-helpers/booking-type'
import { PaymentStatusDisplay } from './sections/payment-status'
import { CustomerSection } from './sections/customer-section'
import { ProductRentalSection } from './sections/product-rental-section'
import { DirectSaleSection } from './sections/direct-sale-section'
import { PackageSection } from './sections/package-section'
import { FinancialSummarySection } from './sections/financial-summary'

interface UnifiedBookingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  booking: any
  bookingItems?: any[]
  onStatusChange?: (newStatus: string) => void
}

export function UnifiedBookingDialog({
  open,
  onOpenChange,
  booking,
  bookingItems = [],
  onStatusChange,
}: UnifiedBookingDialogProps) {
  if (!booking) return null

  const bookingType = getBookingType(booking)
  const bookingTypeLabel = getBookingTypeLabel(bookingType)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="space-y-2">
            <DialogTitle className="text-2xl">
              📋 {booking.booking_number || 'Booking Details'}
            </DialogTitle>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">{bookingTypeLabel}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">
                Created {new Date(booking.created_at).toLocaleDateString('en-IN')}
              </span>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Customer Information - Common for all types */}
          <CustomerSection booking={booking} />

          {/* Type-specific details */}
          {bookingType === 'product_rental' && (
            <ProductRentalSection booking={booking} items={bookingItems} />
          )}

          {bookingType === 'direct_sale' && (
            <DirectSaleSection booking={booking} items={bookingItems} />
          )}

          {bookingType === 'package_booking' && (
            <PackageSection booking={booking} items={bookingItems} />
          )}

          {/* Financial Summary */}
          <FinancialSummarySection booking={booking} />

          {/* Payment Status Display - Using Fixed Logic */}
          <PaymentStatusDisplay booking={booking} />

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4 border-t">
            <button
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Close
            </button>
            {/* Additional action buttons can be added here */}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

---

## 🎯 Migration Path

### Phase 1: Immediate (This Week) ✅ DONE
- [x] Fix payment status display logic ✓
- [x] Show actual paid amounts, not theoretical

### Phase 2: Short-term (Next Week)
- [ ] Extract helper functions to `lib/booking-helpers/`
- [ ] Create payment status component
- [ ] Create booking type detection

### Phase 3: Medium-term (Following Week)
- [ ] Create unified dialog component
- [ ] Extract booking details sections
- [ ] Create customer section component
- [ ] Create rental/sale/package sections

### Phase 4: Long-term (Month 2)
- [ ] Add payment actions (record payment, mark paid)
- [ ] Add timeline/history view
- [ ] Add audit logging
- [ ] Add export/print functionality

---

## 🚀 Quick Start: Next Implementation

### To implement the unified dialog:

1. **Copy helper code** from Steps 1-2 into `lib/booking-helpers/`
2. **Create section components** in `components/bookings/unified-booking-dialog/sections/`
3. **Create main dialog** in `components/bookings/unified-booking-dialog/index.tsx`
4. **Update page** to use `<UnifiedBookingDialog />` instead of current dialog
5. **Test all scenarios** (rental, direct sale, package)

### Estimated effort:
- Setup: 30 min
- Component creation: 2-3 hours
- Testing: 1 hour
- **Total: ~4 hours**

---

## ✅ Benefits of This Approach

| Benefit | Why |
|---------|-----|
| **Single Source** | One component handles all scenarios |
| **Maintainable** | Easier to update logic across all types |
| **Scalable** | Adding new booking types is straightforward |
| **Consistent** | Users see same layout regardless of booking type |
| **Testable** | Easier to test all cases in one place |
| **Performant** | One dialog instance vs multiple |

---

## 📋 Checklist for Implementation

- [ ] Extract helper functions
- [ ] Create booking type detection
- [ ] Create payment status component
- [ ] Create customer section
- [ ] Create rental section
- [ ] Create sale section
- [ ] Create package section
- [ ] Create financial summary
- [ ] Create main dialog component
- [ ] Update app/bookings/page.tsx to use new dialog
- [ ] Test all booking types
- [ ] Test all payment statuses
- [ ] Test dark mode
- [ ] Test mobile view
- [ ] Create unit tests
- [ ] Create integration tests

---

## 🎓 Code Examples

See companion documents:
- `PAYMENT_STATUS_FIX_BEFORE_AFTER.md` - Detailed before/after
- `UNIFIED_BOOKING_DIALOG_RECOMMENDATION.md` - Architecture deep dive
