# Quote Items Details - Complete Implementation Guide

## New Database Columns

Added to both `package_booking_items` and `product_order_items` tables:

```sql
- event_type VARCHAR - Type of event (Wedding, Corporate, etc.)
- event_date TIMESTAMP - Event date and time
- event_time TIME - Specific event time
- delivery_date TIMESTAMP - When items should be delivered
- delivery_time TIME - Specific delivery time
- return_date TIMESTAMP - When items should be returned
- return_time TIME - Specific return time
- venue_name VARCHAR - Event venue name
- venue_address TEXT - Event venue address
- distance_km DECIMAL(10,2) - Distance from warehouse to venue
- reserved_products JSONB - Array of reserved/booked products with details
```

## How to Populate When Creating Bookings

### 1. When Creating Package Bookings

In `app/book-package/page.tsx` or booking creation endpoint:

```typescript
// When creating booking items
const bookingItem = await supabase
  .from('package_booking_items')
  .insert({
    booking_id: booking.id,
    package_variant_id: variant.id,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: item.total_price,
    extra_safas: item.extra_safas || 0,
    
    // NEW: Add timing and event details
    event_type: booking.event_type,
    event_date: booking.event_date,
    event_time: booking.event_time, // HH:mm:ss format
    delivery_date: booking.delivery_date,
    delivery_time: booking.delivery_time, // HH:mm:ss format
    return_date: booking.return_date,
    return_time: booking.return_time, // HH:mm:ss format
    venue_name: booking.venue_name,
    venue_address: booking.venue_address,
    distance_km: booking.distance_km || 0,
    
    // NEW: Reserved products array
    reserved_products: JSON.stringify([
      {
        barcode: 'SW1004',
        product_name: 'Orange Leheriya',
        product_id: '...',
        quantity: 1,
        // ... other product details
      },
      // ... more reserved products
    ])
  })
```

### 2. When Creating Product Orders

In `app/create-product-order/page.tsx` or order creation endpoint:

```typescript
// When creating order items
const orderItem = await supabase
  .from('product_order_items')
  .insert({
    order_id: order.id,
    product_id: product.id,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: item.total_price,
    
    // NEW: Add timing and event details
    event_type: order.event_type,
    event_date: order.event_date,
    event_time: order.event_time,
    delivery_date: order.delivery_date,
    delivery_time: order.delivery_time,
    return_date: order.return_date,
    return_time: order.return_time,
    venue_name: order.venue_name,
    venue_address: order.venue_address,
    distance_km: order.distance_km || 0,
    
    // NEW: Reserved products
    reserved_products: JSON.stringify(
      item.reserved_products || []
    )
  })
```

## Quote View Display

The Quote View (`/quotes`) now shows:

### For Each Quote Item:
✅ **Product/Package Image** - Featured image
✅ **Quantity & Unit Price** - In blue highlight box
✅ **Event & Timing Details** (Green Section)
   - Event Date & Time
   - Delivery Date & Time  
   - Return Date & Time
   - Distance (km)

✅ **Variant Details** (Purple Section - Packages only)
   - All included items with quantities
   - Green checkmarks for each item

✅ **Reserved Products** (Red Section)
   - Product Barcode
   - Product Name
   - Quantity
   - Color-coded background

✅ **Extra Safas** (Blue Section)
   - Count of additional safas

## Customer Details

When a quote is opened, customer information is automatically fetched from:
- Customers table (`customer_id`)
- Shows: Name, Phone, Email, WhatsApp, Address, City, State, Pincode

## Search & Fetch Operations

The quote service now:

1. **Fetches Reserved Products** from:
   - `bookings_items_reserved_products` table (for package bookings)
   - `orders_items_reserved_products` table (for product orders)

2. **Fallback Logic**:
   - If `reserved_products` JSONB column is empty
   - Attempts to fetch from related tables
   - Combines both sources

3. **Customer Information**:
   - Fetches from `customers` table using `customer_id`
   - Automatically updates quote view on open

## Example Workflow

```
1. User creates Package Booking with:
   - Package variant selection
   - Reserved products (Safas, Tables, etc.)
   - Event date, delivery date, return date
   - Times for each event
   - Venue information

2. User converts to Quote (is_quote=true)

3. When viewing Quote:
   ✅ All reserved products display
   ✅ All timing details visible
   ✅ Customer info auto-fetched
   ✅ Venue and distance shown
   ✅ Complete booking details preserved
```

## Required Updates

To fully utilize this feature, update:

1. **`app/book-package/page.tsx`** - Save timing data when creating items
2. **`app/create-product-order/page.tsx`** - Save timing data for products
3. **Booking API endpoints** - Include all new fields in inserts
4. **Reserved products logic** - Ensure products are stored in JSONB or linked tables

## Notes

- All timing fields use standard SQL time formats
- Reserved products stored as JSONB for flexibility
- Fallback fetching for backward compatibility
- Customer details auto-fetched on quote open
- All fields optional (show only if populated)
