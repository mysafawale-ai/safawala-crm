# 🔴 THE CORE PROBLEM - Visual Explanation

## The Two-System Conflict

### What Happens When You Create an Offer:

```
Step 1: Admin clicks "Manage Offers"
Step 2: Admin creates "SUMMER25" offer with 20% discount
        ↓
        ManageOffersDialog.tsx calls POST /api/offers
        ↓
        saves to: offers table ✅
```

### What Happens When Customer Tries to Apply It:

```
Step 1: Customer enters "SUMMER25" in coupon field
Step 2: Customer clicks "Apply"
        ↓
        book-package/page.tsx calls POST /api/coupons/validate  ← WRONG!
        ↓
        API looks in: coupons table ❌ (not offers!)
        ↓
        API says: "Invalid coupon code"
        ↓
        Customer: "But I just saw it in the system!"
```

---

## The Database Mismatch

### What's Being Used:

```
┌─────────────────────────────┐
│   ManageOffersDialog        │
│   (Admin UI)                │
├─────────────────────────────┤
│ ✅ Uses /api/offers         │
│ ✅ Reads/writes offers table│
│ ✅ Working correctly        │
└─────────────────────────────┘
         ↓
    offers table ✅
  (New system - has data)

┌─────────────────────────────┐
│   Order Pages               │
│   (Customer applying)       │
├─────────────────────────────┤
│ ❌ Uses /api/coupons/validate│
│ ❌ Reads/writes coupons table│
│ ❌ Data is MISSING          │
└─────────────────────────────┘
         ↓
    coupons table ❌
  (Old system - empty now!)
```

---

## The Code Flow - Where It Breaks

### File: `app/book-package/page.tsx` (Line ~1018)

```typescript
const handleApplyCoupon = async () => {
  const response = await fetch('/api/coupons/validate', {  // ❌ WRONG ENDPOINT!
    method: 'POST',
    body: JSON.stringify({
      code: formData.coupon_code,
      orderValue: totals.subtotalAfterDiscount,
      customerId: selectedCustomer?.id,
    }),
  })
  
  const data = await response.json()
  // ... never finds anything because coupons table is empty!
}
```

### File: `app/api/coupons/validate/route.ts` (Line ~50)

```typescript
// This code is LOOKING IN THE WRONG TABLE!

const { data: coupon, error: couponError } = await supabase
  .from('coupons')  // ❌ Should be 'offers'!
  .select('...')
  .eq('code', code.trim().toUpperCase())
  .eq('franchise_id', franchiseId)
  .single();

// Result: Empty! No data returned.
```

### File: `app/api/offers/route.ts` (Line ~60)

```typescript
// This works fine for ADMIN operations
// But ORDER PAGES don't call this endpoint!

const { data: offers, error } = await query
  .from('offers')  // ✅ Correct table
  .select('*')
  .eq('franchise_id', userContext.franchiseId)
```

---

## What Needs to Happen

### Option 1: Quick Fix (2 hours)
```
1. Create /api/offers/validate endpoint
   - Copy logic from /api/coupons/validate
   - Change 'coupons' table → 'offers' table
   - Handle both discount types

2. Update order pages:
   - /api/coupons/validate → /api/offers/validate
   - app/book-package/page.tsx line 1018
   - app/create-product-order/page.tsx line 775

3. Test end-to-end
```

### Option 2: Proper Fix (4 hours)
```
1. Do Option 1
2. Implement redemption tracking:
   - Create /api/offer-redemptions endpoint
   - Log each offer use to offer_redemptions table
3. Add usage stats to ManageOffersDialog
   - Show how many times each offer was used
4. Add features:
   - Expiry dates
   - Usage limits
   - Per-customer limits
```

---

## Current State Summary

| Component | Expected | Actual | Status |
|-----------|----------|--------|--------|
| ManageOffersDialog UI | ✅ Works | ✅ Works | ✅ GOOD |
| /api/offers (CRUD) | ✅ Works | ✅ Works | ✅ GOOD |
| offers table | ✅ Works | ✅ Works | ✅ GOOD |
| Order page coupon input | ✅ Works | ❌ Broken | 🔴 BAD |
| /api/coupons/validate | ✅ Works | ⚠️ Uses wrong table | 🔴 BAD |
| coupons table | Used by old code | ✅ Still exists | ⚠️ CONFUSED |
| Redemption tracking | ✅ Needed | ❌ Missing | 🔴 CRITICAL |
| Usage statistics | ✅ Needed | ❌ Missing | 🔴 CRITICAL |

---

## Files to Update

### Create (NEW):
- [ ] `app/api/offers/validate/route.ts` - Validation endpoint

### Update (EXISTING):
- [ ] `app/book-package/page.tsx` - Line ~1018 (change endpoint)
- [ ] `app/create-product-order/page.tsx` - Line ~775 (change endpoint)
- [ ] `app/api/coupons/validate/route.ts` - Change table reference OR delete if not needed

---

## The Fix in One Picture

```
BEFORE (Broken):
┌──────────────────┐
│  Admin creates   │ ───→ offers table
│   offer via UI   │
└──────────────────┘

┌──────────────────┐
│  Customer tries  │ ───→ coupons table (❌ WRONG!)
│  to use offer    │
└──────────────────┘


AFTER (Fixed):
┌──────────────────┐
│  Admin creates   │ ───→ offers table ✅
│   offer via UI   │
└──────────────────┘

┌──────────────────┐
│  Customer tries  │ ───→ offers table ✅
│  to use offer    │
└──────────────────┘
```

---

## How to Verify the Issue

1. **Create an offer:**
   - Go to `/bookings`
   - Click "Manage Offers"
   - Create "TEST10" (10% off)
   - Click "Create Offer"
   - ✅ Offer appears in list

2. **Try to apply it:**
   - Go to `/book-package`
   - Enter "TEST10" in coupon field
   - Click "Apply"
   - ❌ Error: "Invalid coupon code"

3. **The proof:**
   ```sql
   -- In Supabase SQL Editor:
   SELECT code, discount_value FROM offers LIMIT 1;
   -- ✅ Returns: TEST10, 10
   
   SELECT code FROM coupons LIMIT 1;
   -- ❌ Returns: (no rows - table is empty)
   ```

---

## Priority

**CRITICAL** - Offers system is completely broken for customers.
Admins can create offers but customers can't use them.

**Estimated Time to Fix:**
- Quick fix: 1-2 hours
- Proper fix: 3-4 hours
