# 🧪 Laundry Page - Testing Quick Reference

## Quick Test Checklist

### ✅ Feature 1: Date Range Filter
**Location**: Batches table card → Filter section → Date Filter button

**Test Steps**:
1. Click "Date Filter" button (📅 icon)
2. Dialog opens with From/To date inputs
3. Select a date range
4. Click "Apply Filter"
5. Table shows only batches within date range
6. Button text changes to "Date Filtered"
7. Click "Clear Filter" to reset

**Expected Result**: Only batches sent between selected dates appear

---

### ✅ Feature 2: Enhanced Vendor Selection
**Location**: Create Batch dialog → Vendor dropdown

**Test Steps**:
1. Click "Create Batch" button
2. Click vendor dropdown
3. Notice rich information (contact, phone, service type, pricing)
4. Select a vendor
5. Vendor details card appears below dropdown
6. Card shows: contact info, email, pricing, notes

**Expected Result**: Full vendor information visible before creating batch

---

### ✅ Feature 3: Batch Editing
**Location**: Batches table → In-progress batch row → Edit button

**Test Steps**:
1. Find a batch with status "In Progress"
2. Click "Edit" button (✏️ icon)
3. Edit dialog opens showing:
   - Read-only batch summary at top
   - Current items table
   - Add items section at bottom
4. Try removing an item (click 🗑️)
5. Try adding a new item:
   - Select product
   - Enter quantity
   - Select condition
   - Click "Add Item"
6. Notice totals update automatically
7. Click "Save Changes"
8. Success toast appears
9. Table updates with new totals

**Expected Result**: Batch items modified successfully

---

### ✅ Feature 4: Vendor Info in Batch Details
**Location**: Batches table → Any batch → View button (👁️)

**Test Steps**:
1. Click "View" button on any batch
2. Details dialog opens
3. Notice new "Vendor Information" card at top
4. Card shows:
   - Vendor name and service type badge
   - Contact person and phone
   - Email address
   - Price per item
5. Below that, see improved batch info layout
6. Items table at bottom

**Expected Result**: Complete vendor information visible in batch details

---

### ✅ Feature 5: Batch Notes
**Location**: Batch Details dialog → Bottom → "Add Note" section

**Test Steps**:
1. Click "View" on any batch
2. Scroll to bottom of dialog
3. Find "📝 Add Note" card
4. Type a note in textarea
5. Click "Add Note" button
6. Success toast appears
7. Close dialog and reopen same batch
8. Note appears in "Batch Notes" with timestamp

**Expected Result**: Note saved with timestamp [Oct 20, 2025 2:30 PM] format

---

### ✅ Feature 6: Mobile Responsiveness
**Location**: All sections

**Test Steps**:
1. Open browser DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select iPhone/iPad or custom width
4. Test at different widths: 375px, 768px, 1024px

**Check**:
- ✅ Filters stack vertically on mobile
- ✅ Stats cards stack on mobile, 2x2 on tablet
- ✅ Table scrolls horizontally on mobile
- ✅ Dialogs don't overflow viewport
- ✅ Buttons wrap properly
- ✅ All text readable
- ✅ Touch targets at least 44x44px

**Expected Result**: Everything usable on mobile

---

### ✅ Feature 7: Empty State
**Location**: Batches table (when no results)

**Test Steps**:
1. Use filters to get zero results
   - Search for non-existent batch
   - Or use date range with no batches
2. Notice empty state appears:
   - 📦 Package icon
   - "No batches found" heading
   - "Try adjusting your filters" message

**Expected Result**: Helpful empty state instead of blank table

---

## Edge Cases to Test

### 1. **Long Vendor Names**
- Create vendor with very long name
- Check if it wraps properly in dropdown
- Check if vendor card handles it

### 2. **Many Items in Batch**
- Create batch with 20+ items
- Check if items table scrolls
- Check if dialog remains usable

### 3. **Special Characters in Notes**
- Add note with emojis: "Great service! 😊👍"
- Add note with quotes and symbols
- Check if saved correctly

### 4. **Concurrent Edits**
- Open same batch in two tabs
- Edit in one tab
- Check what happens in other tab

### 5. **Network Failures**
- Turn off network
- Try to save batch edit
- Check error handling
- Check user feedback (toast)

### 6. **Empty Batch Edit**
- Edit a batch
- Remove all items
- Try to save
- Should be disabled or show error

### 7. **Date Filter Edge Cases**
- Set "From" date after "To" date
- Set today as both dates
- Clear filter with no dates set

---

## Performance Checks

### Load Time
- [ ] Page loads within 2 seconds
- [ ] Stats calculate quickly
- [ ] Table renders without lag

### Filter Performance
- [ ] Search is responsive (no lag)
- [ ] Status filter applies instantly
- [ ] Date filter applies smoothly

### Dialog Performance
- [ ] Dialogs open/close smoothly
- [ ] Large item lists scroll smoothly
- [ ] No flickering or jumps

---

## Browser Compatibility

Test in:
- [ ] Chrome/Edge (Latest)
- [ ] Firefox (Latest)
- [ ] Safari (Latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## Accessibility Checks

### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Enter/Space activates buttons
- [ ] Escape closes dialogs
- [ ] Arrow keys work in dropdowns

### Screen Reader
- [ ] All buttons have labels
- [ ] Form inputs have labels
- [ ] Status badges announce correctly
- [ ] Dialog titles are announced

### Visual
- [ ] Text contrast meets WCAG AA
- [ ] Focus indicators visible
- [ ] No information by color alone
- [ ] Zoom to 200% works

---

## User Experience Checks

### Clarity
- [ ] All actions have clear labels
- [ ] Success/error messages are clear
- [ ] Loading states are visible
- [ ] Empty states are helpful

### Consistency
- [ ] Buttons use same variants
- [ ] Spacing is consistent
- [ ] Colors match design system
- [ ] Icons are consistent

### Feedback
- [ ] Toast appears on actions
- [ ] Loading states during saves
- [ ] Disabled states clear
- [ ] Errors are user-friendly

---

## Common Issues & Solutions

### Issue: Vendor card doesn't show
**Solution**: Make sure vendor has all required fields in database

### Issue: Edit button doesn't appear
**Solution**: Only shows for "in_progress" status batches

### Issue: Date filter not working
**Solution**: Check date format (YYYY-MM-DD) in database

### Issue: Notes not saving
**Solution**: Check if notes column exists in laundry_batches table

### Issue: Mobile table overflow
**Solution**: Parent container should have overflow-x-auto

---

## Test Data Setup

### Create Test Vendors
```sql
INSERT INTO vendors (name, contact_person, phone, email, service_type, pricing_per_item, is_active)
VALUES 
  ('Test Cleaners', 'John Doe', '+91-1234567890', 'john@test.com', 'both', 50, true),
  ('Budget Laundry', 'Jane Smith', '+91-9876543210', 'jane@budget.com', 'laundry', 30, true);
```

### Create Test Batch
```sql
-- Use the Create Batch dialog in UI instead of SQL
-- This ensures all triggers and constraints are tested
```

---

## Regression Testing

After deploying, verify:
- [ ] Old batches still display correctly
- [ ] Existing vendor data loads
- [ ] Status updates still work
- [ ] Pagination still functions
- [ ] Stats calculations accurate

---

## Sign-off Checklist

Before marking as complete:
- [ ] All 7 features tested and working
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Mobile responsive verified
- [ ] Empty states work
- [ ] Error handling tested
- [ ] Success toasts appear
- [ ] Data persists correctly
- [ ] Documentation created
- [ ] Screenshots/recordings captured (optional)

---

**Tester Name**: ___________________  
**Test Date**: ___________________  
**Browser/Device**: ___________________  
**Status**: ⬜ Pass / ⬜ Fail / ⬜ Needs Review  
**Notes**: 
```
_____________________________________________
_____________________________________________
_____________________________________________
```

---

## Quick Fix Guide

### If something breaks:

1. **Check Console**: Press F12, look for errors
2. **Check Network**: Look for failed API calls
3. **Check Database**: Verify tables exist
4. **Clear Cache**: Hard refresh (Ctrl+Shift+R)
5. **Check Supabase**: Verify connection
6. **Rollback**: Git revert if needed

### Emergency Rollback
```bash
git log --oneline  # Find commit before changes
git revert <commit-hash>
```

---

**Testing Priority**: ⭐⭐⭐⭐⭐ (Critical)  
**Est. Test Time**: 30-45 minutes  
**Required**: Before production deployment
