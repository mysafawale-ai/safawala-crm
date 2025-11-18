# ✅ MANAGE OFFERS - EXACT FIX NEEDED

## Summary
The manage offers system has **1 critical issue**: Customers can't apply offers because the order pages call the wrong validation endpoint.

**The Fix:** Create `/api/offers/validate` endpoint and update 2 order pages to call it.

---

## 🔧 FIXES REQUIRED

### Fix #1: Create New Validation Endpoint

**File to Create:** `/app/api/offers/validate/route.ts`

```typescript
import { supabaseServer as supabase } from '@/lib/supabase-server-simple';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

class AuthError extends Error {}

async function getUserFromSession(request: NextRequest) {
  try {
    const cookieHeader = request.cookies.get("safawala_session")
    if (!cookieHeader?.value) throw new Error("No session")
    
    const sessionData = JSON.parse(cookieHeader.value)
    if (!sessionData.id) throw new Error("Invalid session")

    const { data: user, error } = await supabase
      .from('users')
      .select('id, franchise_id, role')
      .eq('id', sessionData.id)
      .eq('is_active', true)
      .single()

    if (error || !user) throw new Error('User not found')
    
    return { 
      userId: user.id, 
      franchiseId: user.franchise_id, 
      role: user.role 
    };
  } catch (error) {
    console.error('[Auth] Error:', error);
    throw new AuthError((error as Error).message || 'auth_failed');
  }
}

interface ValidateOfferRequest {
  code: string;
  orderValue: number;
  customerId?: string;
}

/**
 * Validate an offer code from the NEW offers system
 * 
 * This endpoint replaces the old /api/coupons/validate
 * It validates offers from the simplified offers table (not coupons)
 */
export async function POST(request: NextRequest) {
  try {
    const { franchiseId } = await getUserFromSession(request);
    const body: ValidateOfferRequest = await request.json();
    
    const { code, orderValue, customerId } = body;

    // Validation
    if (!code || orderValue === undefined) {
      return NextResponse.json(
        { 
          valid: false, 
          error: 'Offer code and order value are required' 
        },
        { status: 400 }
      );
    }

    if (orderValue <= 0) {
      return NextResponse.json(
        { 
          valid: false, 
          error: 'Order value must be greater than 0' 
        },
        { status: 400 }
      );
    }

    // Fetch offer from NEW offers table (not old coupons table!)
    const { data: offer, error: offerError } = await supabase
      .from('offers')  // ✅ NOTE: Using NEW offers table!
      .select('id, code, name, discount_type, discount_value, is_active, franchise_id')
      .eq('code', code.trim().toUpperCase())
      .eq('franchise_id', franchiseId)
      .eq('is_active', true)  // Only active offers
      .single();

    if (offerError || !offer) {
      return NextResponse.json(
        { 
          valid: false, 
          error: 'Invalid offer code',
          message: 'This offer code does not exist or is no longer active'
        },
        { status: 200 }  // Return 200 with valid: false for consistency
      );
    }

    // Calculate discount based on type
    let discountAmount = 0;
    
    if (offer.discount_type === 'percent') {
      // Percentage discount
      discountAmount = (orderValue * offer.discount_value) / 100;
    } else if (offer.discount_type === 'fixed') {
      // Fixed amount discount
      discountAmount = offer.discount_value;
    }

    // Ensure discount doesn't exceed order value
    discountAmount = Math.min(discountAmount, orderValue);

    return NextResponse.json({
      valid: true,
      offer: {
        id: offer.id,
        code: offer.code,
        name: offer.name,
        discount_type: offer.discount_type,
        discount_value: offer.discount_value,
      },
      discount: discountAmount,
      message: `Offer "${offer.name}" applied! You saved ₹${discountAmount.toFixed(2)}`,
    });

  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Offers Validate] Error:', error);
    return NextResponse.json(
      { error: 'Failed to validate offer', details: error.message },
      { status: 500 }
    );
  }
}
```

---

### Fix #2: Update Book Package Page

**File:** `app/book-package/page.tsx`

**Location:** Around line 998-1018 (look for `handleApplyCoupon` function)

**Change From:**
```typescript
const handleApplyCoupon = async () => {
  if (!formData.coupon_code) {
    setCouponError("Please enter a coupon code")
    return
  }

  setCouponValidating(true)
  setCouponError("")

  try {
    const response = await fetch('/api/coupons/validate', {  // ❌ OLD
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: formData.coupon_code,
        orderValue: totals.subtotalAfterDiscount || totals.subtotal,
        customerId: selectedCustomer?.id,
      }),
    })

    const data = await response.json()

    if (data.valid) {
      setFormData({
        ...formData,
        coupon_discount: data.discount,
      })
      toast.success(data.message || 'Coupon applied successfully!')
      setCouponError("")
    } else {
      setCouponError(data.message || data.error || 'Invalid coupon')
      setFormData({ ...formData, coupon_discount: 0 })
    }
  } catch (error) {
    console.error('Error validating coupon:', error)
    setCouponError('Failed to validate coupon')
    setFormData({ ...formData, coupon_discount: 0 })
  } finally {
    setCouponValidating(false)
  }
}
```

**Change To:**
```typescript
const handleApplyCoupon = async () => {
  if (!formData.coupon_code) {
    setCouponError("Please enter a coupon code")
    return
  }

  setCouponValidating(true)
  setCouponError("")

  try {
    const response = await fetch('/api/offers/validate', {  // ✅ NEW
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: formData.coupon_code,
        orderValue: totals.subtotalAfterDiscount || totals.subtotal,
        customerId: selectedCustomer?.id,
      }),
    })

    const data = await response.json()

    if (data.valid) {
      setFormData({
        ...formData,
        coupon_discount: data.discount,
      })
      toast.success(data.message || 'Offer applied successfully!')
      setCouponError("")
    } else {
      setCouponError(data.message || data.error || 'Invalid offer')
      setFormData({ ...formData, coupon_discount: 0 })
    }
  } catch (error) {
    console.error('Error validating offer:', error)
    setCouponError('Failed to validate offer')
    setFormData({ ...formData, coupon_discount: 0 })
  } finally {
    setCouponValidating(false)
  }
}
```

---

### Fix #3: Update Create Product Order Page

**File:** `app/create-product-order/page.tsx`

**Location:** Around line 757-777 (look for `handleApplyCoupon` function)

**Change From:**
```typescript
const handleApplyCoupon = async () => {
  if (!formData.coupon_code) {
    setCouponError("Please enter a coupon code")
    return
  }

  setCouponValidating(true)
  setCouponError("")

  try {
    const response = await fetch('/api/coupons/validate', {  // ❌ OLD
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: formData.coupon_code,
        orderValue: totals.subtotalAfterDiscount,
        customerId: selectedCustomer?.id,
      }),
    })
    
    // ... rest of code
```

**Change To:**
```typescript
const handleApplyCoupon = async () => {
  if (!formData.coupon_code) {
    setCouponError("Please enter a coupon code")
    return
  }

  setCouponValidating(true)
  setCouponError("")

  try {
    const response = await fetch('/api/offers/validate', {  // ✅ NEW
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: formData.coupon_code,
        orderValue: totals.subtotalAfterDiscount,
        customerId: selectedCustomer?.id,
      }),
    })
    
    // ... rest of code
```

---

## 📋 Implementation Checklist

### Step 1: Create New Endpoint
- [ ] Create file: `/app/api/offers/validate/route.ts`
- [ ] Copy the code from "Fix #1" above
- [ ] Save file

### Step 2: Update Order Pages
- [ ] Edit: `app/book-package/page.tsx`
  - [ ] Find `handleApplyCoupon` function
  - [ ] Change `/api/coupons/validate` → `/api/offers/validate` (2 places: fetch call and logs)
  
- [ ] Edit: `app/create-product-order/page.tsx`
  - [ ] Find `handleApplyCoupon` function
  - [ ] Change `/api/coupons/validate` → `/api/offers/validate` (2 places: fetch call and logs)

### Step 3: Test
- [ ] Go to `/bookings`
- [ ] Click "Manage Offers"
- [ ] Create new offer: "WELCOME10" - 10% off
- [ ] Click "Create Offer"
- [ ] Go to `/book-package`
- [ ] Add items to get subtotal of ~₹500
- [ ] Enter "WELCOME10" in coupon field
- [ ] Click "Apply"
- [ ] ✅ Should show "Offer applied!" and calculate discount
- [ ] Verify discount is ~₹50 (10% of 500)

### Step 4: Repeat for Product Orders
- [ ] Go to `/create-product-order`
- [ ] Add items to get subtotal of ~₹500
- [ ] Enter "WELCOME10" in coupon field
- [ ] Click "Apply"
- [ ] ✅ Should work same as package booking

---

## 🎯 What This Fixes

✅ **After these changes:**
1. Customers can apply offers created via ManageOffersDialog
2. Both "percent" and "fixed" discount types work
3. Discount calculation is correct
4. Error messages are clear

⚠️ **Still missing (future improvements):**
- Usage tracking (how many times offer was used)
- Usage limits (prevent abuse)
- Expiry dates (automatic disable old offers)
- Per-customer limits (customer can't reuse unlimited)

---

## 🔍 Verification SQL

After making these changes, you can verify in Supabase:

```sql
-- Check offers table has data
SELECT code, discount_type, discount_value, is_active 
FROM offers 
LIMIT 5;

-- Should return your created offers ✅

-- Verify old coupons table is NOT being used by new code
SELECT COUNT(*) FROM coupons;  
-- OK if empty or has old data - not used anymore
```

---

## ⏱️ Time Estimate
- **Total:** 30-45 minutes
- Creating endpoint: 5 min
- Updating book-package page: 5 min
- Updating product-order page: 5 min
- Testing: 15 min
- Debugging (if needed): 10 min

---

## 🚀 Next Steps After This Fix

1. **Add Usage Tracking** (High Priority)
   - Log each offer use to `offer_redemptions` table
   - Show usage count in ManageOffersDialog

2. **Add Features** (Medium Priority)
   - Expiry dates (`valid_until` column)
   - Usage limits (`max_uses` column)
   - Per-customer limits (`max_uses_per_customer` column)

3. **Polish UI** (Low Priority)
   - Better filters in ManageOffersDialog
   - Show offer effectiveness
   - Archive old offers instead of delete
