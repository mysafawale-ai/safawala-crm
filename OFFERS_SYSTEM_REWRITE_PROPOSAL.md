# 🔄 Coupon System - Complete Rewrite Proposal

## 📊 Current System Analysis

### ❌ Problems Identified

#### 1. **Over-Complex Database Schema**
- Too many unused fields (`min_order_value`, `max_discount`, `usage_limit`, `usage_count`, `per_user_limit`, `valid_from`, `valid_until`, `created_by`)
- `coupon_usage` tracking table never properly implemented
- RLS policies causing auth errors
- Foreign key to `users.id` for `created_by` causing failures

#### 2. **Inconsistent API Layer**
- Multiple auth approaches (RLS vs service-role)
- `/api/coupons` vs `/api/coupons/validate` endpoints use different patterns
- Error handling is inconsistent
- No proper validation of required fields

#### 3. **UI Complexity**
- ManageOffersDialog tries to show features that don't exist in database
- Edit mode partially broken (missing fields in update)
- No clear feedback on what went wrong

#### 4. **Integration Issues**
- Coupon usage tracking never saves to database
- No increment of `usage_count` on order creation
- `coupon_usage` table insertions fail silently
- Different validation flows in different pages

---

## ✨ New System Design

### 🎯 Goals
1. **Simple & Reliable** - Only essential features that actually work
2. **Franchise Isolated** - Each franchise sees only their offers
3. **Easy to Use** - Clear UI with instant feedback
4. **Properly Tracked** - Actual usage tracking that works

### 📐 New Schema (Simplified)

```sql
-- Single table for offers (no complex tracking)
CREATE TABLE offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    discount_type VARCHAR(10) NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
    discount_value NUMERIC(10,2) NOT NULL CHECK (discount_value > 0),
    is_active BOOLEAN DEFAULT true,
    franchise_id UUID NOT NULL REFERENCES franchises(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique code per franchise
    UNIQUE(code, franchise_id)
);

-- Simple tracking (actually works)
CREATE TABLE offer_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    order_type VARCHAR(20) NOT NULL CHECK (order_type IN ('product', 'package')),
    order_id UUID NOT NULL,
    discount_amount NUMERIC(10,2) NOT NULL,
    redeemed_at TIMESTAMPTZ DEFAULT NOW(),
    franchise_id UUID NOT NULL REFERENCES franchises(id)
);
```

**Key Changes:**
- ✅ Renamed `coupons` → `offers` (clearer terminology)
- ✅ Removed 12 unused columns
- ✅ `code` is now max 20 chars (easier to type)
- ✅ Added `name` field for admin-friendly labels
- ✅ Only 2 discount types: `percent` or `fixed` (removed `free_shipping`, `buy_x_get_y`)
- ✅ `is_active` toggle instead of complex date ranges
- ✅ Removed `created_by` foreign key (was breaking)
- ✅ Simple redemption tracking that actually saves

---

## 🔌 New API Structure

### `/api/offers` (CRUD)

#### GET - List offers
```typescript
// Returns all active offers for current franchise
GET /api/offers
Response: { offers: Offer[] }
```

#### POST - Create offer
```typescript
POST /api/offers
Body: {
  code: string (required, 3-20 chars, alphanumeric)
  name: string (required, 3-100 chars)
  discount_type: 'percent' | 'fixed'
  discount_value: number (required, > 0)
  is_active: boolean (default: true)
}
Response: { offer: Offer }
```

####PUT - Update offer
```typescript
PUT /api/offers
Body: {
  id: string (required)
  name?: string
  discount_value?: number
  is_active?: boolean
}
Response: { offer: Offer }
```

#### DELETE - Delete offer
```typescript
DELETE /api/offers?id=<uuid>
Response: { success: true }
```

### `/api/offers/apply` (Validation & Application)

```typescript
POST /api/offers/apply
Body: {
  code: string (required)
  order_value: number (required)
  customer_id?: string
}

Success Response: {
  valid: true,
  offer: { id, code, name, discount_type, discount_value },
  discount: number,
  message: string
}

Error Response: {
  valid: false,
  error: string
}
```

**Improvements:**
- Single validation endpoint (not `/validate`)
- Returns structured error messages
- Simpler request/response format

---

## 🎨 New UI Component

### `ManageOffersDialog.tsx` (Rewritten)

**Features:**
- ✅ Simple create form (4 fields only)
- ✅ Active/Inactive toggle (no date pickers)
- ✅ Real-time validation
- ✅ Edit in-place
- ✅ Confirm delete with usage count
- ✅ Search/filter by code or name
- ✅ Shows redemption count per offer

**Removed:**
- ❌ Complex date range pickers
- ❌ Usage limit fields
- ❌ Min order value
- ❌ Max discount cap
- ❌ Per-user limits
- ❌ Description field (use `name` instead)

---

## 📋 Implementation Plan

### Phase 1: Database Migration (15 mins)
1. Run SQL to drop old `coupons` and `coupon_usage` tables
2. Create new `offers` and `offer_redemptions` tables
3. Add indexes for performance
4. Verify schema in Supabase

### Phase 2: API Rewrite (30 mins)
1. Create `/api/offers/route.ts` (CRUD operations)
2. Create `/api/offers/apply/route.ts` (validation)
3. Remove old `/api/coupons/*` files
4. Test all endpoints with curl/Postman

### Phase 3: UI Rebuild (30 mins)
1. Rewrite `ManageOffersDialog.tsx` component
2. Update all order pages to use new `/api/offers/apply` endpoint
3. Update totals calculation to use `discount` field
4. Test create, edit, delete, apply flows

### Phase 4: Integration (20 mins)
1. Update `product_orders` and `package_bookings` tables:
   - Rename `coupon_code` → `offer_code`
   - Rename `coupon_discount` → `offer_discount`
2. Update order submission to save redemption records
3. Test end-to-end: create offer → apply to order → verify tracking

### Phase 5: Testing & Cleanup (15 mins)
1. Create 3 test offers (percent, fixed, inactive)
2. Test applying each to orders
3. Verify redemption tracking works
4. Delete old migration files and docs
5. Create new quick-start guide

**Total Time:** ~1.5-2 hours

---

## 📊 Comparison Table

| Feature | Old System | New System |
|---------|------------|------------|
| **Tables** | 2 (coupons, coupon_usage) | 2 (offers, offer_redemptions) |
| **Total Columns** | 28 across both tables | 14 across both tables |
| **Discount Types** | 4 (percentage, flat, free_shipping, buy_x_get_y) | 2 (percent, fixed) |
| **Auth Method** | RLS + service-role (conflicting) | Service-role only |
| **API Endpoints** | `/api/coupons` + `/api/coupons/validate` | `/api/offers` + `/api/offers/apply` |
| **Usage Tracking** | ❌ Never actually saves | ✅ Saves on every redemption |
| **Code Validation** | ❌ Complex regex, case-sensitive | ✅ Simple, auto-uppercase |
| **UI Fields** | 12 fields (many broken) | 4 fields (all working) |
| **Error Messages** | Generic "401 Unauthorized" | Specific "Code already exists" |
| **Franchise Isolation** | ✅ Yes (when auth works) | ✅ Yes (always) |

---

## 🚀 Migration Strategy

### Option A: Clean Slate (Recommended)
1. Drop all coupon-related tables
2. Create new offers tables
3. Deploy new API and UI
4. Staff creates offers fresh
5. **Pros:** Clean, fast, no legacy issues
6. **Cons:** Loses existing coupon data (if any)

### Option B: Data Migration
1. Export existing coupons to CSV
2. Drop old tables
3. Create new tables
4. Import transformed data
5. **Pros:** Preserves data
6. **Cons:** More complex, data might be corrupt

**Recommendation:** Go with **Option A** since current system is broken and likely has little/no valid data.

---

## ✅ Success Criteria

After rewrite, you should be able to:
1. ✅ Create an offer in < 10 seconds
2. ✅ Apply offer code to order without errors
3. ✅ See redemption count increment
4. ✅ Edit offer name/discount anytime
5. ✅ Toggle offers active/inactive
6. ✅ Delete unused offers
7. ✅ Filter offers by name/code
8. ✅ Never see "401 Unauthorized" errors

---

## 🎯 Next Steps

**Would you like me to:**
1. ✅ Create the migration SQL (drop old + create new)
2. ✅ Write the new `/api/offers` routes
3. ✅ Rewrite the ManageOffersDialog component
4. ✅ Update order pages to use new system
5. ✅ Create a simple test script

**Or:**
- Review this proposal first and suggest changes?
- Start with just the database migration?
- Focus on a specific part first?

Let me know and I'll proceed! 🚀
