# ✅ FRANCHISES PAGE - MANUAL TESTING CHECKLIST

## 📋 **Test Information**

**Page:** `/franchises`  
**Test Order:** Test #2 (After Login)  
**Role Required:** `super_admin` only  
**Server:** Running on http://localhost:3001  
**Prerequisites:** User must be logged in

---

## 🎯 **TEST CASES**

### **✅ Test 1: Page Loads Without Errors**

**Steps:**
```
1. Open browser
2. Navigate to: http://localhost:3001/franchises
3. Wait for page to load
4. Check browser console (F12) for errors
```

**Expected Results:**
```
✅ Page loads successfully
✅ No console errors (red messages)
✅ Page title shows: "Franchise Management"
✅ Subtitle shows: "Manage and monitor all franchise locations"
✅ DashboardLayout wrapper renders
✅ Loading spinner appears briefly, then content loads
```

**What to Check in Console:**
```
✅ [Franchises] Starting to fetch franchises via API...
✅ [Franchises] ✅ Raw franchise data: [...]
✅ [Franchises] Number of franchises: X
✅ [Franchises] ✅ Transformed franchises: [...]
❌ NO red error messages
```

**Potential Errors & Fixes:**
```
❌ Error: "Authentication required" 
   → Solution: Log in first with super_admin account

❌ Error: "Access denied - Super Admin only"
   → Solution: Current user must have role = "super_admin"

❌ Error: "Failed to load franchises"
   → Solution: Check database connection
   → Check /api/franchises endpoint works

❌ Redirects to /dashboard
   → Solution: User role is not super_admin
   → Only super_admin can access this page
```

---

### **✅ Test 2: "Add Franchise" Button Visible**

**Steps:**
```
1. Page loaded successfully
2. Look at top-right corner
3. Find the "Add Franchise" button
```

**Expected Results:**
```
✅ Button visible in header section
✅ Button text: "Add Franchise"
✅ Button has Plus (+) icon
✅ Button is clickable
✅ Button has blue/primary color
```

**Click Test:**
```
1. Click "Add Franchise" button
2. Dialog/modal should open
3. Dialog title: "Add New Franchise"
4. Form fields visible
```

**Form Fields Should Include:**
```
✅ Franchise Name (required)
✅ Location (required)
✅ Address (required, textarea)
✅ Contact Person (required)
✅ Phone (required)
✅ Email (required)
✅ Pincode
✅ GST Number
✅ Is Active (toggle switch, default ON)
```

**Form Actions:**
```
✅ "Add Franchise" button (submit)
✅ "Cancel" button (close dialog)
✅ X button (close dialog)
✅ Can type in all fields
✅ Required fields marked with *
```

---

### **✅ Test 3: Can See Franchise List**

**Scenario A: Empty State (No Franchises)**
```
If database has 0 franchises:

Expected Display:
✅ Empty state message or empty grid
✅ No franchise cards visible
✅ Summary stats show 0:
   - Total Franchises: 0
   - Active Franchises: 0
   - Total Customers: 0
   - Total Revenue: ₹0
✅ Search bar still visible
✅ "Add Franchise" button still visible
```

**Scenario B: With Existing Franchises**
```
If database has franchises:

Expected Display:
✅ Franchise cards appear in grid layout
✅ Each card shows:
   - Franchise name (heading)
   - Location (city/state)
   - Contact person name
   - Phone number
   - Email address
   - Status badge (Active/Inactive)
   - GST number (if available)
   - Action buttons (View, Edit)

Card Visual Elements:
✅ Building icon at top
✅ Status badge (green = active, gray = inactive)
✅ MapPin icon for location
✅ Phone icon for phone
✅ Mail icon for email
✅ Eye icon button (View)
✅ Edit icon button (Edit)
```

**Summary Statistics (Top Cards):**
```
✅ Card 1: Total Franchises
   - Shows count
   - Building icon
   
✅ Card 2: Active Franchises  
   - Shows active count
   - Users icon
   
✅ Card 3: Total Customers
   - Shows customer count across all franchises
   - DollarSign icon (placeholder)
   
✅ Card 4: Total Revenue
   - Shows revenue sum
   - Package icon (placeholder)
```

---

### **✅ Test 4: Can Click on Franchise to View Details**

**Steps:**
```
1. Find a franchise card in the list
2. Locate the "View" button (Eye icon)
3. Click the "View" button
```

**Expected Results:**
```
✅ View dialog opens
✅ Dialog title: "Franchise Details"
✅ Shows complete franchise information:
   
   Basic Info:
   ✅ Franchise Name
   ✅ Location
   ✅ Full Address
   ✅ Status (Active/Inactive badge)
   
   Contact Info:
   ✅ Contact Person
   ✅ Phone Number
   ✅ Email Address
   ✅ GST Number (if available)
   
   Timestamps:
   ✅ Created At (formatted date)
   
   Actions:
   ✅ "Close" button works
   ✅ X button closes dialog
   ✅ Clicking outside closes dialog
```

---

## 🧪 **ADDITIONAL TEST CASES**

### **Test 5: Search Functionality**

**Steps:**
```
1. Page has multiple franchises
2. Find search bar at top
3. Type in search field
```

**Test Scenarios:**
```
Search by Name:
1. Type franchise name
2. Results filter in real-time
3. Only matching franchises show

Search by Location:
1. Type city/state name
2. Results filter by location
3. Only matching franchises show

Search by Contact Person:
1. Type contact person name
2. Results filter by contact
3. Only matching franchises show

Clear Search:
1. Clear search field
2. All franchises reappear
```

**Expected Results:**
```
✅ Real-time filtering (no submit button needed)
✅ Case-insensitive search
✅ Partial match works
✅ Multiple franchises can match
✅ "No results" state if nothing matches
```

---

### **Test 6: Edit Franchise**

**Steps:**
```
1. Find franchise card
2. Click "Edit" button (pencil icon)
3. Edit dialog opens
```

**Expected Results:**
```
✅ Dialog title: "Edit Franchise"
✅ Form pre-filled with existing data
✅ All fields editable
✅ Can modify any field
✅ "Save Changes" button visible
✅ "Cancel" button visible
```

**Edit & Save Flow:**
```
1. Modify franchise name
2. Click "Save Changes"
3. Loading state shows
4. Success toast appears: "Franchise updated successfully"
5. Dialog closes
6. Franchise list refreshes
7. Changes visible in card
```

**Validation:**
```
✅ Required fields can't be empty
✅ Email format validated
✅ Phone format validated
✅ GST number format (optional)
```

---

### **Test 7: Add New Franchise**

**Complete Add Flow:**
```
1. Click "Add Franchise" button
2. Fill in form:
   - Name: "Test Franchise Delhi"
   - Location: "Delhi"
   - Address: "123 Test Street, Delhi, India"
   - Contact Person: "John Doe"
   - Phone: "9876543210"
   - Email: "john@testfranchise.com"
   - Pincode: "110001"
   - GST Number: "29ABCDE1234F1Z5" (optional)
   - Is Active: ON
3. Click "Add Franchise"
4. Wait for response
```

**Expected Results:**
```
✅ Loading state during submission
✅ Success toast: "Franchise created successfully"
✅ Dialog closes automatically
✅ Franchise list refreshes
✅ New franchise appears in list
✅ New franchise has "Active" badge
✅ Stats update (Total Franchises +1)
```

**Error Cases:**
```
❌ Missing required field
   → Form validation prevents submit
   → Required fields highlighted

❌ Duplicate franchise code
   → Error toast: "Franchise already exists"
   → Dialog stays open
   → Can fix and retry

❌ Invalid email format
   → Error toast: "Invalid email address"
   → Dialog stays open

❌ Database error
   → Error toast: "Failed to create franchise"
   → Console shows detailed error
```

---

### **Test 8: Status Toggle (Active/Inactive)**

**In Add Form:**
```
1. Open "Add Franchise" dialog
2. Find "Is Active" toggle switch
3. Default state: ON (active)
4. Toggle OFF → Creates inactive franchise
5. Toggle ON → Creates active franchise
```

**In Edit Form:**
```
1. Edit existing franchise
2. Toggle "Is Active" switch
3. Save changes
4. Status badge updates on card
5. Active count updates in stats
```

**Expected Results:**
```
✅ Toggle switch works smoothly
✅ Visual feedback (switch moves)
✅ Active → Green badge
✅ Inactive → Gray badge
✅ Stats update accordingly
```

---

### **Test 9: Role-Based Access Control**

**Super Admin Access:**
```
Role: super_admin
✅ Can access /franchises page
✅ Can see all franchises
✅ Can add franchises
✅ Can edit franchises
✅ Can view franchise details
✅ Full access to all features
```

**Non-Super Admin Access:**
```
Role: franchise_admin, staff, or other
1. Navigate to /franchises
2. Expected: Redirects to /dashboard
3. Toast message: "Access denied - Super Admin only"
4. Cannot access page
```

**Not Logged In:**
```
Status: No session
1. Navigate to /franchises
2. Expected: Redirects to /auth/login
3. Middleware protection works
4. After login → Redirects back if super_admin
```

---

## 📊 **EXPECTED DATA FLOW**

### **On Page Load:**
```
1. Check authentication
   → getCurrentUser() from localStorage
   → If null → Redirect to /
   
2. Check role
   → If not super_admin → Redirect to /dashboard
   
3. Fetch franchises
   → GET /api/franchises
   → Response: { data: [...] }
   
4. Transform data
   → Map API response to Franchise interface
   → Set status based on is_active
   
5. Display
   → Show franchise cards
   → Update stats
   → Enable interactions
```

### **On Add Franchise:**
```
1. User fills form
2. Form validation
3. Submit → Supabase INSERT
4. Success:
   → Close dialog
   → Show success toast
   → Reload franchise list
5. Error:
   → Show error toast
   → Keep dialog open
   → Allow retry
```

### **On Edit Franchise:**
```
1. Click Edit → Load existing data
2. User modifies fields
3. Submit → Supabase UPDATE
4. Success:
   → Close dialog
   → Show success toast
   → Reload franchise list
5. Error:
   → Show error toast
   → Keep dialog open
```

---

## 🔍 **VISUAL INSPECTION CHECKLIST**

### **Layout & Design:**
```
✅ Page header aligned properly
✅ Buttons positioned correctly
✅ Cards in responsive grid (3-4 columns)
✅ Proper spacing between elements
✅ Icons aligned with text
✅ Colors match theme (blue/green/gray)
```

### **Typography:**
```
✅ Title: Large, bold
✅ Subtitle: Smaller, muted
✅ Card titles: Medium, semi-bold
✅ Labels: Small, uppercase
✅ Body text: Regular size
```

### **Interactive Elements:**
```
✅ Buttons have hover states
✅ Cards have subtle shadow
✅ Hover on cards shows elevation
✅ Icons visible and clear
✅ Status badges colored correctly
✅ Form inputs have focus states
```

### **Responsive Design:**
```
✅ Desktop (1920px): 4 cards per row
✅ Laptop (1440px): 3 cards per row
✅ Tablet (768px): 2 cards per row
✅ Mobile (375px): 1 card per row
✅ Dialog responsive on small screens
```

---

## ⚠️ **COMMON ISSUES & SOLUTIONS**

### **Issue 1: Page Blank/White Screen**
```
Cause: Authentication failed or no super_admin role
Check: Browser console for redirect logs
Solution: Log in with super_admin account
```

### **Issue 2: "Failed to Load Franchises"**
```
Cause: API error or database connection issue
Check: Network tab (F12) → /api/franchises call
Check: Response status and error message
Solution: Verify Supabase connection
Solution: Check RLS policies allow select
```

### **Issue 3: "Add Franchise" Button Not Working**
```
Cause: Dialog state not updating
Check: Browser console for errors
Solution: Refresh page and try again
Solution: Clear cache if persistent
```

### **Issue 4: Franchises Not Appearing After Creation**
```
Cause: List not refreshing
Check: Console for loadFranchises() call
Solution: Manual refresh (F5)
Solution: Check if franchise actually created in DB
```

### **Issue 5: Can't Edit Franchise**
```
Cause: Missing franchise ID or permission issue
Check: Console for error messages
Check: User role is still super_admin
Solution: Reload page and try again
```

---

## ✅ **COMPLETE TEST CHECKLIST**

### **Quick Test (5 minutes):**
```
□ Page loads without errors
□ "Add Franchise" button visible
□ Can see franchise list
□ Can click to view details
```

### **Full Test (15 minutes):**
```
□ Page loads without errors
□ Authentication check works (super_admin only)
□ "Add Franchise" button visible and clickable
□ Dialog opens with form
□ All form fields present and working
□ Can create new franchise successfully
□ New franchise appears in list
□ Can search franchises
□ Can view franchise details
□ Can edit existing franchise
□ Can toggle active/inactive status
□ Statistics update correctly
□ Role-based access enforced
□ Non-super-admin redirected
□ Console shows no errors
□ All visual elements aligned
```

### **Edge Cases (Advanced):**
```
□ Create franchise with minimal data (only required)
□ Create franchise with all fields filled
□ Create franchise with special characters in name
□ Edit and remove all optional fields
□ Toggle status multiple times
□ Search with no results
□ Search with partial matches
□ Try accessing as non-super-admin
□ Try accessing without login
□ Create franchise with duplicate name (should work)
□ Create franchise with invalid email format
```

---

## 📝 **TEST REPORT TEMPLATE**

```
=== FRANCHISES PAGE TEST REPORT ===

Date: [Date]
Tester: [Name]
Browser: [Chrome/Firefox/Safari]
Server: http://localhost:3001

TEST RESULTS:
✅ Test 1: Page Loads Without Errors - PASS/FAIL
   Notes: 

✅ Test 2: "Add Franchise" Button Visible - PASS/FAIL
   Notes:

✅ Test 3: Can See Franchise List - PASS/FAIL
   Notes:

✅ Test 4: Can Click to View Details - PASS/FAIL
   Notes:

Additional Tests:
✅ Test 5: Search Functionality - PASS/FAIL
✅ Test 6: Edit Franchise - PASS/FAIL
✅ Test 7: Add New Franchise - PASS/FAIL
✅ Test 8: Status Toggle - PASS/FAIL
✅ Test 9: Role-Based Access - PASS/FAIL

BUGS FOUND:
1. [Description]
2. [Description]

OVERALL STATUS: ✅ PASS / ❌ FAIL / ⚠️ PARTIAL

NEXT STEPS:
- [Action items]
```

---

## 🚀 **READY TO TEST!**

**Server Status:** ✅ Running on http://localhost:3001  
**Page URL:** http://localhost:3001/franchises  
**Required Role:** super_admin  
**Estimated Time:** 15-20 minutes for complete testing

**Start with:** Quick test checklist (5 minutes)  
**Then do:** Full test checklist (15 minutes)  
**Finally:** Report any issues found

---

**Created:** October 2025  
**Status:** Ready for Manual Testing  
**Test Priority:** HIGH (Level 1 - Foundation)
