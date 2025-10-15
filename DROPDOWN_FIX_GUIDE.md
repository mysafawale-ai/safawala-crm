# 🔧 COUPON SYSTEM - DROPDOWN FIX & TESTING GUIDE

## 🐛 Issue: Discount Type Dropdown Not Opening

### Problem
The discount type dropdown shows the trigger button but doesn't open when clicked inside the Manage Offers dialog.

### Root Cause Analysis
1. **Z-index stacking context** - Dialog has z-index that may conflict with Select dropdown
2. **Portal rendering** - SelectContent renders in a Portal but needs higher z-index than Dialog
3. **Position strategy** - Popper positioning may need adjustment

### Solution Applied

#### Updated SelectContent Configuration:
```tsx
<SelectContent position="popper" className="z-[100]">
  <SelectItem value="percentage">Percentage Discount (e.g., 10% off)</SelectItem>
  <SelectItem value="flat">Flat Amount Discount (e.g., ₹500 off)</SelectItem>
  <SelectItem value="buy_x_get_y">Buy X Get Y Free (e.g., Buy 2 Get 1)</SelectItem>
  <SelectItem value="free_shipping">Free Shipping</SelectItem>
</SelectContent>
```

#### Changes Made:
✅ Added `position="popper"` for better dropdown positioning  
✅ Added `className="z-[100]"` to ensure dropdown appears above dialog  
✅ Added `className="w-full"` to SelectTrigger for consistent width  
✅ All 4 discount types with descriptive examples  

---

## 🧪 Testing Instructions

### Manual UI Testing

#### Step 1: Clear Browser Cache
```bash
# Hard refresh in browser
Mac: Cmd + Shift + R
Windows: Ctrl + Shift + R
```

#### Step 2: Test Dropdown
1. Navigate to `/bookings` page
2. Click **"Manage Offers"** button
3. Look for **"Discount Type *"** field
4. Click on the dropdown trigger
5. **Expected:** Dropdown should open showing 4 options
6. **If not working:** Check browser console for errors

#### Step 3: Test All Discount Types
Create one coupon of each type:

**Test 1: Percentage Discount**
- Code: `TEST10`
- Type: Percentage Discount (e.g., 10% off)
- Percentage: `10`
- Max Cap: `500`
- Min Order: `0`
- Click "Create Coupon"
- **Expected:** Coupon appears in "Existing Coupons" panel

**Test 2: Flat Discount**
- Code: `FLAT500`
- Type: Flat Amount Discount (e.g., ₹500 off)
- Amount: `500`
- Min Order: `2000`
- Click "Create Coupon"
- **Expected:** Coupon created successfully

**Test 3: Buy X Get Y**
- Code: `BUY2GET1`
- Type: Buy X Get Y Free (e.g., Buy 2 Get 1)
- Buy Quantity: `2`
- Get Quantity: `1`
- Min Order: `1000`
- Click "Create Coupon"
- **Expected:** Shows "Buy 2 Get 1 Free" in coupon list

**Test 4: Free Shipping**
- Code: `FREESHIP`
- Type: Free Shipping
- Amount: `0`
- Min Order: `1500`
- Click "Create Coupon"
- **Expected:** Shows "Free Shipping" in coupon list

---

### API Testing (Using Script)

Run the automated test script:

```bash
cd /Applications/safawala-crm
./test-coupon-crud.sh
```

**Expected Output:**
```
🧪 COUPON SYSTEM CRUD TEST
==========================

📋 Test 1: GET /api/coupons (List all coupons)
----------------------------------------------
✅ PASS - Status: 200

📋 Test 2: POST /api/coupons (Create new coupon)
----------------------------------------------
✅ PASS - Status: 201

📋 Test 3: POST /api/coupons/validate (Validate coupon)
----------------------------------------------
✅ PASS - Status: 200

📋 Test 4: PUT /api/coupons (Update coupon)
----------------------------------------------
✅ PASS - Status: 200

📋 Test 5: DELETE /api/coupons (Delete coupon)
----------------------------------------------
✅ PASS - Status: 200
```

---

## 🔍 Troubleshooting

### Issue 1: Dropdown Still Not Opening

**Symptom:** Clicking dropdown trigger does nothing

**Solutions:**
1. **Check browser console** for JavaScript errors
2. **Verify React is loaded** - Check DevTools → Components tab
3. **Clear localStorage** - May have cached state
   ```javascript
   // Run in browser console
   localStorage.clear();
   location.reload();
   ```
4. **Check z-index hierarchy**
   ```javascript
   // Run in browser console to check z-indexes
   document.querySelectorAll('[data-radix-select-content]').forEach(el => {
     console.log('Select content z-index:', window.getComputedStyle(el).zIndex);
   });
   ```

### Issue 2: Options Not Visible But Dropdown Opens

**Symptom:** Dropdown animates but no options show

**Solutions:**
1. **Check if items are rendering:**
   ```javascript
   // Browser console
   document.querySelectorAll('[role="option"]').length
   // Should return 4 (for 4 discount types)
   ```

2. **Verify CSS not hiding items:**
   - Open DevTools → Elements
   - Find SelectContent element
   - Check `display`, `visibility`, `opacity` properties

### Issue 3: 401/500 API Errors

**Symptom:** Cannot create/list coupons, API returns errors

**Solutions:**
1. **Ensure you're logged in:**
   - Go to `/login`
   - Login with valid credentials
   - Check that `safawala_session` cookie exists

2. **Verify database migration:**
   ```sql
   -- Run in Supabase SQL Editor
   SELECT table_name FROM information_schema.tables 
   WHERE table_name IN ('coupons', 'coupon_usage');
   -- Should return both table names
   ```

3. **Check RLS policies:**
   ```sql
   -- Verify policies exist
   SELECT policyname FROM pg_policies WHERE tablename = 'coupons';
   ```

### Issue 4: Dropdown Closes Immediately

**Symptom:** Dropdown opens then closes instantly

**Solutions:**
1. **Check for event conflicts:**
   - Disable browser extensions temporarily
   - Test in incognito mode

2. **Verify Dialog isn't stealing focus:**
   ```tsx
   // The Dialog should have modal={true} (default)
   <Dialog open={open} onOpenChange={setOpen}>
   ```

---

## 🎯 Quick Fixes

### Fix 1: Force Highest Z-Index
If dropdown still hidden, try this emergency fix:

```tsx
<SelectContent position="popper" className="z-[9999] !important">
```

### Fix 2: Use Item Position Strategy
Change from popper to item:

```tsx
<SelectContent position="item" className="z-[100]">
```

### Fix 3: Disable Dialog Overflow
Update Dialog:

```tsx
<DialogContent className="max-w-5xl max-h-[90vh] overflow-visible">
```

---

## 📊 Verification Checklist

After applying fixes, verify:

- [ ] Dropdown opens when clicked
- [ ] All 4 options are visible
- [ ] Can select each option
- [ ] Form updates with selected value
- [ ] Field labels change based on type selected
- [ ] Can create coupon of each type
- [ ] Created coupons appear in list
- [ ] Can edit existing coupons
- [ ] Can delete coupons
- [ ] API endpoints return 200/201 status
- [ ] No console errors
- [ ] No ARIA warnings

---

## 🔬 Debug Commands

### Check if Select is rendered:
```javascript
// Browser console
document.querySelector('[data-radix-select-trigger]')
// Should return the trigger element
```

### Check if Portal is created:
```javascript
// Browser console
document.querySelectorAll('[data-radix-portal]').length
// Should be > 0 when dropdown is open
```

### Check computed styles:
```javascript
// Browser console
const content = document.querySelector('[data-radix-select-content]');
if (content) {
  const styles = window.getComputedStyle(content);
  console.log({
    zIndex: styles.zIndex,
    position: styles.position,
    display: styles.display,
    visibility: styles.visibility
  });
}
```

### Monitor Select events:
```javascript
// Browser console - Run before clicking dropdown
const trigger = document.querySelector('[data-radix-select-trigger]');
['click', 'mousedown', 'pointerdown'].forEach(event => {
  trigger?.addEventListener(event, (e) => {
    console.log(`Event: ${event}`, e);
  });
});
```

---

## 🚀 If All Else Fails

### Nuclear Option: Rebuild Select Component

Create a simple native select as fallback:

```tsx
<select 
  value={formData.discount_type}
  onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as any })}
  className="w-full h-10 rounded-md border px-3"
>
  <option value="percentage">Percentage Discount (e.g., 10% off)</option>
  <option value="flat">Flat Amount Discount (e.g., ₹500 off)</option>
  <option value="buy_x_get_y">Buy X Get Y Free (e.g., Buy 2 Get 1)</option>
  <option value="free_shipping">Free Shipping</option>
</select>
```

This will work 100% of the time but loses the custom styling.

---

## 📞 Next Steps

1. ✅ Refresh browser with hard reload
2. ✅ Test dropdown in Manage Offers dialog
3. ✅ Run CRUD test script
4. ✅ Create one coupon of each type
5. ✅ Verify all API endpoints work
6. ✅ Check browser console for errors
7. ✅ Report back with results

---

**File:** `test-coupon-crud.sh` - Automated API testing script  
**Location:** `/Applications/safawala-crm/test-coupon-crud.sh`  
**Usage:** `./test-coupon-crud.sh`
