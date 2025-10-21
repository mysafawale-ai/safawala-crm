# 🧪 SAFAWALA CRM - MANUAL TESTING ORDER GUIDE

## 📋 **Complete Page Testing Sequence (20+ Pages)**

Test pages in this exact order to avoid dependency errors and ensure all features work correctly.

---

## 🎯 **TESTING LEVELS**

### **Level 1: Foundation Setup** (Test First)
Pages that have NO dependencies - safe to test first

### **Level 2: Master Data** (Test Second)
Pages that require Level 1 to be complete

### **Level 3: Transactions** (Test Third)
Pages that require customers + products

### **Level 4: Operations** (Test Fourth)
Pages that require bookings/orders

### **Level 5: Reports & Admin** (Test Last)
Pages that need data from all levels

---

## 📊 **COMPLETE TESTING SEQUENCE**

---

## **LEVEL 1: FOUNDATION SETUP** ✅

### **Test 1: Login/Auth Page**
```
Path: /auth/login
When: Very first test
Requires: Nothing
Purpose: Verify authentication system

Test Cases:
□ Can log in with valid credentials
□ Invalid credentials show error
□ Session persists after refresh
□ Can log out successfully

Expected Result: ✅ Redirects to dashboard after login
```

---

### **Test 2: Franchises List Page**
```
Path: /franchises
When: After login
Requires: Nothing (root level)
Purpose: Create your first franchise

Test Cases:
□ Page loads without errors
□ "Add Franchise" button visible
□ Can see franchise list (empty or existing)
□ Can click on franchise to view details

Expected Result: ✅ List displays correctly
```

---

### **Test 3: Add New Franchise**
```
Path: /franchises/new
When: After Test 2
Requires: Nothing
Purpose: Create foundation for all other data

Test Cases:
□ Form loads with all fields
□ Can enter franchise details:
  - Name (e.g., "Safawala Delhi")
  - Code (e.g., "DEL-001")
  - Address, City, State, Pincode
  - Phone, Email
  - Owner Name
□ Form validation works (required fields)
□ "Save" button creates franchise
□ Redirects to franchise list
□ New franchise appears in list

Expected Result: ✅ Franchise created successfully
Error Check: Duplicate code should fail
```

---

### **Test 4: View Franchise Details**
```
Path: /franchises/[id]
When: After Test 3
Requires: 1 franchise created
Purpose: Verify franchise data

Test Cases:
□ Details page loads
□ All fields display correctly
□ Can edit franchise
□ Can update details
□ Changes save successfully

Expected Result: ✅ Franchise details visible and editable
```

---

### **Test 5: Settings Page**
```
Path: /settings
When: After franchise created
Requires: Franchise exists
Purpose: Configure system settings

Test Cases:
□ Page loads without errors
□ Branding tab works
□ Banking tab works
□ Distance pricing tab works
□ Terms & conditions tab works
□ All settings save properly

Expected Result: ✅ All settings configurable
```

---

## **LEVEL 2: MASTER DATA** ✅

### **Test 6: Staff List Page**
```
Path: /staff
When: After franchise exists
Requires: Franchise created (Test 3)
Purpose: Manage users/staff

Test Cases:
□ Page loads
□ "Add Staff" button visible
□ Can see staff list
□ Can search/filter staff
□ Can view staff details

Expected Result: ✅ Staff list displays
```

---

### **Test 7: Add Staff/User**
```
Path: /staff (via dialog/form)
When: After Test 6
Requires: Franchise exists
Purpose: Create users for the system

Test Cases:
□ Add staff form opens
□ Can enter:
  - Name
  - Email (unique)
  - Phone
  - Role (Admin/Manager/Staff)
  - Franchise (auto-assigned or select)
  - Password
□ Validation works
□ "Save" creates user
□ User appears in list
□ Can assign permissions

Expected Result: ✅ Staff member created
Error Check: Duplicate email should fail
```

---

### **Test 8: Customers List Page**
```
Path: /customers
When: After franchise exists
Requires: Franchise created (Test 3)
Purpose: Manage customer database

Test Cases:
□ Page loads without errors
□ "Add Customer" button visible
□ Can see customer list
□ Search/filter works
□ Pagination works
□ Can click customer to view details

Expected Result: ✅ Customer list displays
```

---

### **Test 9: Add New Customer**
```
Path: /customers/new
When: After Test 8
Requires: Franchise exists
Purpose: Create customers for bookings

Test Cases:
□ Add customer form loads
□ Can enter:
  - Customer Name
  - Phone (unique per franchise)
  - Email (optional)
  - Address
  - City, State, Pincode
  - Alternative phone
  - Notes
□ Franchise auto-assigned
□ Form validation works
□ "Save" creates customer
□ Redirects to customer list
□ New customer appears in list

Expected Result: ✅ Customer created successfully
Error Check: Duplicate phone (same franchise) should warn
```

---

### **Test 10: View Customer Details**
```
Path: /customers/[id]
When: After Test 9
Requires: 1 customer created
Purpose: Verify customer profile

Test Cases:
□ Customer details load
□ All info displays correctly
□ Can see customer history:
  - Past bookings
  - Payments
  - Outstanding balance
□ Can edit customer
□ Can add notes
□ Can view addresses

Expected Result: ✅ Customer profile complete
```

---

### **Test 11: Edit Customer**
```
Path: /customers/[id]/edit
When: After Test 10
Requires: Customer exists
Purpose: Update customer information

Test Cases:
□ Edit form loads with existing data
□ Can modify fields
□ Validation works
□ "Save" updates customer
□ Changes reflect immediately
□ Can cancel without saving

Expected Result: ✅ Customer updated successfully
```

---

### **Test 12: Inventory Categories**
```
Path: /inventory/categories
When: Before adding products
Requires: Franchise exists
Purpose: Organize products by category

Test Cases:
□ Page loads
□ "Add Category" button visible
□ Can create categories:
  - Turbans
  - Sherwani
  - Accessories
  - Shoes
  - Jewelry
□ Can edit categories
□ Can delete unused categories

Expected Result: ✅ 5-10 categories created
```

---

### **Test 13: Inventory List Page**
```
Path: /inventory
When: After categories created
Requires: Franchise + Categories (Test 12)
Purpose: Manage product inventory

Test Cases:
□ Page loads without errors
□ "Add Product" button visible
□ Category filter works
□ Search works
□ Can see product cards
□ Stock levels visible
□ Can click to view details

Expected Result: ✅ Inventory page loads (empty or with data)
```

---

### **Test 14: Add New Product**
```
Path: /inventory/add
When: After Test 13
Requires: Franchise + Categories
Purpose: Create products for bookings

Test Cases:
□ Add product form loads
□ Can enter:
  - Product Name
  - Product Code (unique)
  - Category (dropdown)
  - Rental Price
  - Sale Price
  - Security Deposit
  - Stock Available (e.g., 50)
  - Description
  - Images (upload)
  - Size, Color, Weight
  
□ **AUTO-GENERATE BARCODES** ⭐
  - Toggle switch visible
  - When ON + stock = 50:
    → Creates 50 barcoded items automatically
    → Shows success message
  - When OFF:
    → Manual barcode generation later
    
□ Validation works
□ "Save" creates product
□ Redirects to inventory list
□ New product appears
□ Stock syncs with barcode items (if enabled)

Expected Result: ✅ Product created with auto-barcodes
Error Check: Duplicate product code should fail
Error Check: Stock = 0 should warn
```

---

### **Test 15: Edit Product**
```
Path: /inventory/edit/[id]
When: After Test 14
Requires: 1 product exists
Purpose: Update product details

Test Cases:
□ Edit form loads with existing data
□ Can modify all fields
□ Can update stock (triggers barcode generation if enabled)
□ Can upload/remove images
□ Can change category
□ Changes save successfully
□ Stock sync works correctly

Expected Result: ✅ Product updated
Test: Increase stock from 50 → 100
Result: Should create 50 new barcoded items
```

---

### **Test 16: Package Sets Page**
```
Path: /sets (packages)
When: After franchise exists
Requires: Franchise
Purpose: Create rental package sets

Test Cases:
□ Page loads
□ "Add Package Set" button visible
□ Can create package:
  - Name (e.g., "Royal Groom Package")
  - Category
  - Base Price
  - Security Deposit
  - Extra Safa Price
□ Can add variants to package
□ Can add inclusions
□ Can edit/delete packages

Expected Result: ✅ 5-10 packages created
```

---

### **Test 17: Vendors Page**
```
Path: /vendors
When: After franchise exists
Requires: Franchise
Purpose: Manage vendor/supplier data

Test Cases:
□ Page loads
□ "Add Vendor" button works
□ Can create vendor
□ Can view vendor details
□ Can track purchases from vendor

Expected Result: ✅ Vendor management works
```

---

## **LEVEL 3: TRANSACTIONS** ✅

### **Test 18: Quotes List Page**
```
Path: /quotes
When: After customers + products exist
Requires: Customers (Test 9) + Products (Test 14)
Purpose: Create quotations

Test Cases:
□ Page loads
□ "Create Quote" button visible
□ Can see quote list
□ Can filter by status
□ Can search quotes

Expected Result: ✅ Quotes page loads
```

---

### **Test 19: Create New Quote**
```
Path: /quotes/new
When: After Test 18
Requires: Customers + Products/Packages
Purpose: Generate quotation for customer

Test Cases:
□ Quote form loads
□ Can select customer (dropdown)
□ Can add products/packages
□ Can set quantities
□ Can adjust pricing
□ Can add discount
□ Total calculates correctly
□ Can save as draft
□ Can convert to booking
□ Can download PDF

Expected Result: ✅ Quote created successfully
Error Check: No customer → Should show error
Error Check: No products → Should show error
```

---

### **Test 20: Bookings List Page** ⭐ **MAIN PAGE**
```
Path: /bookings
When: After customers + products exist
Requires: Customers + Products
Purpose: View all bookings (orders)

Test Cases:
□ Page loads without errors
□ Bookings display newest first (Created At DESC)
□ "Create Booking" button visible
□ Status filters work:
  - Pending
  - Confirmed
  - Delivered
  - Returned
  - Cancelled
□ Search by customer name works
□ Search by booking ID works
□ Date range filter works
□ Can see booking cards with:
  - Booking ID
  - Customer name
  - Event date
  - Total amount
  - Status badge
  - Created At timestamp
□ Icons visible:
  - View (eye icon)
  - Edit (pencil icon)
  - Delete (trash icon)

Expected Result: ✅ Bookings list displays correctly
Error Check: No sorting arrows should be visible
```

---

### **Test 21: Create Product Order**
```
Path: /create-product-order
When: After Test 20
Requires: Customers + Products
Purpose: Create rental/sale order

Test Cases:
□ Order form loads
□ Can select customer (dropdown)
  - Shows customer list
  - Search works
  - Can create new customer inline
  
□ Can select booking type:
  - Rental
  - Sale
  
□ Can set dates:
  - Event Date
  - Delivery Date
  - Return Date (for rentals)
  - Validation: Delivery ≤ Event ≤ Return
  
□ Can add products:
  - Search products
  - Select from list
  - Set quantity
  - Quantity validation (stock available)
  
□ **BARCODE SCANNER FEATURE** ⭐
  - Barcode input field visible
  - Can scan barcode
  - Auto-adds product with qty 1
  - Shows success message
  - Item appears in list
  
□ Pricing:
  - Shows rental/sale price per item
  - Calculates subtotal
  - Can add discount (% or ₹)
  - Shows security deposit
  - Shows delivery charges
  - Grand total calculates correctly
  
□ Payment:
  - Can select payment type:
    - Full Payment
    - Advance Payment
    - Partial Payment
  - Can enter amount paid
  - Shows balance due
  
□ Additional:
  - Can add delivery address
  - Can add notes
  - Can upload files
  
□ Validation:
  - Customer required
  - At least 1 product required
  - Dates required
  - Stock check works
  
□ "Create Order" button:
  - Creates product_orders entry
  - Creates order_items entries
  - Updates product stock
  - Generates invoice (if enabled)
  - Redirects to booking details
  - Shows success message

Expected Result: ✅ Product order created successfully
Error Check: No customer → Cannot proceed
Error Check: Qty > stock → Should warn
Error Check: Past dates → Should warn
```

---

### **Test 22: Create Package Booking**
```
Path: /book-package
When: After packages created
Requires: Customers + Packages + Variants
Purpose: Book complete package sets

Test Cases:
□ Package booking form loads
□ Can select customer
□ Can select package set
□ Can select variant
□ Can set quantity
□ Can add extra safas
□ Pricing calculates:
  - Base price × quantity
  - Extra safas price
  - Security deposit
  - Total
□ Can set event date
□ Can set delivery/return dates
□ Payment options work
□ "Create Booking" saves:
  - package_bookings entry
  - package_booking_items entries
  - Invoice generation
  
Expected Result: ✅ Package booking created
Error Check: No package variant → Cannot proceed
```

---

### **Test 23: View Booking Details**
```
Path: /bookings/[id]
When: After Test 21 or 22
Requires: 1 booking created
Purpose: View complete booking information

Test Cases:
□ Booking details page loads
□ Shows booking header:
  - Booking ID
  - Customer name & phone
  - Status badge
  - Created date
  
□ Shows timeline:
  - Event Date
  - Delivery Date
  - Return Date
  
□ Shows items section:
  - Product/Package list
  - Quantities
  - Prices
  - Barcodes (if applicable)
  
□ Shows pricing breakdown:
  - Subtotal
  - Discount
  - Security Deposit
  - Delivery Charges
  - Grand Total
  - Amount Paid
  - Balance Due
  
□ Shows actions:
  - Edit Booking
  - Cancel Booking
  - Generate Invoice
  - Add Payment
  - Create Delivery
  - View Invoice (if generated)
  
□ Shows history/activity log

Expected Result: ✅ All booking details visible
```

---

### **Test 24: Edit Booking**
```
Path: /bookings/[id]/edit
When: After Test 23
Requires: Booking exists
Purpose: Modify existing booking

Test Cases:
□ Edit form loads with existing data
□ Can modify:
  - Dates
  - Products/quantities
  - Pricing
  - Delivery address
  - Notes
□ Stock validation works
□ Changes save successfully
□ Updates reflect in details page
□ History logs changes

Expected Result: ✅ Booking updated successfully
Error Check: Reducing qty should work
Error Check: Increasing qty checks stock
```

---

### **Test 25: Select Products for Booking**
```
Path: /bookings/[id]/select-products
When: During booking creation/edit
Requires: Products exist
Purpose: Add products to booking

Test Cases:
□ Product selection page loads
□ Shows available products
□ Category filter works
□ Search works
□ Stock levels visible

□ **BARCODE SCANNER** ⭐
  - Barcode input field at top
  - Can scan item barcode
  - Shows item details
  - Auto-adds to booking
  - Updates quantity if scanned again
  - Shows success toast
  - Item status changes to 'booked'
  
□ Manual selection:
  - Can click product card
  - Can set quantity
  - Add to booking button works
  
□ Selected items:
  - Shows selected list
  - Can remove items
  - Can adjust quantities
  - Total updates live
  
□ "Confirm Selection" button:
  - Saves items to booking
  - Redirects to booking details

Expected Result: ✅ Products added to booking
Test: Scan barcode → Should add instantly
Test: Scan same barcode twice → Qty increases
```

---

### **Test 26: Bookings Calendar View**
```
Path: /bookings/calendar
When: After bookings exist
Requires: Bookings created
Purpose: View bookings by date

Test Cases:
□ Calendar loads
□ Shows bookings on dates
□ Can navigate months
□ Can click date to see bookings
□ Color coding by status works
□ Can create booking from calendar

Expected Result: ✅ Calendar view functional
```

---

## **LEVEL 4: OPERATIONS** ✅

### **Test 27: Invoices Page**
```
Path: /invoices
When: After bookings created
Requires: Bookings (Test 21/22)
Purpose: Manage invoices

Test Cases:
□ Invoices list loads
□ Shows all invoices
□ Can filter by status:
  - Paid
  - Unpaid
  - Partial
□ Can search by invoice number
□ Can view invoice details

□ **AUTO-GENERATE FEATURE** ⭐
  - New bookings auto-create invoices (if trigger enabled)
  - Invoice number auto-generated
  - All details populated automatically
  
□ Manual generation:
  - Can generate invoice for booking
  - Can download PDF
  - Can print
  - Can send via WhatsApp/Email
  
□ Invoice details:
  - Shows franchise branding
  - Shows customer details
  - Shows items with prices
  - Shows taxes (GST)
  - Shows payment terms
  - Shows bank details

Expected Result: ✅ Invoices generated correctly
Test: Create booking → Invoice auto-generates
```

---

### **Test 28: Deliveries Page**
```
Path: /deliveries
When: After bookings confirmed
Requires: Bookings (Test 21/22)
Purpose: Manage deliveries

Test Cases:
□ Deliveries list loads
□ "Create Delivery" button visible
□ Can create delivery:
  - Select booking
  - Set delivery date
  - Set delivery address
  - Assign driver/staff
  - Add delivery charges
  - Add notes
□ Can track delivery status:
  - Pending
  - Out for Delivery
  - Delivered
  - Failed
□ Can view delivery details
□ Can update delivery status
□ Can capture signature/photo

Expected Result: ✅ Deliveries managed properly
```

---

### **Test 29: View Delivery Details**
```
Path: /deliveries/[id]
When: After Test 28
Requires: 1 delivery created
Purpose: Track specific delivery

Test Cases:
□ Delivery details load
□ Shows booking info
□ Shows customer address
□ Shows delivery timeline
□ Shows items to deliver
□ Can update status
□ Can add delivery proof
□ Can mark as completed

Expected Result: ✅ Delivery tracking works
```

---

### **Test 30: Laundry Management**
```
Path: /laundry
When: After returns processed
Requires: Returned items
Purpose: Track laundry batches

Test Cases:
□ Laundry page loads
□ "Create Batch" button visible
□ Can create laundry batch:
  - Select returned items
  - Set batch date
  - Add vendor (if external)
  - Set expected completion
□ Can view batch status:
  - Pending
  - In Progress
  - Completed
□ Can mark items as cleaned
□ Items become available after cleaning

Expected Result: ✅ Laundry tracking works
Test: Item status: returned → in_laundry → available
```

---

### **Test 31: Expenses Page**
```
Path: /expenses
When: Anytime
Requires: Franchise
Purpose: Track business expenses

Test Cases:
□ Expenses page loads
□ "Add Expense" button visible
□ Can create expense:
  - Category (Rent, Salary, Utilities, etc.)
  - Amount
  - Date
  - Description
  - Receipt upload
  - Payment method
□ Can filter by:
  - Category
  - Date range
  - Amount range
□ Can edit/delete expenses
□ Total calculations correct

Expected Result: ✅ Expense tracking works
```

---

## **LEVEL 5: REPORTS & ADMIN** ✅

### **Test 32: Dashboard**
```
Path: /dashboard or /
When: After data exists
Requires: All master data + transactions
Purpose: Overview of business

Test Cases:
□ Dashboard loads
□ Shows key metrics:
  - Today's bookings
  - Pending deliveries
  - Outstanding payments
  - Revenue (today/month)
  - Stock alerts
□ Charts display:
  - Revenue trend
  - Booking status distribution
  - Popular products
□ Quick actions work:
  - Create Booking
  - Add Customer
  - Add Product
□ Recent activity shows
□ All widgets load correctly

Expected Result: ✅ Dashboard shows accurate data
```

---

### **Test 33: Reports Page**
```
Path: /reports
When: After transactions exist
Requires: Bookings + Payments + Inventory
Purpose: Generate business reports

Test Cases:
□ Reports page loads
□ Can select report type:
  - Sales Report
  - Inventory Report
  - Payment Report
  - Customer Report
  - Delivery Report
□ Date range selector works
□ Filters apply correctly
□ Can export to:
  - PDF
  - Excel
  - CSV
□ Data accuracy verified
□ Charts/graphs display

Expected Result: ✅ Reports generate correctly
```

---

### **Test 34: Financials Page**
```
Path: /financials
When: After payments recorded
Requires: Payments + Expenses
Purpose: Financial overview

Test Cases:
□ Financials page loads
□ Shows income:
  - From bookings
  - From payments
  - By payment method
□ Shows expenses:
  - By category
  - Total spent
□ Shows profit/loss
□ Shows outstanding amounts
□ Date filtering works
□ Export functionality works

Expected Result: ✅ Financial data accurate
```

---

### **Test 35: Sales Page**
```
Path: /sales
When: After orders exist
Requires: Product orders + Package bookings
Purpose: Sales tracking

Test Cases:
□ Sales page loads
□ Shows sales metrics:
  - Total sales
  - By product
  - By package
  - By staff member
□ Commission tracking (if enabled)
□ Can filter by date
□ Can view sale details
□ Can track targets

Expected Result: ✅ Sales tracking works
```

---

### **Test 36: Tasks Page**
```
Path: /tasks
When: Anytime
Requires: Franchise + Staff
Purpose: Task management

Test Cases:
□ Tasks page loads
□ "Add Task" button works
□ Can create task:
  - Title
  - Description
  - Assign to staff
  - Due date
  - Priority
□ Can view tasks:
  - My tasks
  - All tasks
  - By status
□ Can update task status
□ Can mark complete
□ Notifications work

Expected Result: ✅ Task management works
```

---

### **Test 37: Notifications Page**
```
Path: /notifications
When: After activity exists
Requires: Various activities
Purpose: View system notifications

Test Cases:
□ Notifications page loads
□ Shows notifications:
  - New bookings
  - Payment received
  - Delivery updates
  - Low stock alerts
  - Task assignments
□ Can mark as read
□ Can delete notifications
□ Real-time updates work
□ Filter options work

Expected Result: ✅ Notifications display correctly
```

---

### **Test 38: Attendance Page**
```
Path: /attendance
When: After staff exist
Requires: Staff (Test 7)
Purpose: Track staff attendance

Test Cases:
□ Attendance page loads
□ Can mark attendance:
  - Present
  - Absent
  - Half Day
  - Leave
□ Can view attendance history
□ Can filter by staff
□ Can filter by date
□ Monthly summary works
□ Export functionality works

Expected Result: ✅ Attendance tracking works
```

---

### **Test 39: Payroll Page**
```
Path: /payroll
When: After attendance tracked
Requires: Staff + Attendance
Purpose: Process salary payments

Test Cases:
□ Payroll page loads
□ Shows salary structure:
  - Base salary
  - Incentives
  - Deductions
  - Net salary
□ Can process payroll for month
□ Attendance integration works
□ Can generate payslips
□ Payment records created
□ Export functionality works

Expected Result: ✅ Payroll processing works
```

---

### **Test 40: Integrations Page**
```
Path: /integrations
When: Anytime
Requires: Franchise
Purpose: Connect external services

Test Cases:
□ Integrations page loads
□ Shows available integrations:
  - WooCommerce
  - WhatsApp (WATI)
  - Payment Gateways
  - SMS Gateway
□ Can configure integrations
□ Can test connections
□ Can enable/disable
□ Settings save correctly

Expected Result: ✅ Integrations configurable
```

---

### **Test 41: Admin System Health**
```
Path: /admin/system-health
When: Admin only
Requires: Admin access
Purpose: Monitor system health

Test Cases:
□ System health page loads
□ Shows metrics:
  - Database status
  - API response times
  - Error logs
  - User sessions
  - Storage usage
□ Can view logs
□ Can clear cache
□ Can run diagnostics
□ Alerts work

Expected Result: ✅ System health monitored
```

---

### **Test 42: Admin Cleanup**
```
Path: /admin/cleanup
When: Admin only
Requires: Admin access
Purpose: Database maintenance

Test Cases:
□ Cleanup page loads
□ Can remove:
  - Test data
  - Duplicate entries
  - Orphaned records
  - Old logs
□ Preview before delete works
□ Confirmation required
□ Cleanup executes successfully
□ Log of cleanup actions

Expected Result: ✅ Cleanup tools work safely
```

---

## 🎯 **QUICK TESTING CHECKLIST**

### **Day 1: Foundation (Tests 1-5)**
```
□ Login works
□ Franchise created
□ Settings configured
✅ Ready for master data
```

### **Day 2: Master Data (Tests 6-17)**
```
□ Staff created
□ 5+ customers added
□ 10+ categories created
□ 20+ products added (with auto-barcodes)
□ 5+ packages created
□ Vendors added
✅ Ready for transactions
```

### **Day 3: Transactions (Tests 18-26)**
```
□ Quotes created
□ 5+ product orders created
□ 3+ package bookings created
□ Barcode scanner tested
□ Booking details verified
□ Calendar view works
✅ Ready for operations
```

### **Day 4: Operations (Tests 27-31)**
```
□ Invoices auto-generated
□ Deliveries created
□ Laundry batches processed
□ Expenses recorded
✅ Ready for reports
```

### **Day 5: Reports & Admin (Tests 32-42)**
```
□ Dashboard displays correctly
□ Reports generate
□ Financials accurate
□ Sales tracking works
□ Tasks managed
□ Notifications working
□ Attendance tracked
□ Payroll processed
□ Integrations configured
□ Admin tools tested
✅ SYSTEM FULLY TESTED!
```

---

## ⚠️ **COMMON TESTING ERRORS & FIXES**

### **Error: "Cannot create booking"**
```
Cause: No customers or products exist
Fix: Complete Tests 9-14 first
```

### **Error: "Product out of stock"**
```
Cause: Stock_available = 0
Fix: Edit product → Set stock > 0
```

### **Error: "Barcode not found"**
```
Cause: Auto-generate not enabled or items not created
Fix: Enable auto-generate or run barcode generation
```

### **Error: "Foreign key violation - customer_id"**
```
Cause: Trying to create booking without customer
Fix: Create customer first (Test 9)
```

### **Error: "Foreign key violation - franchise_id"**
```
Cause: No franchise selected
Fix: Create franchise first (Test 3)
```

### **Error: "Invoice not generating"**
```
Cause: Trigger not installed or booking incomplete
Fix: Run AUTO_GENERATE_INVOICE_TRIGGER.sql
```

### **Error: "Barcode scanner not working"**
```
Cause: Items not in product_items table
Fix: Enable auto-generate or create items manually
```

---

## 📊 **TESTING DEPENDENCY MATRIX**

| Page | Depends On | Test Order |
|------|-----------|-----------|
| Login | Nothing | 1 |
| Franchises | Nothing | 2-4 |
| Settings | Franchises | 5 |
| Staff | Franchises | 6-7 |
| Customers | Franchises | 8-11 |
| Inventory Categories | Franchises | 12 |
| Inventory | Categories | 13-15 |
| Packages | Franchises | 16 |
| Vendors | Franchises | 17 |
| Quotes | Customers + Products | 18-19 |
| Bookings List | Customers + Products | 20 |
| Product Orders | Customers + Products | 21 |
| Package Bookings | Customers + Packages | 22 |
| Booking Details | Bookings | 23 |
| Edit Booking | Bookings | 24 |
| Select Products | Products | 25 |
| Calendar | Bookings | 26 |
| Invoices | Bookings | 27 |
| Deliveries | Bookings | 28-29 |
| Laundry | Returns | 30 |
| Expenses | Franchises | 31 |
| Dashboard | All Data | 32 |
| Reports | Transactions | 33 |
| Financials | Payments | 34 |
| Sales | Orders | 35 |
| Tasks | Staff | 36 |
| Notifications | Activities | 37 |
| Attendance | Staff | 38 |
| Payroll | Attendance | 39 |
| Integrations | Franchises | 40 |
| System Health | Admin | 41 |
| Cleanup | Admin | 42 |

---

## ✅ **TESTING COMPLETION CRITERIA**

Mark each section complete when:

**Foundation:** ✅
- [ ] 1 franchise created
- [ ] Settings configured
- [ ] Can log in/out

**Master Data:** ✅
- [ ] 3+ staff members
- [ ] 10+ customers
- [ ] 20+ products with auto-barcodes
- [ ] 5+ packages
- [ ] All categories created

**Transactions:** ✅
- [ ] 5+ product orders
- [ ] 3+ package bookings
- [ ] Barcode scanner works
- [ ] Invoices auto-generate

**Operations:** ✅
- [ ] Deliveries tracked
- [ ] Returns processed
- [ ] Laundry managed
- [ ] Expenses recorded

**Reports:** ✅
- [ ] Dashboard accurate
- [ ] All reports generate
- [ ] Exports work
- [ ] Data validated

---

## 🎓 **TESTING BEST PRACTICES**

1. **Always follow the order** - Don't skip levels
2. **Use test data first** - Don't use production data initially
3. **Document errors** - Note any issues you find
4. **Test edge cases** - Try invalid inputs
5. **Verify auto-features**:
   - Auto-generate barcodes
   - Auto-generate invoices
   - Auto-sync quantities
6. **Check validations** - Try to break the forms
7. **Test permissions** - Try with different user roles
8. **Mobile testing** - Test responsive design
9. **Performance** - Check loading times
10. **Data integrity** - Verify totals and calculations

---

## 📞 **TESTING SUPPORT**

If you encounter issues:

1. **Check dependencies** - Did you complete required tests?
2. **Verify data** - Do required records exist?
3. **Console logs** - Check browser console (F12)
4. **Network tab** - Check API responses
5. **Database** - Verify data in Supabase

---

**🎉 READY TO TEST! Follow this order exactly and you'll catch all errors!**

**Created: October 2025**  
**Pages Covered: 42+**  
**Testing Time: 5 days**  
**Status: Complete Testing Guide**
