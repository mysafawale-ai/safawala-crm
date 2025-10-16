# 🚀 Quick Setup Guide - Delivery & Returns System

## Step-by-Step Instructions

### Step 1: Execute Database Migration

1. **Open Supabase SQL Editor**
   - Go to your Supabase project dashboard
   - Navigate to **SQL Editor** in the left sidebar

2. **Run Migration**
   - Copy the entire content of `MIGRATION_DELIVERY_RETURN_SYSTEM.sql`
   - Paste it into a new SQL query
   - Click **Run** or press `Ctrl+Enter`

3. **Verify Success**
   - You should see: ✅ Checking tables...
   - All tables should show as created
   - No error messages

### Step 2: Test Auto-Delivery Creation

**Option A: Create a Product Order (Rental)**
```sql
-- Test with a rental order
INSERT INTO product_orders (
  order_number,
  customer_id,
  franchise_id,
  order_type,
  event_date,
  delivery_date,
  return_date,
  delivery_address,
  created_by
) VALUES (
  'ORD-TEST-001',
  (SELECT id FROM customers LIMIT 1),
  (SELECT id FROM franchises LIMIT 1),
  'rental', -- This will create a return later
  CURRENT_DATE + INTERVAL '3 days',
  CURRENT_DATE + INTERVAL '2 days',
  CURRENT_DATE + INTERVAL '4 days',
  '123 Test Street, Test City',
  (SELECT id FROM users LIMIT 1)
);

-- Check if delivery was auto-created
SELECT * FROM deliveries WHERE booking_source = 'product_order' ORDER BY created_at DESC LIMIT 1;
```

**Option B: Create a Package Booking**
```sql
-- Test with a package booking (always rental)
INSERT INTO package_bookings (
  package_number,
  customer_id,
  franchise_id,
  event_date,
  delivery_date,
  return_date,
  venue_address,
  created_by
) VALUES (
  'PKG-TEST-001',
  (SELECT id FROM customers LIMIT 1),
  (SELECT id FROM franchises LIMIT 1),
  CURRENT_DATE + INTERVAL '5 days',
  CURRENT_DATE + INTERVAL '4 days',
  CURRENT_DATE + INTERVAL '6 days',
  '456 Package Test Avenue',
  (SELECT id FROM users LIMIT 1)
);

-- Check if delivery was auto-created
SELECT * FROM deliveries WHERE booking_source = 'package_booking' ORDER BY created_at DESC LIMIT 1;
```

### Step 3: Test Auto-Return Creation

```sql
-- Mark the delivery as delivered (this should auto-create a return)
UPDATE deliveries 
SET status = 'delivered'
WHERE id = (SELECT id FROM deliveries ORDER BY created_at DESC LIMIT 1);

-- Check if return was auto-created
SELECT * FROM returns ORDER BY created_at DESC LIMIT 1;

-- Verify the return has correct details
SELECT 
  r.return_number,
  r.status,
  r.booking_source,
  d.delivery_number,
  d.booking_type,
  c.name as customer_name
FROM returns r
JOIN deliveries d ON r.delivery_id = d.id
JOIN customers c ON r.customer_id = c.id
ORDER BY r.created_at DESC
LIMIT 1;
```

### Step 4: Test the APIs

**Test 1: Get All Returns**
```bash
curl http://localhost:3000/api/returns
```

**Test 2: Get Inventory Preview**
```bash
curl http://localhost:3000/api/returns/[RETURN_ID]/preview
```

**Test 3: Update Delivery Status**
```bash
curl -X PATCH http://localhost:3000/api/deliveries/[DELIVERY_ID]/status \
  -H "Content-Type: application/json" \
  -d '{"status": "in_transit", "notes": "Driver on the way"}'
```

**Test 4: Process a Return**
```bash
curl -X POST http://localhost:3000/api/returns/[RETURN_ID]/process \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "product_id": "PRODUCT_UUID",
        "qty_delivered": 5,
        "qty_returned": 3,
        "qty_damaged": 1,
        "qty_lost": 1,
        "damage_reason": "torn",
        "damage_description": "Torn during use",
        "lost_reason": "stolen"
      }
    ],
    "send_to_laundry": true,
    "notes": "Test return processing"
  }'
```

---

## 🔍 Verification Queries

### Check Deliveries
```sql
SELECT 
  delivery_number,
  booking_source,
  booking_type,
  status,
  return_created,
  delivered_at,
  created_at
FROM deliveries
ORDER BY created_at DESC
LIMIT 10;
```

### Check Returns
```sql
SELECT 
  return_number,
  status,
  total_items,
  total_returned,
  total_damaged,
  total_lost,
  send_to_laundry,
  laundry_batch_created,
  processed_at
FROM returns
ORDER BY created_at DESC
LIMIT 10;
```

### Check Return Items
```sql
SELECT 
  ri.*,
  p.name as product_name
FROM return_items ri
JOIN products p ON ri.product_id = p.id
ORDER BY ri.created_at DESC
LIMIT 10;
```

### Check Product Archive (Damaged/Lost Items)
```sql
SELECT 
  product_name,
  reason,
  quantity,
  damage_reason,
  lost_reason,
  return_id,
  archived_at
FROM product_archive
WHERE return_id IS NOT NULL
ORDER BY archived_at DESC
LIMIT 10;
```

### Check Laundry Batches (From Returns)
```sql
SELECT 
  batch_number,
  return_id,
  auto_created,
  status,
  total_items,
  created_at
FROM laundry_batches
WHERE auto_created = true
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🎯 Expected Results

### After Creating a Rental Booking:
✅ Delivery record created automatically  
✅ `booking_type` = 'rental'  
✅ `status` = 'pending'  
✅ `delivery_number` format: DEL-YYYYMMDD-00001

### After Marking Delivery as Delivered:
✅ Return record created automatically (if rental)  
✅ `return_number` format: RET-YYYYMMDD-00001  
✅ `status` = 'pending'  
✅ `delivered_at` timestamp set  
✅ `return_created` flag set to true

### After Processing Return:
✅ Return items inserted  
✅ Inventory updated (available, damaged, lost stocks)  
✅ Damaged items archived  
✅ Lost items archived  
✅ Laundry batch created (if requested)  
✅ Return status = 'completed'

---

## ⚠️ Important Notes

1. **Sales Don't Create Returns**: If you create a product_order with `order_type = 'sale'`, no return will be created when delivered.

2. **Package Bookings Always Rental**: All package_bookings are treated as rentals and will create returns.

3. **Quantity Validation**: When processing returns, ensure:
   ```
   qty_delivered = qty_returned + qty_damaged + qty_lost
   ```

4. **Required Fields**:
   - If `qty_damaged > 0`, `damage_reason` is required
   - If `qty_lost > 0`, `lost_reason` is required

5. **Inventory Impact**:
   - Returned items → Available stock (or laundry if send_to_laundry)
   - Damaged items → Damaged stock + Product Archive
   - Lost items → Reduce total stock + Product Archive

---

## 🐛 Troubleshooting

### Delivery Not Auto-Created?
1. Check if trigger exists: `SELECT * FROM pg_trigger WHERE tgname LIKE 'auto_create_delivery%';`
2. Verify booking table has correct columns
3. Check Supabase logs for errors

### Return Not Auto-Created?
1. Verify delivery `booking_type` = 'rental'
2. Check trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'auto_create_return_trigger';`
3. Ensure status transition from non-delivered to delivered

### API Errors?
1. Check Supabase connection
2. Verify table permissions
3. Check browser console for detailed errors
4. Verify table names match (returns vs rental_returns)

---

## ✨ Next Steps

Once migration and testing are complete:

1. ✅ **Update Deliveries Page UI** - Add action buttons and returns tab
2. ✅ **Build Return Processing Dialog** - Create the UI form
3. ✅ **End-to-End Testing** - Test complete workflow
4. ✅ **Deploy to Production** - After thorough testing

---

**Ready to go! Start with Step 1 and execute the migration.** 🚀
