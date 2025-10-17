# 🧪 Quick Test Card - Edit Functionality

## ⚡ 2-Minute Smoke Test

### Test 1: Product Booking Edit (30 seconds)
```
1. Navigate to: /bookings
2. Find any product booking row
3. Click: "Edit" button
4. Expected: Redirects to /create-product-order?edit=XXX
5. Expected: Form shows "Edit Quote" title
6. Expected: All fields pre-filled
7. Change: Modify any product quantity
8. Click: "Update Order" button
9. Expected: Toast "Order updated successfully"
10. Expected: Redirects to /bookings
✅ PASS if changes saved
```

### Test 2: Package Booking Edit (30 seconds)
```
1. Navigate to: /bookings
2. Find any package booking row
3. Click: "Edit" button
4. Expected: Redirects to /book-package?edit=XXX
5. Expected: Loading screen appears
6. Expected: Auto-advances to Step 3 (Review)
7. Expected: Form shows "Edit Quote" title
8. Change: Modify event date
9. Click: "Update Quote" button
10. Expected: Toast "Quote updated successfully"
11. Expected: Redirects to /bookings
✅ PASS if changes saved
```

### Test 3: Quote Edit (30 seconds)
```
1. Navigate to: /quotes
2. Find any quote row
3. Click: "Edit" button (three-dot menu)
4. Expected: Redirects to correct create page
5. Expected: All products/packages editable
6. Change: Modify something
7. Click: "Update" button
8. Expected: Success toast
9. Expected: Redirects to /quotes
✅ PASS if changes saved
```

### Test 4: Error Handling (30 seconds)
```
1. Go to: /create-product-order?edit=invalid-id
2. Expected: Error toast appears
3. Expected: Redirects back or shows graceful error
✅ PASS if no crashes
```

---

## 🎯 Critical Paths to Test

### Product Orders
- [ ] Edit button visible on bookings page ✓
- [ ] Routes to /create-product-order?edit=ID ✓
- [ ] Customer pre-selected ✓
- [ ] Products list populated ✓
- [ ] Can modify products ✓
- [ ] Save updates database ✓

### Package Bookings
- [ ] Edit button visible on bookings page ✓
- [ ] Routes to /book-package?edit=ID ✓
- [ ] Customer pre-selected ✓
- [ ] Packages/variants populated ✓
- [ ] Auto-advances to Step 3 ✓
- [ ] Can modify packages ✓
- [ ] Save updates database ✓

### Quotes
- [ ] Edit button visible on quotes page ✓
- [ ] Routes correctly based on type ✓
- [ ] Full edit (not just event details) ✓
- [ ] Save updates database ✓

---

## 🔍 What to Check in DevTools

### Console (F12)
```javascript
// Should see these logs:
"[EditMode] Detected edit parameter: xxx"
"[EditMode] Loading quote data..."
"[EditMode] Quote loaded successfully"

// Should NOT see:
"Error:", "TypeError:", "undefined is not"
```

### Network Tab
```
// On load:
GET /api/... → 200 OK (booking data)

// On save:
PUT /api/... → 200 OK (update success)
```

### Database (optional)
```sql
-- Check that changes saved:
SELECT * FROM product_orders WHERE id = 'xxx';
SELECT * FROM package_bookings WHERE id = 'xxx';
```

---

## 🚨 Red Flags

Watch out for these issues:

### ❌ Edit Not Working
- Edit button doesn't exist → Check if source field exists
- Button doesn't do anything → Check handleEditBooking function
- Routes to wrong page → Check source value (package_bookings vs product_orders)
- Form is empty → Check loadQuoteForEdit function
- Can't modify items → Check if in edit mode (isEditMode === true)

### ❌ Save Not Working
- Button doesn't do anything → Check handleSubmit function
- Shows error toast → Check API response, database permissions
- Redirects but changes not saved → Check UPDATE query
- Items not saved → Check DELETE + INSERT for items

---

## 📊 Expected Results

### UI
- ✅ Title says "Edit Quote" (not "Create")
- ✅ Button says "Update Order" or "Update Quote"
- ✅ All fields pre-filled with existing data
- ✅ Products/packages list populated
- ✅ Loading indicator shows while loading data

### Behavior
- ✅ Can modify all fields
- ✅ Can add/remove items
- ✅ Validation works
- ✅ Save redirects back
- ✅ Changes persist after refresh

### Database
- ✅ Header updated in product_orders/package_bookings
- ✅ Old items deleted
- ✅ New items inserted
- ✅ updated_at timestamp changed

---

## 🎓 Troubleshooting

### Problem: Form is empty after redirect
**Solution**: Check that bookingId is being passed correctly in URL

### Problem: Can't modify products/packages
**Solution**: Verify isEditMode is true, check console logs

### Problem: Save doesn't work
**Solution**: Check browser console for errors, verify API endpoint

### Problem: Redirects but changes not saved
**Solution**: Check database UPDATE query, verify permissions

### Problem: "Cannot edit" toast appears
**Solution**: Check that booking has source field (package_bookings or product_orders)

---

## 🏆 Success Criteria

All tests passing means:
- ✅ Edit buttons working on both bookings and quotes pages
- ✅ Routing to correct create pages
- ✅ Data loading and pre-filling working
- ✅ Full edit capability (all fields + items)
- ✅ Save updating database correctly
- ✅ User experience smooth and intuitive

**When all ✅ → Tasks 5 & 6 are PRODUCTION READY! 🚀**

---

## 📝 Test Report Template

```markdown
# Edit Functionality Test Report

Date: __________
Tester: __________

## Product Booking Edit
- [ ] Button visible
- [ ] Routes correctly
- [ ] Data loads
- [ ] Can modify
- [ ] Save works
- [ ] Changes persist

## Package Booking Edit
- [ ] Button visible
- [ ] Routes correctly
- [ ] Data loads
- [ ] Can modify
- [ ] Save works
- [ ] Changes persist

## Quote Edit
- [ ] Button visible
- [ ] Routes correctly
- [ ] Full edit capability
- [ ] Save works

## Overall
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] All tests pass

Status: ✅ PASS / ❌ FAIL
Notes: ___________________________
```

---

*Keep this card handy for quick testing!*
*Print or bookmark for easy reference* 📌
