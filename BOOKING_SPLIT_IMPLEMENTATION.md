# Booking System Architecture Split

**Date:** October 7, 2025  
**Status:** Implementation Complete

## Overview

The booking system has been split into two separate, specialized flows to better align with business operations:

1. **Product Orders** - For individual product rentals and sales
2. **Package Bookings** - For package-based bookings with variants

## Architecture

### Database Schema

#### Product Orders
```
product_orders
├── id (uuid, primary key)
├── order_number (text, unique) - Format: ORD12345678
├── customer_id (uuid, foreign key)
├── franchise_id (uuid, foreign key)
├── order_type (text) - 'rental' or 'sale'
├── event_type (text)
├── payment_type (text) - 'full', 'advance', 'partial'
├── event_date (date)
├── delivery_date (date, nullable)
├── return_date (date, nullable)
├── venue_address (text)
├── groom_name (text)
├── bride_name (text)
├── notes (text)
├── tax_amount (numeric)
├── security_deposit (numeric) - Only for rentals
├── subtotal_amount (numeric)
├── total_amount (numeric)
├── amount_paid (numeric)
├── pending_amount (numeric)
├── status (text)
├── created_at (timestamptz)
└── updated_at (timestamptz)

product_order_items
├── id (uuid, primary key)
├── order_id (uuid, foreign key -> product_orders.id)
├── product_id (uuid, foreign key)
├── quantity (integer)
├── unit_price (numeric)
├── total_price (numeric)
├── security_deposit (numeric)
├── created_at (timestamptz)
└── updated_at (timestamptz)
```

#### Package Bookings
```
package_bookings
├── id (uuid, primary key)
├── package_number (text, unique) - Format: PKG12345678
├── customer_id (uuid, foreign key)
├── franchise_id (uuid, foreign key)
├── event_type (text)
├── payment_type (text) - 'full', 'advance', 'partial'
├── event_date (date)
├── delivery_date (date, nullable)
├── return_date (date, nullable)
├── venue_address (text)
├── groom_name (text)
├── bride_name (text)
├── notes (text)
├── tax_amount (numeric)
├── subtotal_amount (numeric)
├── total_amount (numeric)
├── amount_paid (numeric)
├── pending_amount (numeric)
├── status (text)
├── created_at (timestamptz)
└── updated_at (timestamptz)

package_booking_items
├── id (uuid, primary key)
├── booking_id (uuid, foreign key -> package_bookings.id)
├── package_id (uuid, foreign key)
├── variant_id (uuid, foreign key)
├── quantity (integer)
├── unit_price (numeric)
├── total_price (numeric)
├── extra_safas (integer)
├── selected_products (jsonb) - Future: specific product selection
├── created_at (timestamptz)
└── updated_at (timestamptz)
```

### Pages & Routes

#### Product Order Flow
- **Route:** `/create-product-order`
- **File:** `app/create-product-order/page.tsx`
- **Purpose:** Create orders for individual products (rental or sale)
- **Features:**
  - Product search and selection
  - Rental vs Sale pricing toggle
  - Security deposit (rental only)
  - Quantity management
  - Payment modes: full, 50% advance, custom partial
  - GST calculation (5%)
  - Customer creation inline
  - Inserts into `product_orders` & `product_order_items`

#### Package Booking Flow
- **Route:** `/book-package`
- **File:** `app/book-package/page.tsx`
- **Purpose:** Create bookings for complete packages with variants
- **Features:**
  - Package & variant selection
  - Extra safas calculation
  - Quantity management
  - Payment modes: full, 50% advance, custom partial
  - GST calculation (5%)
  - Customer creation inline
  - Inserts into `package_bookings` & `package_booking_items`

#### Legacy (Deprecated)
- **Route:** `/create-order`
- **File:** `app/create-order/page.tsx`
- **Status:** Kept for reference, should be deprecated
- **Action:** Consider adding deprecation banner or removing after migration validation

### Navigation Updates

All navigation points have been updated to use the new split flows:

1. **Dashboard Layout Header** (`components/layout/dashboard-layout.tsx`)
   - Changed from single "Create Order" button to dropdown menu
   - Options: "Product Order" and "Package Booking"

2. **Bookings Page** (`app/bookings/page.tsx`)
   - Two separate buttons: "Create Product Order" and "Book Package"
   - Replaced `/create-order` and `/create-order?type=package` links

3. **Dashboard Quick Actions** (`app/dashboard/page.tsx`)
   - Two separate action buttons
   - Direct links to both flows

## Business Logic

### Pricing Structure

#### Product Orders
- **Rental Mode:**
  - Base rental price per product
  - Security deposit (refundable)
  - GST 5% on subtotal
  - Total = (Products × Quantity × Rental Price) + Security Deposits + GST

- **Sale Mode:**
  - Sale price per product
  - No security deposit
  - GST 5% on subtotal
  - Total = (Products × Quantity × Sale Price) + GST

#### Package Bookings
- Base package price (from `package_sets.base_price`)
- Plus variant price (from `package_variants.base_price`)
- Plus extra safas × extra safa price (from `package_sets.extra_safa_price`)
- GST 5% on subtotal
- Total = (Package Base + Variant Base + Extra Safas × Extra Safa Price) × Quantity + GST

### Payment Modes

Both flows support:
1. **Full Payment** - 100% of total amount
2. **50% Advance** - Half upfront, half pending
3. **Custom Partial** - User-specified amount with validation

### Order Numbering

- **Product Orders:** `ORD` prefix + 8 digits (timestamp-based)
  - Example: `ORD12345678`
  
- **Package Bookings:** `PKG` prefix + 8 digits (timestamp-based)
  - Example: `PKG87654321`

## Migration Path

### Database Migration
- Migration script: `MIGRATION_SPLIT_PRODUCT_AND_PACKAGE_BOOKINGS.sql`
- Creates new tables with proper indexes and triggers
- Sets up RLS policies
- Adds `updated_at` triggers

### Code Migration Status
✅ **Completed:**
- Product order page created and stable
- Package booking page created and syntax-fixed
- Navigation updated across all entry points
- No compilation errors in new implementations

⏳ **Pending:**
- User acceptance testing for both flows
- Data migration from legacy `bookings` table (if needed)
- Audit logging integration for new tables
- Deprecation or removal of legacy `/create-order` page

## Testing Checklist

### Product Order Flow
- [ ] Create rental order with single product
- [ ] Create rental order with multiple products
- [ ] Create sale order
- [ ] Verify security deposit calculation (rental only)
- [ ] Test all payment modes (full, advance, partial)
- [ ] Verify ORD* number generation
- [ ] Confirm data insertion into `product_orders` & `product_order_items`
- [ ] Test customer creation inline

### Package Booking Flow
- [ ] Create booking with basic package + variant
- [ ] Add extra safas and verify pricing
- [ ] Test quantity changes
- [ ] Test all payment modes (full, advance, partial)
- [ ] Verify PKG* number generation
- [ ] Confirm data insertion into `package_bookings` & `package_booking_items`
- [ ] Test customer creation inline

### Navigation
- [ ] Dashboard header dropdown works
- [ ] Bookings page buttons navigate correctly
- [ ] Dashboard quick actions work
- [ ] All pages compile without errors

## Future Enhancements

1. **Package Specific Products:** Currently `selected_products` in `package_booking_items` is an empty array. Future enhancement could allow selecting specific products within a package variant.

2. **Inventory Integration:** Link product orders to inventory system for real-time availability checks and automatic reservation.

3. **Audit Logging:** Add audit trail for both product orders and package bookings using the existing `audit_logs` infrastructure.

4. **Advanced Pricing:** Volume discounts, seasonal pricing, multi-day rental calculations.

5. **Package Upsells:** Suggest complementary packages or products during booking creation.

## Related Files

- `MIGRATION_SPLIT_PRODUCT_AND_PACKAGE_BOOKINGS.sql` - Database schema
- `app/create-product-order/page.tsx` - Product order UI
- `app/book-package/page.tsx` - Package booking UI
- `app/create-order/page.tsx` - Legacy unified page (deprecated)
- `components/layout/dashboard-layout.tsx` - Navigation header
- `app/bookings/page.tsx` - Bookings listing
- `app/dashboard/page.tsx` - Dashboard quick actions

## Support

For questions or issues related to this implementation:
1. Check the database migration file for schema details
2. Review the page implementations for UI/UX patterns
3. Test using the checklist above
4. Document any bugs or edge cases found

---

**Implementation Team Notes:**
- All JSX syntax errors in package booking page resolved
- Navigation successfully updated across all entry points
- Both flows compile without TypeScript errors
- Ready for user acceptance testing
