# ❌ Manage Offers - Missing Features & Issues

## Overview
The Manage Offers system has been **simplified but incompletely integrated**. The old complex coupon system was replaced with a simpler offers table, but several critical features are still missing for a complete working system.

---

## 🔴 CRITICAL MISSING FEATURES

### 1. **No Validation Endpoint for Offers**
**Problem:** Offers cannot be applied because there's no validation endpoint

#### Current State:
- ✅ `/api/coupons/validate` exists (old coupon system)
- ❌ `/api/offers/validate` **DOES NOT EXIST**
- ❌ Product order and package booking pages still reference `/api/coupons/validate`
- ❌ System tries to validate against `coupons` table which still exists but is outdated

**In Code:**
```typescript
// app/book-package/page.tsx and app/create-product-order/page.tsx call:
const response = await fetch('/api/coupons/validate', {
  method: 'POST',
  body: JSON.stringify({
    code: formData.coupon_code,
    orderValue: totals.subtotalAfterDiscount,
    customerId: selectedCustomer?.id,
  }),
})
```

**What's Missing:**
- ❌ No `/api/offers/validate` endpoint to validate offer codes
- ❌ Validation still references old `coupons` table schema
- ❌ Order pages don't know about the new simplified `offers` table

---

### 2. **Two Competing Systems**
**Problem:** Both `coupons` and `offers` tables exist

#### Database State:
```sql
-- OLD SYSTEM (still exists)
table: coupons
table: coupon_usage

-- NEW SYSTEM (partially created)
table: offers
table: offer_redemptions
```

#### Issues:
- ❌ UI uses ManageOffersDialog (points to `offers` table)
- ❌ Validation uses old `/api/coupons/validate` (points to `coupons` table)
- ❌ Order pages don't know which table to use
- ❌ Manual redemption tracking not implemented
- ❌ Migration created `offers` table but didn't update all code

**Duplicate Data Problem:**
```
Scenario: Staff creates 5 offers via ManageOffersDialog
✅ Saves to: offers table
❌ Validation reads from: coupons table
❌ Offers are invisible to the system!
```

---

### 3. **Usage Tracking Not Implemented**
**Problem:** `offer_redemptions` table exists but is never used

#### Current State:
```sql
-- Table exists but is never populated
CREATE TABLE offer_redemptions (
    id UUID PRIMARY KEY,
    offer_id UUID NOT NULL,
    customer_id UUID,
    order_type VARCHAR(20) NOT NULL,
    order_id UUID NOT NULL,
    discount_amount NUMERIC(10,2) NOT NULL,
    redeemed_at TIMESTAMPTZ DEFAULT NOW(),
    franchise_id UUID NOT NULL
);
```

**Missing Implementation:**
- ❌ No API endpoint to log a redemption
- ❌ No API endpoint to get usage stats per offer
- ❌ No code in order pages to track when offer is applied
- ❌ UI has no way to show "times used" for each offer
- ❌ ManageOffersDialog doesn't display usage statistics

---

### 4. **Limited Offer Features**
**Problem:** Current offers are too simplistic

#### What Offers CAN'T Do:
- ❌ Minimum order value requirements
- ❌ Maximum usage limits (prevent over-discounting)
- ❌ Expiry dates (offers never expire)
- ❌ Per-customer usage limits (customer can use unlimited times)
- ❌ Limited to basic discount types (no free shipping, no BOGO, etc.)

#### Current Offer Structure:
```typescript
interface Offer {
  id: UUID;
  code: string;                    // ✅
  name: string;                    // ✅
  discount_type: 'percent'|'fixed';// ✅
  discount_value: number;          // ✅
  is_active: boolean;              // ✅
  franchise_id: UUID;              // ✅
  created_at: TIMESTAMPTZ;         // ✅
  // MISSING:
  min_order_value: ❌ NONE
  valid_until: ❌ NONE
  usage_limit: ❌ NONE
  per_user_limit: ❌ NONE
  max_discount: ❌ NONE
}
```

---

### 5. **API Endpoint Gaps**

#### Existing Endpoints:
- ✅ `GET /api/offers` - List offers
- ✅ `POST /api/offers` - Create offer  
- ✅ `PUT /api/offers` - Update offer
- ✅ `DELETE /api/offers` - Delete offer
- ✅ `GET /api/offers/apply` - Apply an offer (but references old coupons table!)

#### Missing Endpoints:
- ❌ `POST /api/offers/validate` - Validate offer code (new endpoint needed!)
- ❌ `GET /api/offers/:id/usage` - Get usage statistics
- ❌ `GET /api/offer-redemptions` - View redemption history
- ❌ `POST /api/offer-redemptions` - Log a redemption
- ❌ `POST /api/offers/:id/redeem` - Track redemption + apply discount

---

### 6. **UI Component Issues**

#### ManageOffersDialog.tsx:
- ✅ Shows form for basic offer creation
- ✅ Can list active offers
- ❌ No search/filter functionality for inactive offers
- ❌ No display of usage count per offer
- ❌ No expiry date indicators
- ❌ No manual usage statistics
- ❌ Limited pagination (max-h-96 scroll)

#### Order Pages (book-package & create-product-order):
- ✅ Show coupon input field
- ❌ Try to validate against wrong endpoint (`/api/coupons/validate`)
- ❌ Try to apply coupons from wrong table (`coupons` not `offers`)
- ❌ Don't track redemptions
- ❌ No usage limits enforced

---

### 7. **Integration Broken**

#### Problem Flow:
```
1. Admin creates offer via ManageOffersDialog
   ✅ Saves to: offers table

2. Customer tries to apply coupon code
   ❌ API calls: /api/coupons/validate
   ❌ Looks in: coupons table
   ❌ Finds: NOTHING (offers are in different table)

3. Customer gets error: "Invalid coupon code"
4. Even though the offer exists!
```

#### Actual Endpoints Being Called:
```typescript
// What the order pages do:
fetch('/api/coupons/validate', {
  method: 'POST',
  body: JSON.stringify({ code, orderValue, customerId })
})

// What they should do:
fetch('/api/offers/validate', {
  method: 'POST',
  body: JSON.stringify({ code, orderValue, customerId })
})
```

---

## 📋 What's Actually Missing

### 🔴 Critical (System Broken):
1. **Create `/api/offers/validate` endpoint**
   - Query `offers` table instead of `coupons`
   - Return discount amount
   - Handle both 'percent' and 'fixed' discount types

2. **Update order pages to use new endpoint:**
   - `app/book-package/page.tsx` - Line ~1018
   - `app/create-product-order/page.tsx` - Line ~775
   - Change from `/api/coupons/validate` → `/api/offers/validate`

3. **Implement redemption tracking:**
   - When offer is applied, log to `offer_redemptions` table
   - Track: offer_id, customer_id, order_id, discount_amount

### 🟠 High (Missing Features):
4. **Add usage statistics to ManageOffersDialog:**
   - Show how many times each offer was used
   - Query `offer_redemptions` table for stats

5. **Add expiry/limit validation:**
   - Either add columns for `valid_until`, `usage_limit`, etc. (Database migration)
   - Or update validation logic to enforce basic limits

6. **Create `/api/offer-redemptions` endpoint:**
   - Log redemptions when orders are created
   - Retrieve usage statistics

### 🟡 Medium (Polish):
7. Add filters to ManageOffersDialog
8. Show offer effectiveness stats
9. Better error messages
10. Archive old offers instead of deleting

---

## 🔍 Files That Need Updates

### Database (Optional but recommended):
- [ ] Extend `offers` table with: `valid_until`, `usage_limit`, `per_user_limit`, `min_order_value`
- [ ] Add migration script

### Backend (REQUIRED):
- [ ] **Create:** `app/api/offers/validate/route.ts` (NEW - validate offers)
- [ ] **Create:** `app/api/offer-redemptions/route.ts` (NEW - log usage)
- [ ] **Update:** `app/api/offers/apply/route.ts` (if exists - use new tables)

### Frontend (REQUIRED):
- [ ] **Update:** `app/book-package/page.tsx` (change `/api/coupons/validate` → `/api/offers/validate`)
- [ ] **Update:** `app/create-product-order/page.tsx` (same change)
- [ ] **Update:** `components/ManageOffersDialog.tsx` (add usage stats display)

### Documentation:
- [ ] Update COUPON_QUICK_START.md to reference offers instead
- [ ] Delete outdated COUPON_SYSTEM_COMPLETE.md

---

## 💡 Recommended Fix Priority

### Phase 1 (Fix Broken Functionality) - 2-3 hours:
1. Create `/api/offers/validate` endpoint
2. Update order pages to call new endpoint
3. Test offer application workflow

### Phase 2 (Track Usage) - 1-2 hours:
4. Create `/api/offer-redemptions` POST endpoint
5. Update order creation pages to log redemptions
6. Update ManageOffersDialog to show usage counts

### Phase 3 (Polish) - 1 hour:
7. Add features like expiry dates, usage limits, etc.
8. Better error messages and UX

---

## ⚠️ Current Blockers

1. **Offers won't apply** - No validation endpoint for new `offers` table
2. **Old coupon system interferes** - Both tables exist, causing confusion
3. **No usage tracking** - Can't see how many times offers are used
4. **Order pages outdated** - Still reference old API endpoints

---

## 🎯 Quick Test to Verify Issue

```bash
# 1. Create an offer via UI
# Click "Manage Offers" → Create "TEST10" (10% off)

# 2. Try to apply it
# Go to book-package, enter "TEST10" in coupon field

# 3. What happens?
# ❌ ERROR: "Invalid coupon code"
# Why? Because /api/coupons/validate looks in coupons table, not offers!
```
