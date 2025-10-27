# ⚠️ Temporary RLS Disable - Risk Assessment & Decision Guide

## Quick Answer: YES, but with conditions

It's **acceptable to keep RLS disabled temporarily** for development/testing, but you MUST:
- ✅ Keep it ONLY in development environment
- ✅ Enable before production deployment
- ✅ Implement application-level franchise filtering
- ✅ Set a deadline to re-enable (recommend: within 1 week)
- ✅ Document the decision and timeline

---

## Risk Level Analysis

### Current State (RLS Disabled):

| Risk Factor | Level | Impact |
|-------------|-------|--------|
| Data breach between franchises | 🔴 HIGH | Franchise A can see Franchise B's bookings |
| Unauthorized modifications | 🟠 MEDIUM | Staff can edit other franchise data |
| Audit trail compromise | 🟡 LOW | All changes logged, but permissions not enforced |
| Production deployment | 🔴 CRITICAL | Cannot deploy without RLS |

### Mitigation (If Keeping Disabled):

✅ **What's Currently Protecting You:**
1. Application-level checks in APIs (authenticateRequest helper)
2. Middleware authentication (user must be logged in)
3. Frontend doesn't expose other franchise data
4. Database is not publicly accessible

❌ **What's NOT Protected:**
1. Direct database access bypasses app filters
2. Compromised API keys can access all data
3. No defense against SQL injection (if any exists)
4. Super admin can't be differentiated from regular admin

---

## When to Keep RLS Disabled

### ✅ SAFE to keep disabled:

- Development/staging environment only
- Single franchise testing
- Working on features unrelated to multi-tenancy
- Performance testing without security layer
- Database migrations and schema changes

### ❌ MUST enable immediately:

- Production environment
- Multi-franchise data exists
- Client demo or UAT testing
- Any external access
- Before going live

---

## Your Situation Assessment

Based on your codebase:

```
Current State: ✅ Safe to keep disabled temporarily
Reason: 
- Development environment (localhost:3001)
- Application-level filters active in APIs
- Working on booking flow features
- No production deployment yet

Action: Enable RLS within 7 days or before production
```

---

## Step-by-Step: Create Quotes (With RLS Disabled)

### Prerequisites Checklist

- [x] RLS disabled on package_bookings & package_booking_items
- [ ] User logged in with franchise_id set
- [ ] Customer exists in the system
- [ ] Package categories and variants created
- [ ] Products available in inventory (optional)

---

## 🎯 Complete Quote Creation Flow

### **STEP 1: Navigate to Quote Creation Page**

**Method A: From Dashboard**
```
1. Login to your CRM
2. Click "Bookings" in sidebar
3. Click "Create Package Booking" button
4. Or directly visit: http://localhost:3001/book-package
```

**Method B: Direct URL**
```
http://localhost:3001/book-package
```

---

### **STEP 2: Customer & Event Details**

**What You'll See:**
- Step 1/3: "Customer & Event Details"

**Fill Out:**

1. **Select Existing Customer** (Required)
   - Click "Select Customer" dropdown
   - Choose from existing customers
   - OR click "Add New Customer" button
   
   **If Adding New Customer:**
   ```
   - Full Name: [Customer Name]
   - Phone: [10-digit number]
   - Email: [email@example.com]
   - Pincode: [6-digit pincode]
   - City: [Auto-filled from pincode]
   - Address: [Full address]
   ```

2. **Event Details** (Required)
   ```
   - Event Date: [Select future date]
   - Event Time: [Select time]
   - Event Venue: [Venue address]
   ```

3. **Delivery & Return** (Required)
   ```
   - Delivery Date: [Before or on event date]
   - Delivery Time: [Time]
   - Return Date: [After event date]
   - Return Time: [Time]
   ```

4. **Calculate Distance**
   - System auto-calculates from customer pincode to company base pincode
   - Distance used for pricing surcharges
   - You can manually override if needed

**Validation:**
- ✅ Event date must be in future
- ✅ Delivery date <= Event date
- ✅ Return date >= Event date
- ✅ All required fields filled

**Click "Next" to proceed**

---

### **STEP 3: Package Selection**

**What You'll See:**
- Step 2/3: "Package Selection"
- Categories displayed as cards

**Process:**

1. **Browse Package Categories**
   - Click on a category card (e.g., "Wedding Packages")
   - View variants within that category

2. **Select Package Variant**
   - Click "Select" on desired variant
   - Or click "View Details" to see more info

3. **Configure Variant** (For Each Selected Item)
   ```
   - Quantity: [Number of sets]
   - Base Price: [Auto-filled from variant]
   - Distance Charge: [Auto-calculated per item based on km]
   - Extras: [Select additional items if available]
   ```

4. **Reserve Products (Optional)**
   - Click "Select Products" for the item
   - Choose specific inventory items to reserve
   - System checks availability (if validation added)
   - Click "Save Selection"
   - **Note:** Product reservation stored in `reserved_products` JSONB column

5. **Add Multiple Items**
   - Repeat for different packages/variants
   - Mix and match as needed

**Current Item Display:**
```
📦 Package Name - Variant Name
   Qty: 2 | Base: ₹4,000 | Distance: ₹200 | Extras: ₹500
   [Select Products] [Edit] [Remove]
```

**Click "Next" to proceed**

---

### **STEP 4: Review & Create Quote**

**What You'll See:**
- Step 3/3: "Review & Pricing"
- Full quote summary with calculations

**Pricing Breakdown:**

```
📊 PRICING CALCULATION:

Subtotal (Items):           ₹ 8,500
Distance Surcharge:         ₹   400
Manual Discount:            ₹  -500  [Optional]
Coupon Discount:            ₹  -300  [Optional]
                           ─────────
Subtotal after discount:    ₹ 8,100
GST (5%):                   ₹   405
                           ─────────
TOTAL:                      ₹ 8,505
Security Deposit:           ₹ 1,000
                           ─────────
GRAND TOTAL:                ₹ 9,505
```

**Payment Options:**

**Option 1: Full Payment**
```
- Amount Paid: ₹9,505 (100%)
- Balance Due: ₹0
```

**Option 2: Advance Payment**
```
- Advance %: [Select 10%, 25%, 50%, etc.]
- Amount Paid: ₹2,376 (25%)
- Balance Due: ₹7,129
```

**Option 3: Partial/Custom**
```
- Custom Amount: [Enter any amount]
- Amount Paid: ₹5,000
- Balance Due: ₹4,505
```

**Optional Fields:**

1. **Apply Manual Discount**
   ```
   - Discount Type: [Flat ₹ / Percentage %]
   - Discount Value: [Amount]
   - Reason: [Why discount given]
   ```

2. **Apply Coupon Code**
   ```
   - Coupon Code: [Enter code]
   - Click "Apply"
   - System validates and shows discount
   ```

3. **Custom Pricing Mode**
   ```
   - Enable "Custom Pricing" toggle
   - Override all prices manually
   - Enter: Subtotal, Tax, Total, Deposit, etc.
   ```

4. **Staff Assignment**
   ```
   - Assigned To: [Auto-filled with logged-in user]
   - Can change to another staff member
   ```

5. **Notes**
   ```
   - Internal Notes: [For team reference]
   - Customer Notes: [Visible to customer]
   ```

---

### **STEP 5: Save as Quote**

**Important:** This is the KEY step to create a QUOTE (not a booking)

**Click "Save as Quote" button** (NOT "Confirm Booking")

**What Happens Behind the Scenes:**

```javascript
// Frontend (app/book-package/page.tsx)
handleSubmit(asQuote = true)

// Data prepared:
{
  is_quote: true,  // ← This makes it a QUOTE
  status: 'pending',
  booking_number: 'QT-20251026-0001',
  franchise_id: '[Your franchise ID]',
  customer_id: '[Selected customer ID]',
  event_date: '2025-11-15',
  delivery_date: '2025-11-14',
  return_date: '2025-11-16',
  total_amount: 9505,
  paid_amount: 0,
  balance_amount: 9505,
  // ... all other fields
}

// Items prepared:
[
  {
    booking_id: '[Generated booking ID]',
    package_id: '[Package UUID]',
    variant_id: '[Variant UUID]',
    franchise_id: '[Your franchise ID]',
    quantity: 2,
    unit_price: 4000,
    distance_charge: 200,
    reserved_products: [{id: '...', name: '...'}], // JSONB array
    // ... other fields
  }
]

// Database Insert:
1. INSERT INTO package_bookings (...) VALUES (...)
2. INSERT INTO package_booking_items (...) VALUES (...)
```

**Success Response:**
```
✅ Quote created successfully!
Redirecting to quotes page...
```

**You'll be redirected to:**
```
/quotes
```

---

### **STEP 6: View Created Quote**

**Navigate to Quotes:**
```
Dashboard → Quotes
OR
http://localhost:3001/quotes
```

**You'll See:**
```
Quote Number: QT-20251026-0001
Customer: John Doe
Event Date: Nov 15, 2025
Total: ₹9,505
Status: Pending
Actions: [View] [Edit] [Convert to Booking] [Delete]
```

**Click "View" to see full details**

---

## 🔍 Quote vs Booking - Key Differences

| Field | Quote | Booking |
|-------|-------|---------|
| `is_quote` | `true` | `false` |
| `booking_number` | `QT-20251026-0001` | `BK-20251026-0001` |
| `status` | `pending` | `confirmed` |
| `paid_amount` | Usually `0` | > `0` |
| Purpose | Estimate/Proposal | Confirmed Order |
| Inventory Impact | None | Reserved |
| Customer Commitment | No | Yes |

---

## 📝 Data Flow Diagram

```
User Input (Frontend)
        ↓
app/book-package/page.tsx
        ↓
handleSubmit(asQuote: true)
        ↓
Supabase Client Insert
        ↓
package_bookings table
  - is_quote = true
  - franchise_id = [auto from user]
        ↓
package_booking_items table
  - booking_id = [parent booking]
  - package_id = [selected package]
  - variant_id = [selected variant]
  - franchise_id = [same as parent]
  - reserved_products = [JSONB array]
        ↓
Success → Redirect to /quotes
```

---

## 🛠️ Troubleshooting Common Issues

### Issue 1: Cannot create quote - getting error

**Check:**
```sql
-- 1. Is RLS disabled?
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('package_bookings', 'package_booking_items');

-- Should show: rowsecurity = false
```

**Solution:**
```sql
-- If still enabled, disable it:
ALTER TABLE package_bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE package_booking_items DISABLE ROW LEVEL SECURITY;
```

---

### Issue 2: "null value in column package_id violates not-null constraint"

**Check code at:**
`app/book-package/page.tsx` around lines 895 and 1060

**Should have:**
```javascript
package_id: (item.variant as any)?.package_id || null,
```

**If missing, this was fixed in previous session.**

---

### Issue 3: Quote created but items not showing

**Check:**
```sql
-- Verify items were inserted
SELECT bi.*, pb.booking_number 
FROM package_booking_items bi
JOIN package_bookings pb ON pb.id = bi.booking_id
WHERE pb.is_quote = true
ORDER BY pb.created_at DESC
LIMIT 10;
```

**If empty, check:**
- Browser console for errors
- Items array was populated before submit
- Network tab shows items data in POST request

---

### Issue 4: Cannot see reserved products in items

**Check column name in API:**
`app/api/bookings/[id]/items/route.ts`

**Should query:**
```typescript
.select('*, reserved_products')  // NOT selected_products
```

**This was fixed in previous session.**

---

### Issue 5: Distance not calculating

**Check:**
1. **Company settings has base pincode set**
   ```sql
   SELECT * FROM company_settings LIMIT 1;
   ```

2. **Customer has valid pincode**
   ```sql
   SELECT id, name, pincode FROM customers WHERE id = '[customer_id]';
   ```

3. **Distance pricing configured for variants**
   ```sql
   SELECT * FROM package_variants WHERE id = '[variant_id]';
   ```

---

## 🔐 Security Considerations (While RLS Disabled)

### Current Protection Layers:

1. **Middleware Authentication**
   - File: `middleware.ts`
   - Blocks unauthenticated requests

2. **API-Level Filtering**
   - File: `app/api/bookings/route.ts`
   - Applies franchise filter:
   ```typescript
   .eq('franchise_id', user.franchise_id)
   ```

3. **Frontend Guards**
   - Only shows data from API responses
   - No direct database access

### What's Missing (Without RLS):

❌ Database-level enforcement
❌ Protection against compromised API keys
❌ Super admin role differentiation
❌ Audit trail of policy violations

### Recommendation:

**Set a deadline to enable RLS:**
```
Target: November 2, 2025 (7 days)
Before: Production deployment
After: Quote creation flow fully tested
```

---

## 📅 RLS Re-Enable Plan

### When to Enable:

- [ ] All quote creation flows tested
- [ ] Booking creation flows tested  
- [ ] Multiple franchises created for testing
- [ ] Application-level filters verified
- [ ] Ready for production deployment

### How to Enable:

**Run this script:**
`ENABLE_PACKAGE_BOOKINGS_RLS.sql` (to be created)

Or use the manual steps in `RLS_POLICY_AUDIT_REPORT.md`

### Testing After Enable:

1. **Test as franchise_admin:**
   - Can create quotes for own franchise
   - Cannot see other franchise quotes
   - Can edit own franchise quotes

2. **Test as super_admin:**
   - Can see all quotes across franchises
   - Can edit any quote
   - Can create for any franchise

3. **Test API endpoints:**
   - `/api/bookings` filters correctly
   - `/api/bookings/[id]` respects ownership
   - `/book-package` page works without 401 errors

---

## 🎓 Best Practices

### While RLS is Disabled:

1. **Document Everything**
   - Keep this guide updated
   - Track which features tested
   - Note any workarounds

2. **Test with Real Scenarios**
   - Multiple franchises
   - Different user roles
   - Edge cases

3. **Monitor for Issues**
   - Check browser console
   - Watch API responses
   - Review database logs

4. **Plan Re-Enable Date**
   - Set calendar reminder
   - Test thoroughly before
   - Have rollback plan

### After Re-Enabling RLS:

1. **Verify All Features**
   - Run comprehensive test suite
   - Check each user role
   - Test all CRUD operations

2. **Monitor Performance**
   - RLS policies add query overhead
   - Check slow query logs
   - Optimize if needed

3. **Document Policies**
   - Keep policy definitions updated
   - Track policy changes
   - Version control SQL scripts

---

## 📞 Need Help?

**If you encounter issues:**

1. Check browser console (F12)
2. Check Supabase logs (Dashboard → Logs)
3. Run diagnostic SQL scripts:
   - `CHECK_RLS_STATUS.sql`
   - `CHECK_ALL_IDS_DETAILED.sql`
4. Review this guide's troubleshooting section

**Common Error Messages:**

| Error | Meaning | Solution |
|-------|---------|----------|
| "PGRST301" | RLS policy blocking | Disable RLS or fix policy |
| "null value violates not-null" | Missing required field | Check package_id, franchise_id |
| "column does not exist" | Schema mismatch | Update query column names |
| "foreign key violation" | Invalid reference ID | Verify related records exist |

---

## ✅ Summary

**Is it okay to keep RLS disabled temporarily?**

**YES** - For development/testing, with these conditions:
- Set a deadline (recommend: 7 days)
- Only in non-production environment
- Application-level filters active
- Enable before production deployment

**Quote Creation Steps:**
1. Navigate to `/book-package`
2. Fill customer & event details → Next
3. Select packages/variants → Configure → Next
4. Review pricing → Adjust payment/discounts
5. Click "Save as Quote" (NOT "Confirm Booking")
6. Redirected to `/quotes` to view created quote

**Key Points:**
- `is_quote: true` makes it a quote (not booking)
- Quote number format: `QT-YYYYMMDD-####`
- No inventory impact (informational only)
- Can be converted to booking later

**Security Note:**
- Currently protected by application-level filters
- RLS should be enabled before production
- Use provided scripts to check status and enable

---

**Last Updated:** October 26, 2025  
**Next Review:** Before RLS re-enable
