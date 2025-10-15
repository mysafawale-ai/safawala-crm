# 🎫 Comprehensive Coupon Code System - Implementation Complete

**Date:** October 15, 2025  
**Feature:** Full coupon code management system with validation, tracking, and UI integration  
**Status:** ✅ READY FOR DEPLOYMENT

---

## 📋 Table of Contents
1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [API Endpoints](#api-endpoints)
4. [UI Components](#ui-components)
5. [Integration Points](#integration-points)
6. [Usage Examples](#usage-examples)
7. [Testing Guide](#testing-guide)
8. [Deployment Steps](#deployment-steps)

---

## 🎯 Overview

This system provides a complete promotional coupon code solution with:

### ✨ Features
- **Coupon Management:** Create, edit, delete, and view all coupons
- **Discount Types:** Percentage, Flat Amount, Free Shipping
- **Validation:** Real-time coupon validation with comprehensive rules
- **Usage Tracking:** Track usage per coupon and per customer
- **Limits:** Total usage limits and per-user limits
- **Date Ranges:** Valid from/until dates
- **Franchise Isolation:** Coupons can be franchise-specific or global
- **Minimum Order Value:** Set minimum cart value requirements
- **Max Discount Caps:** Limit percentage discounts to a maximum amount
- **Active/Inactive Status:** Enable or disable coupons
- **UI Integration:** Seamlessly integrated into booking forms and totals

### 🗂️ Tables Created
1. **`coupons`** - Master coupon definitions
2. **`coupon_usage`** - Usage tracking records

### 🔌 API Routes Created
1. **`/api/coupons/validate`** (POST) - Validate and calculate discount
2. **`/api/coupons`** (GET, POST, PUT, DELETE) - CRUD operations

### 🎨 Components Created
1. **`ManageOffersDialog`** - Full coupon management UI

---

## 🗄️ Database Schema

### Table: `coupons`

```sql
CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'flat', 'free_shipping')),
    discount_value DECIMAL(10, 2) NOT NULL CHECK (discount_value >= 0),
    min_order_value DECIMAL(10, 2) DEFAULT 0,
    max_discount DECIMAL(10, 2),  -- Cap for percentage discounts
    usage_limit INTEGER,  -- NULL = unlimited
    usage_count INTEGER DEFAULT 0 NOT NULL,
    per_user_limit INTEGER,  -- How many times one customer can use
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true NOT NULL,
    franchise_id UUID REFERENCES users(id),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
```

**Indexes:**
- `idx_coupons_code` on `code`
- `idx_coupons_franchise` on `franchise_id`
- `idx_coupons_active` on `is_active`
- `idx_coupons_valid_dates` on `(valid_from, valid_until)`

### Table: `coupon_usage`

```sql
CREATE TABLE coupon_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id),
    order_id UUID,  -- Can reference product_orders or package_bookings
    order_type VARCHAR(20) CHECK (order_type IN ('product_order', 'package_booking')),
    discount_applied DECIMAL(10, 2) NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    franchise_id UUID REFERENCES users(id)
);
```

**Indexes:**
- `idx_coupon_usage_coupon` on `coupon_id`
- `idx_coupon_usage_customer` on `customer_id`
- `idx_coupon_usage_order` on `(order_id, order_type)`
- `idx_coupon_usage_franchise` on `franchise_id`

### Columns Added to Existing Tables

**`product_orders` table:**
```sql
ALTER TABLE product_orders 
ADD COLUMN coupon_code VARCHAR(50),
ADD COLUMN coupon_discount DECIMAL(10, 2) DEFAULT 0 CHECK (coupon_discount >= 0);
```

**`package_bookings` table:**
```sql
ALTER TABLE package_bookings 
ADD COLUMN coupon_code VARCHAR(50),
ADD COLUMN coupon_discount DECIMAL(10, 2) DEFAULT 0 CHECK (coupon_discount >= 0);
```

---

## 🔌 API Endpoints

### 1. Validate Coupon
**POST** `/api/coupons/validate`

Validates a coupon code and calculates the discount amount.

**Request Body:**
```json
{
  "code": "WELCOME10",
  "orderValue": 5000,
  "customerId": "uuid-optional"
}
```

**Success Response (200):**
```json
{
  "valid": true,
  "coupon": {
    "id": "uuid",
    "code": "WELCOME10",
    "description": "Welcome offer - 10% off",
    "discount_type": "percentage",
    "discount_value": 10
  },
  "discount": 500,
  "message": "Coupon applied! You saved ₹500.00"
}
```

**Error Response (200):**
```json
{
  "valid": false,
  "error": "Coupon expired",
  "message": "This coupon expired on 12/31/2024"
}
```

**Validation Rules:**
- ✅ Coupon must exist and be active
- ✅ Must belong to same franchise or be global
- ✅ Must be within valid date range
- ✅ Order value must meet minimum requirement
- ✅ Usage limit not exceeded (total and per-user)
- ✅ Discount calculated based on type
- ✅ Max discount cap applied for percentages

---

### 2. List Coupons
**GET** `/api/coupons`

Returns all coupons for the current franchise.

**Response:**
```json
{
  "coupons": [
    {
      "id": "uuid",
      "code": "WELCOME10",
      "description": "Welcome offer",
      "discount_type": "percentage",
      "discount_value": 10,
      "min_order_value": 0,
      "max_discount": 500,
      "usage_limit": 100,
      "usage_count": 23,
      "per_user_limit": 1,
      "valid_from": "2025-01-01T00:00:00Z",
      "valid_until": "2025-12-31T23:59:59Z",
      "is_active": true
    }
  ]
}
```

---

### 3. Create Coupon
**POST** `/api/coupons`

Creates a new coupon.

**Request Body:**
```json
{
  "code": "MEGA20",
  "description": "Mega sale - 20% off",
  "discount_type": "percentage",
  "discount_value": 20,
  "min_order_value": 5000,
  "max_discount": 2000,
  "usage_limit": 50,
  "per_user_limit": null,
  "valid_from": "2025-10-15",
  "valid_until": "2025-10-22",
  "is_active": true
}
```

**Success Response (201):**
```json
{
  "coupon": { /* full coupon object */ }
}
```

**Error Response (409):**
```json
{
  "error": "Coupon code already exists"
}
```

---

### 4. Update Coupon
**PUT** `/api/coupons`

Updates an existing coupon.

**Request Body:**
```json
{
  "id": "uuid",
  "is_active": false,
  "usage_limit": 75
}
```

---

### 5. Delete Coupon
**DELETE** `/api/coupons?id=uuid`

Deletes a coupon (cascades to usage records).

---

## 🎨 UI Components

### ManageOffersDialog Component

**Location:** `/components/ManageOffersDialog.tsx`

**Features:**
- ✨ Two-panel layout: Form + List
- ✨ Create new coupons
- ✨ Edit existing coupons
- ✨ Delete coupons with confirmation
- ✨ Real-time validation
- ✨ Visual indicators for active/inactive status
- ✨ Usage statistics display
- ✨ Discount type icons (Percent, Dollar, Truck)

**Usage:**
```tsx
import ManageOffersDialog from "@/components/ManageOffersDialog"

<ManageOffersDialog />
```

---

## 🔗 Integration Points

### 1. Product Order Page
**File:** `/app/create-product-order/page.tsx`

**Changes:**
- ✅ Added `coupon_code` and `coupon_discount` to formData
- ✅ Added coupon validation logic
- ✅ Added UI field with "Apply" and "Remove" buttons
- ✅ Updated totals calculation to include coupon discount
- ✅ Display coupon savings in Totals card
- ✅ Save coupon data to database
- ✅ Track coupon usage in `coupon_usage` table

**Coupon Field Location:**
After the "Discount Amount" field, before the date fields.

**Calculation Order:**
1. Subtotal (items total)
2. Manual Discount (subtracted first)
3. Coupon Discount (subtracted second)
4. GST (calculated on discounted amount)
5. Grand Total

---

### 2. Bookings Page
**File:** `/app/bookings/page.tsx`

**Changes:**
- ✅ Added "Manage Offers" button in header
- ✅ Opens ManageOffersDialog for coupon management

---

### 3. Quote Conversion API
**File:** `/app/api/quotes/convert/route.ts`

**Future Enhancement:**
When quotes are converted to bookings, coupon codes should be preserved.

---

## 💡 Usage Examples

### Example 1: Percentage Discount
```typescript
// Coupon: WELCOME10
// Type: percentage, Value: 10%, Max: ₹500
// Order Value: ₹10,000

// Calculation:
// 10% of ₹10,000 = ₹1,000
// Capped at ₹500 (max_discount)
// Final Discount: ₹500
```

### Example 2: Flat Discount
```typescript
// Coupon: FLAT200
// Type: flat, Value: ₹200
// Order Value: ₹3,000

// Calculation:
// Fixed discount: ₹200
// Final Discount: ₹200
```

### Example 3: Minimum Order Validation
```typescript
// Coupon: VIP1000
// Type: flat, Value: ₹1,000
// Min Order: ₹10,000
// Order Value: ₹8,000

// Result: INVALID
// Message: "Minimum order value of ₹10,000.00 required"
```

### Example 4: Usage Limit
```typescript
// Coupon: LIMITED50
// Usage Limit: 50
// Usage Count: 50

// Result: INVALID
// Message: "This coupon has reached its maximum usage limit"
```

---

## 🧪 Testing Guide

### Manual Testing Checklist

#### 1. Coupon Creation
- [ ] Create percentage coupon (10%)
- [ ] Create flat discount coupon (₹500)
- [ ] Create free shipping coupon
- [ ] Try creating duplicate code (should fail)
- [ ] Set min order value
- [ ] Set max discount cap
- [ ] Set usage limits
- [ ] Set date ranges

#### 2. Coupon Validation
- [ ] Apply valid coupon
- [ ] Try expired coupon
- [ ] Try inactive coupon
- [ ] Try coupon below min order value
- [ ] Try coupon at usage limit
- [ ] Try coupon for different franchise
- [ ] Apply coupon, then increase cart value
- [ ] Apply coupon with max discount cap

#### 3. Coupon Application
- [ ] Apply coupon on product order
- [ ] Apply coupon on package booking
- [ ] Apply manual discount + coupon together
- [ ] Verify totals calculation is correct
- [ ] Verify GST calculated on discounted amount
- [ ] Remove coupon and verify totals reset
- [ ] Submit order and verify coupon saved

#### 4. Usage Tracking
- [ ] Verify usage count increments
- [ ] Verify usage record created
- [ ] Check per-user limit enforcement
- [ ] Verify customer can't reuse limited coupon

#### 5. Coupon Management UI
- [ ] Edit existing coupon
- [ ] Deactivate coupon
- [ ] Delete coupon
- [ ] View usage statistics
- [ ] Filter active/inactive coupons

### Test Coupons (Sample Data)

```sql
INSERT INTO coupons (code, description, discount_type, discount_value, min_order_value, max_discount, usage_limit, valid_until, is_active)
VALUES 
  ('WELCOME10', 'Welcome offer - 10% off', 'percentage', 10, 0, 500, NULL, NOW() + INTERVAL '30 days', true),
  ('FLAT500', 'Flat ₹500 discount', 'flat', 500, 2000, NULL, 100, NOW() + INTERVAL '15 days', true),
  ('MEGA20', 'Mega sale - 20% off', 'percentage', 20, 5000, 2000, 50, NOW() + INTERVAL '7 days', true),
  ('EXPIRED', 'Expired coupon', 'percentage', 15, 0, NULL, NULL, NOW() - INTERVAL '1 day', true),
  ('INACTIVE', 'Inactive coupon', 'flat', 1000, 0, NULL, NULL, NOW() + INTERVAL '30 days', false);
```

---

## 🚀 Deployment Steps

### Step 1: Run Database Migration
```bash
# Open Supabase Dashboard
# Navigate to SQL Editor
# Copy content from: ADD_COUPON_SYSTEM.sql
# Paste and click "Run"
```

**Expected Result:**
```
✅ Tables created: coupons, coupon_usage
✅ Columns added to: product_orders, package_bookings
✅ Indexes created
✅ RLS policies enabled
```

### Step 2: Verify Migration
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('coupons', 'coupon_usage');

-- Check columns added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('product_orders', 'package_bookings') 
  AND column_name IN ('coupon_code', 'coupon_discount');

-- Check indexes
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('coupons', 'coupon_usage')
  AND indexname LIKE '%coupon%';
```

### Step 3: Test API Endpoints
```bash
# Test coupon validation
curl -X POST http://localhost:3000/api/coupons/validate \
  -H "Content-Type: application/json" \
  -d '{"code":"WELCOME10","orderValue":5000}'

# Test coupon listing
curl http://localhost:3000/api/coupons
```

### Step 4: Test UI
1. Navigate to `/bookings`
2. Click "Manage Offers" button
3. Create a test coupon
4. Navigate to `/create-product-order`
5. Add items to cart
6. Enter coupon code
7. Click "Apply"
8. Verify discount applied
9. Submit order
10. Check database for coupon usage record

### Step 5: Deploy to Production
```bash
# Commit changes
git add .
git commit -m "feat: Add comprehensive coupon code system"
git push origin main

# Run migration in production Supabase
# (Same steps as Step 1, but in production dashboard)
```

---

## 📊 Database Queries (Useful)

### Find All Active Coupons
```sql
SELECT code, description, discount_type, discount_value, usage_count, usage_limit
FROM coupons
WHERE is_active = true
  AND (valid_until IS NULL OR valid_until > NOW())
ORDER BY created_at DESC;
```

### Check Coupon Usage for Customer
```sql
SELECT 
  cu.used_at,
  c.code,
  cu.discount_applied,
  cu.order_type,
  cu.order_id
FROM coupon_usage cu
JOIN coupons c ON c.id = cu.coupon_id
WHERE cu.customer_id = 'customer-uuid-here'
ORDER BY cu.used_at DESC;
```

### Top Performing Coupons
```sql
SELECT 
  code,
  description,
  usage_count,
  COALESCE(SUM(cu.discount_applied), 0) as total_discount_given
FROM coupons c
LEFT JOIN coupon_usage cu ON cu.coupon_id = c.id
GROUP BY c.id, code, description, usage_count
ORDER BY usage_count DESC
LIMIT 10;
```

### Orders with Coupons
```sql
SELECT 
  po.order_number,
  po.coupon_code,
  po.coupon_discount,
  po.total_amount,
  c.name as customer_name
FROM product_orders po
JOIN customers c ON c.id = po.customer_id
WHERE po.coupon_code IS NOT NULL
ORDER BY po.created_at DESC;
```

---

## 🔒 Security Considerations

### RLS Policies
- ✅ Users can only view active coupons
- ✅ Franchise isolation enforced
- ✅ Only coupon creators can edit/delete their coupons
- ✅ Coupon usage records are franchise-isolated

### Validation Security
- ✅ Server-side validation only (no client-side bypass)
- ✅ All checks performed in API route
- ✅ Coupon codes stored uppercase for consistency
- ✅ Discount amounts validated against limits
- ✅ Usage tracking prevents double-counting

---

## 📝 Future Enhancements

### Potential Features
1. **Coupon Categories:** Tag coupons (Wedding, Birthday, Corporate)
2. **Product-Specific Coupons:** Apply only to certain products
3. **Bundle Coupons:** Buy X get Y discounts
4. **Referral Coupons:** Generate unique codes per customer
5. **Auto-Apply:** Best coupon applied automatically
6. **Coupon Analytics Dashboard:** Usage charts and trends
7. **Email Coupons:** Send coupons via email
8. **Social Media Integration:** Share coupons on platforms
9. **Loyalty Points:** Earn points with coupons
10. **Tiered Discounts:** Different rates based on order value

---

## 🎓 Developer Notes

### Code Organization
```
/app
  /api
    /coupons
      route.ts          # CRUD operations
      /validate
        route.ts        # Validation endpoint
  /create-product-order
    page.tsx            # Coupon application UI
  /bookings
    page.tsx            # Manage Offers button

/components
  ManageOffersDialog.tsx  # Coupon management UI

/sql
  ADD_COUPON_SYSTEM.sql   # Migration script
```

### Key Functions
- `handleApplyCoupon()` - Validates and applies coupon
- `handleRemoveCoupon()` - Removes applied coupon
- Totals calculation includes coupon discount
- Database insert saves coupon data
- Usage tracking on order creation

### State Management
```typescript
// Form state
coupon_code: string
coupon_discount: number

// UI state
couponValidating: boolean
couponError: string
```

---

## ✅ Implementation Checklist

- [x] Database migration script created
- [x] Coupons table with all fields
- [x] Coupon usage tracking table
- [x] Columns added to orders/bookings
- [x] RLS policies configured
- [x] Validation API endpoint
- [x] CRUD API endpoints
- [x] ManageOffersDialog component
- [x] Integration in product orders page
- [x] Manage Offers button on bookings page
- [x] Totals calculation updated
- [x] Usage tracking on order creation
- [x] Error handling and validation
- [x] Documentation complete

---

## 📞 Support

For issues or questions:
1. Check validation error messages
2. Verify database migration completed
3. Check browser console for errors
4. Review API responses in Network tab
5. Check Supabase logs for server errors

---

**🎉 COUPON SYSTEM READY FOR USE!**

