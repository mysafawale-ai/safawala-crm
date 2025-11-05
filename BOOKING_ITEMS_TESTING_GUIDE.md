# Booking Items Management - Troubleshooting & Testing Guide

## Quick Diagnosis

If you're experiencing issues, follow these tests in order:

---

## TEST 1: Verify Items Load on Page Load ✓

**Expected Behavior:**
- Page loads → items for all bookings are fetched automatically

**How to Test:**
1. Open browser DevTools → Console
2. Refresh the bookings page
3. Look for logs:
```
[Bookings] Fetching items for 12 bookings...
[Bookings] Fetching items for PKG-1762256769398-217 (source: package_booking, normalized: package_booking)...
[Bookings] Attempt 1/3: GET /api/bookings-items?id=7655e726-b841-4e2a-9981-a22b72c8087a&source=package_booking
✓ Loaded 2 items for PKG-1762256769398-217 (source: package_booking)
Items fetch complete: 12 success, 0 errors
```

**If It Fails:**
- Check Network tab → see if `/api/bookings-items` requests are returning 200
- If returns 404: API endpoint doesn't exist
- If returns 500: Database query error
- If returns timeout: Server is slow or down

**Fix if Failing:**
```bash
# Check if API endpoint exists
ls app/api/bookings-items/route.ts

# If exists, check for syntax errors
# If doesn't exist, this is the issue
```

---

## TEST 2: Open Compact Display (View Items) ✓

**Expected Behavior:**
- Click on "Items" badge → compact display opens with items
- NO 404 errors in console
- Items appear instantly from cache

**How to Test:**
1. In bookings table, find a booking with items
2. Click on the "Items" badge
3. Compact display dialog should open
4. Check console for:
```
[Bookings] Opening compact display for booking: 7655e726-b841-4e2a-9981-a22b72c8087a
[Bookings] Using cached items from bookingItems state: 2 items
```

**If It Fails:**
- If dialog doesn't open: Check browser console for errors
- If 404 appears: There's still an API call being made (shouldn't happen)
- If items are blank: Items didn't load in Step 1

**Diagnostics:**
```javascript
// In browser console, paste this:
// Check if items are in state
console.log('Bookings with items:', Object.keys(window.__BOOKING_ITEMS__ || {}))
```

---

## TEST 3: Edit Products (Add/Remove Items) ✓

**Expected Behavior:**
- Click "Edit Products" button
- ItemsSelectionDialog opens
- Can click to add/remove products
- Can change quantities
- No errors

**How to Test:**
1. Open compact display (Test 2)
2. Click "Edit Products" button
3. Dialog should open showing available products
4. Click on a product to add it
5. Click on an already-selected product to remove it
6. Change quantity by clicking +/- buttons

**If Adding Items Fails:**
- Product doesn't get added to selectedItems
- Check console for `onItemSelect` errors
- Verify product object has required fields (id, rental_price, etc.)

**If Removing Items Fails:**
- Product isn't being found in selectedItems
- Check console logs for item matching logic
- Verify product_id is being compared correctly

**Fix:**
```javascript
// Test the add logic manually in console:
const item = { id: 'test-id', rental_price: 100 };
const selectedItems = [];
// Should add item to selectedItems array
// If you have access to component state, verify the change happens
```

---

## TEST 4: Save Changes (Close Dialog) ✓

**Expected Behavior:**
- Close ItemsSelectionDialog
- `saveSelectedItems()` is called
- `bookingItems` state is updated
- No API calls made
- Toast shows "Items updated successfully!"
- No errors in console

**How to Test:**
1. Make changes to products (add/remove some)
2. Close the ItemsSelectionDialog
3. Watch console for:
```
[Bookings] Saving 3 items for booking 7655e726-b841-4e2a-9981-a22b72c8087a
```
4. Toast notification appears
5. Booking table updates to show new item count

**If Save Fails:**
- Dialog closes but toast shows error
- Check console for error message
- Verify selectedItems array has content before closing

**If Items Don't Persist:**
- Check bookingItems state in React DevTools
- Should see booking ID with updated items array
- If missing, saveSelectedItems wasn't called

---

## TEST 5: Verify Updates Persist ✓

**Expected Behavior:**
- After saving, items should remain in state
- Closing and re-opening compact display shows updated items
- Refreshing page reloads items from API

**How to Test:**
1. Complete Test 4 (save changes)
2. Close compact display
3. Click "Items" badge again
4. Verify items are the same as what you saved
5. Refresh page (F5)
6. Click "Items" badge again
7. Items should be reloaded from API (fresh from database)

**If Updates Don't Persist:**
- Session state issue
- Check if bookingItems state is being cleared somewhere
- Look for useEffect cleanup functions that might reset state

---

## Common Issues & Solutions

### Issue: "Failed to load resource: the server responded with a status of 404"

**Diagnosis:**
- An API endpoint is being called that doesn't exist
- OR endpoint exists but route is not matching

**Solution:**
1. Check Network tab to see which endpoint is failing
2. Verify endpoint exists: `ls app/api/bookings/{endpoint}/route.ts`
3. Make sure endpoint is not in a catch-all or wrong directory
4. Restart dev server: `pnpm dev`

### Issue: Items don't appear after adding

**Diagnosis:**
- `onItemSelect` handler isn't updating state
- OR selected item isn't being transformed correctly
- OR item object is missing required fields

**Solution:**
1. Add console.log in onItemSelect:
```javascript
console.log('Adding item:', item)
console.log('Current selectedItems:', selectedItems)
// Verify these log correctly
```

2. Check item object structure:
```javascript
// Item should have:
{ 
  id: '...',
  name: 'Product Name',
  rental_price: 100,
  ... 
}
```

### Issue: Dialog won't close

**Diagnosis:**
- `saveSelectedItems()` is throwing an error
- OR error is being caught silently
- OR dialog's onOpenChange handler is broken

**Solution:**
1. Check console for errors
2. Add try-catch to onOpenChange:
```javascript
onOpenChange={async (open) => {
  if (!open) {
    try {
      await saveSelectedItems(...)
    } catch (error) {
      console.error('Save failed:', error)
    }
  }
  setShowItemsSelection(open)
}}
```

### Issue: Multiple items with same product

**Diagnosis:**
- Product can be added multiple times
- This might be intentional (for rentals: multiple of same item)
- OR it's a bug in onItemSelect logic

**Solution:**
- Check business logic: should same product appear once or multiple times?
- Modify onItemSelect comparison logic if needed

---

## Data Flow Debugging

### Check current bookingItems state:

In browser console (if you have access to React DevTools):
```javascript
// Using React DevTools Profiler:
// 1. Open React DevTools
// 2. Find BookingsPage component
// 3. Look at hooks → find bookingItems state
// 4. Expand to see all loaded items

// Or check NetworkTab to see /api/bookings-items responses
```

### Trace selectedItems changes:

```javascript
// Add to component to log every change:
useEffect(() => {
  console.log('selectedItems updated:', selectedItems)
}, [selectedItems])
```

---

## Performance Checks

### Items Load Speed:
- Should be instant after page loads
- Check Network tab → /api/bookings-items response time
- If > 2 seconds: Consider pagination or filtering

### Dialog Open Speed:
- Should be instant (no API call)
- If slow: Check for render performance issues
- Use React DevTools Profiler to identify bottleneck

### Save Speed:
- Should be instant (state update only)
- If slow: Check for unnecessary re-renders
- Profile with React DevTools

---

## Complete Feature Checklist

Before declaring "working", verify all:

### Initial Load:
- [ ] Page loads
- [ ] Items fetch automatically
- [ ] All 12 bookings show items
- [ ] No errors in console

### View Items:
- [ ] Click "Items" badge
- [ ] Compact display opens
- [ ] Items show correctly
- [ ] No 404 errors

### Edit Items:
- [ ] Click "Edit Products"
- [ ] Selection dialog opens
- [ ] Can add products
- [ ] Can remove products
- [ ] Can change quantities
- [ ] No errors

### Save:
- [ ] Close dialog
- [ ] Items are saved
- [ ] Toast shows success
- [ ] No errors
- [ ] bookingItems state updated

### Verify:
- [ ] Re-open dialog
- [ ] Items are still there
- [ ] Refresh page
- [ ] Items reload from API

---

## Still Having Issues?

If tests still fail after following above:

1. **Verify API Response:**
```bash
# Test the API directly:
curl "https://mysafawala.com/api/bookings-items?id=7655e726-b841-4e2a-9981-a22b72c8087a&source=package_booking"
# Should return JSON with "items" array
```

2. **Check Code Changes:**
```bash
# Verify recent changes
git diff HEAD~3..HEAD app/bookings/page.tsx
```

3. **Clear Cache:**
```bash
# Hard refresh browser
Ctrl+Shift+R (or Cmd+Shift+R on Mac)
# Clear DevTools cache
DevTools → Application → Cache → Clear
```

4. **Restart Everything:**
```bash
# Kill dev server
pnpm dev  # Then restart
# Restart browser
# Clear browser cache
```

---

## Success Indicators

You'll know everything is working when:

✅ Page loads → all items auto-fetch (no manual action needed)
✅ Click "Items" → opens instantly with no API calls
✅ Edit items → local state updates instantly
✅ Save → happens without any backend errors
✅ Console is clean → no 404, no red errors
✅ Performance is fast → all operations are instant

