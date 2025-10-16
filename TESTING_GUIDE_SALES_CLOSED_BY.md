# 🧪 SALES CLOSED BY - COMPLETE TESTING GUIDE

## 🎯 TESTING OBJECTIVE
Verify that `sales_closed_by_id` is working correctly across all forms and APIs.

---

## 📋 PRE-TESTING CHECKLIST

### Step 1: Execute Database Migrations ⚠️ REQUIRED FIRST

Open **Supabase SQL Editor** and run these migrations:

#### Migration 1: Add columns to product_orders & package_bookings
```sql
-- File: ADD_SALES_CLOSED_BY_COLUMN.sql
-- (Run this if not already executed)

ALTER TABLE product_orders 
ADD COLUMN IF NOT EXISTS sales_closed_by_id UUID REFERENCES users(id);

ALTER TABLE package_bookings 
ADD COLUMN IF NOT EXISTS sales_closed_by_id UUID REFERENCES users(id);

CREATE INDEX IF NOT EXISTS idx_product_orders_sales_closed_by 
ON product_orders(sales_closed_by_id);

CREATE INDEX IF NOT EXISTS idx_package_bookings_sales_closed_by 
ON package_bookings(sales_closed_by_id);
```

#### Migration 2: Add to quotes and create relationships
```sql
-- File: ADD_SALES_CLOSED_BY_TO_QUOTES.sql

ALTER TABLE quotes 
ADD COLUMN IF NOT EXISTS sales_closed_by_id UUID REFERENCES staff(id);

ALTER TABLE product_orders
ADD COLUMN IF NOT EXISTS from_quote_id UUID REFERENCES quotes(id);

ALTER TABLE package_bookings
ADD COLUMN IF NOT EXISTS from_quote_id UUID REFERENCES quotes(id);

CREATE INDEX IF NOT EXISTS idx_quotes_sales_closed_by ON quotes(sales_closed_by_id);
CREATE INDEX IF NOT EXISTS idx_product_orders_from_quote ON product_orders(from_quote_id);
CREATE INDEX IF NOT EXISTS idx_package_bookings_from_quote ON package_bookings(from_quote_id);
```

#### Verify Migrations
```sql
-- Check if columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'product_orders' 
AND column_name IN ('sales_closed_by_id', 'from_quote_id');

SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'package_bookings' 
AND column_name IN ('sales_closed_by_id', 'from_quote_id');

SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'quotes' 
AND column_name = 'sales_closed_by_id';
```

**Expected Output**: Should show all columns exist with type `uuid` and nullable `YES`

---

## 🧪 TEST SUITE 1: CREATE PRODUCT ORDER

### Test 1.1: Basic Order Creation WITHOUT Sales Staff
**Goal**: Verify field is optional

1. Navigate to: `https://mysafawala.com/create-product-order`
2. Fill in customer details
3. Add some products
4. Scroll down to **"Sales Closed By"** section
5. **Leave it as "None"** (don't select anyone)
6. Click **"CREATE ORDER"**

**Expected Result**: ✅
- Order created successfully
- Check database:
```sql
SELECT order_number, sales_closed_by_id 
FROM product_orders 
ORDER BY created_at DESC 
LIMIT 1;
```
- `sales_closed_by_id` should be `NULL`

---

### Test 1.2: Order Creation WITH Sales Staff Selected
**Goal**: Verify staff member is saved correctly

1. Navigate to: `https://mysafawala.com/create-product-order`
2. Fill in customer details
3. Add some products
4. Scroll down to **"Sales Closed By"** section
5. **Select a staff member** from dropdown (e.g., "Rahul - Staff")
6. Click **"CREATE ORDER"**

**Expected Result**: ✅
- Order created successfully
- Check database:
```sql
SELECT 
  po.order_number, 
  po.sales_closed_by_id,
  u.name as staff_name,
  u.email as staff_email
FROM product_orders po
LEFT JOIN users u ON u.id = po.sales_closed_by_id
ORDER BY po.created_at DESC 
LIMIT 1;
```
- `sales_closed_by_id` should have a UUID
- `staff_name` and `staff_email` should show the selected staff member

---

### Test 1.3: Staff Dropdown Shows Correct People
**Goal**: Verify franchise isolation

1. Navigate to: `https://mysafawala.com/create-product-order`
2. Scroll to **"Sales Closed By"** section
3. Click the dropdown

**Expected Result**: ✅
- Shows "None" option
- Shows only staff members from YOUR franchise
- Shows staff role next to name (e.g., "Admin" or "Staff")
- Does NOT show staff from other franchises (if you're not super admin)

**Super Admin Test**:
- If you're super admin, should see staff from ALL franchises

---

### Test 1.4: Changing Staff Member
**Goal**: Verify you can change selection

1. Navigate to: `https://mysafawala.com/create-product-order`
2. Select **Staff Member A** from dropdown
3. Change to **Staff Member B**
4. Create order

**Expected Result**: ✅
- Database shows Staff Member B (not A)

---

## 🧪 TEST SUITE 2: BOOK PACKAGE

### Test 2.1: Package Booking WITHOUT Sales Staff
1. Navigate to: `https://mysafawala.com/book-package`
2. Fill in details
3. Leave **"Sales Closed By"** as "None"
4. Submit

**Expected Result**: ✅
```sql
SELECT 
  package_number, 
  sales_closed_by_id 
FROM package_bookings 
ORDER BY created_at DESC 
LIMIT 1;
```
- `sales_closed_by_id` should be `NULL`

---

### Test 2.2: Package Booking WITH Sales Staff
1. Navigate to: `https://mysafawala.com/book-package`
2. Fill in details
3. **Select a staff member** from "Sales Closed By"
4. Submit

**Expected Result**: ✅
```sql
SELECT 
  pb.package_number, 
  pb.sales_closed_by_id,
  u.name as staff_name
FROM package_bookings pb
LEFT JOIN users u ON u.id = pb.sales_closed_by_id
ORDER BY pb.created_at DESC 
LIMIT 1;
```
- Shows correct staff member

---

## 🧪 TEST SUITE 3: BOOKINGS API

### Test 3.1: Fetch Bookings with Sales Staff
**Goal**: Verify API returns sales staff data

**Test via Browser Console**:
1. Open: `https://mysafawala.com/bookings`
2. Open Browser DevTools (F12)
3. Go to **Network** tab
4. Refresh page
5. Find request to `/api/bookings`
6. Click on it and view **Response**

**Expected Result**: ✅
```json
{
  "bookings": [
    {
      "id": "uuid",
      "booking_number": "ORD12345",
      "customer": {...},
      "sales_closed_by_id": "uuid-of-staff",  // ← Should be present
      "quote": {
        "sales_closed_by_id": "uuid",
        "sales_staff": {
          "id": "uuid",
          "name": "Staff Name"
        }
      }
    }
  ]
}
```

**Test via API Direct Call**:
```bash
# In terminal
curl -X GET "https://mysafawala.com/api/bookings" \
  -H "Cookie: safawala_session=YOUR_SESSION_COOKIE"
```

---

### Test 3.2: Verify Quote Relationship
**Goal**: Test from_quote_id linkage

1. Create a quote first
2. Convert quote to order
3. Check database:
```sql
SELECT 
  po.order_number,
  po.from_quote_id,
  q.quote_number,
  q.sales_closed_by_id as quote_sales_staff,
  po.sales_closed_by_id as order_sales_staff
FROM product_orders po
LEFT JOIN quotes q ON q.id = po.from_quote_id
WHERE po.from_quote_id IS NOT NULL
ORDER BY po.created_at DESC
LIMIT 5;
```

**Expected Result**: ✅
- `from_quote_id` links to quote
- Both quote and order can have `sales_closed_by_id`

---

## 🧪 TEST SUITE 4: EDGE CASES

### Test 4.1: Staff Member Deleted
**Goal**: Ensure system doesn't break if staff is deleted

1. Create order with Staff Member A
2. In database, delete or deactivate Staff Member A:
```sql
-- Don't actually delete, just test query
SELECT 
  po.order_number,
  po.sales_closed_by_id,
  u.name,
  u.is_active
FROM product_orders po
LEFT JOIN users u ON u.id = po.sales_closed_by_id
WHERE po.sales_closed_by_id IS NOT NULL;
```

**Expected Result**: ✅
- Order still displays (doesn't crash)
- Shows NULL or "Deleted User" gracefully

---

### Test 4.2: Multiple Orders Same Staff
**Goal**: Test reporting capability

```sql
-- Count orders by sales staff
SELECT 
  u.name as staff_name,
  u.role,
  COUNT(po.id) as total_orders,
  SUM(po.total_amount) as total_sales
FROM product_orders po
JOIN users u ON u.id = po.sales_closed_by_id
WHERE po.sales_closed_by_id IS NOT NULL
GROUP BY u.id, u.name, u.role
ORDER BY total_sales DESC;
```

**Expected Result**: ✅
- Shows sales report by staff member
- Useful for commissions/incentives

---

### Test 4.3: Franchise Isolation
**Goal**: Ensure franchise boundaries are respected

**As Franchise A User**:
```sql
-- Should only see your franchise's staff
SELECT 
  u.name,
  u.franchise_id,
  f.name as franchise_name
FROM users u
LEFT JOIN franchises f ON f.id = u.franchise_id
WHERE u.role IN ('staff', 'franchise_admin')
AND u.franchise_id = 'YOUR_FRANCHISE_ID';
```

**Expected Result**: ✅
- Only your franchise staff visible
- No cross-franchise data leak

---

## 🧪 TEST SUITE 5: UI VALIDATION

### Test 5.1: Visual Design Check
1. Navigate to create order page
2. Scroll to "Sales Closed By" section

**Checklist**: ✅
- [ ] Card has clear "Sales Closed By" title
- [ ] Dropdown is visible and clickable
- [ ] "None" is the default option
- [ ] All staff members shown with roles (Admin/Staff)
- [ ] Helper text visible: "Track which team member closed this sale for incentives"
- [ ] Section appears BEFORE submit buttons
- [ ] Professional styling matches rest of form

---

### Test 5.2: Responsive Design
1. Open create order page on:
   - Desktop (1920px width)
   - Tablet (768px width)
   - Mobile (375px width)

**Expected Result**: ✅
- Dropdown scales correctly
- Text remains readable
- Layout doesn't break

---

## 🧪 TEST SUITE 6: PERFORMANCE

### Test 6.1: Staff Dropdown Load Time
1. Open DevTools → Performance tab
2. Navigate to create order page
3. Measure time to load staff dropdown

**Expected Result**: ✅
- Loads in < 1 second
- No lag when clicking dropdown

---

### Test 6.2: Database Query Performance
```sql
-- Test index usage
EXPLAIN ANALYZE
SELECT 
  po.order_number,
  u.name
FROM product_orders po
LEFT JOIN users u ON u.id = po.sales_closed_by_id
WHERE po.sales_closed_by_id IS NOT NULL
LIMIT 100;
```

**Expected Result**: ✅
- Uses index `idx_product_orders_sales_closed_by`
- Execution time < 50ms

---

## 📊 QUICK VALIDATION CHECKLIST

After running all tests, verify:

### Database
- [ ] Column exists in `product_orders`
- [ ] Column exists in `package_bookings`
- [ ] Column exists in `quotes`
- [ ] Indexes created on all tables
- [ ] Foreign keys working (no orphaned records)

### UI
- [ ] Dropdown visible in product orders page
- [ ] Dropdown visible in package bookings page
- [ ] "None" option available
- [ ] Staff list populated correctly
- [ ] Franchise isolation working

### Functionality
- [ ] Can create order without selecting staff (NULL saved)
- [ ] Can create order with staff selected (UUID saved)
- [ ] Can change staff selection before submitting
- [ ] Staff name displays in reports/API

### API
- [ ] `/api/bookings` returns sales_closed_by_id
- [ ] Quote relationship data included
- [ ] Staff details joined correctly

---

## 🐛 TROUBLESHOOTING

### Issue 1: "Column does not exist"
**Solution**: Run migrations first (see Step 1)

### Issue 2: Staff dropdown is empty
**Possible Causes**:
- No staff members in your franchise
- Franchise isolation issue
- User role not 'staff' or 'franchise_admin'

**Check**:
```sql
SELECT id, name, email, role, franchise_id, is_active
FROM users 
WHERE role IN ('staff', 'franchise_admin')
AND is_active = true;
```

### Issue 3: API doesn't return sales staff
**Solution**: Check if API enhancement was deployed
- Restart your Next.js server
- Clear browser cache
- Check API route file has latest changes

### Issue 4: Foreign key violation
**Error**: "violates foreign key constraint"
**Cause**: Staff member UUID doesn't exist in `users` table
**Solution**: Ensure selected staff exists and is active

---

## ✅ SUCCESS CRITERIA

All tests pass when:

1. ✅ Database columns exist and indexed
2. ✅ UI dropdowns load and function correctly
3. ✅ Orders save with/without staff selection
4. ✅ API returns complete data with staff details
5. ✅ Franchise isolation respected
6. ✅ No errors in browser console
7. ✅ No errors in database logs
8. ✅ Performance metrics acceptable

---

## 🎯 FINAL VALIDATION QUERY

Run this comprehensive check:

```sql
-- Final validation: Check everything works together
WITH recent_orders AS (
  SELECT 
    po.id,
    po.order_number,
    po.sales_closed_by_id,
    po.customer_id,
    po.franchise_id,
    po.total_amount,
    po.created_at
  FROM product_orders po
  ORDER BY po.created_at DESC
  LIMIT 10
)
SELECT 
  ro.order_number,
  c.name as customer_name,
  f.name as franchise_name,
  u.name as sales_staff_name,
  u.role as sales_staff_role,
  ro.total_amount,
  ro.created_at
FROM recent_orders ro
LEFT JOIN customers c ON c.id = ro.customer_id
LEFT JOIN franchises f ON f.id = ro.franchise_id
LEFT JOIN users u ON u.id = ro.sales_closed_by_id
ORDER BY ro.created_at DESC;
```

**Expected Result**: ✅
- Shows recent orders
- Customer names visible
- Franchise names visible
- Sales staff names visible (or NULL)
- No broken references

---

## 🎊 YOU'RE DONE!

If all tests pass:
- ✅ Feature is working perfectly
- ✅ Data integrity maintained
- ✅ Performance acceptable
- ✅ Ready for production use

**Status**: 🚀 **READY TO USE**

---

## 📞 NEED HELP?

If any test fails:
1. Check error messages in browser console (F12)
2. Check Supabase logs
3. Verify migrations were executed
4. Review `SALES_CLOSED_BY_AUDIT_COMPLETE.md` for implementation details

**Test completed on**: [Your Date]  
**Tester**: [Your Name]  
**Result**: [ ] ✅ All Pass  [ ] ⚠️ Some Issues  [ ] ❌ Failed
