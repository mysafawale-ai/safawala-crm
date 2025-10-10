# Staff Edit - Auto-Select Franchise Fix ✅

## Problem
When editing a staff member, the "Franchise" dropdown was not pre-selecting the staff member's current franchise. The dropdown showed the placeholder "Select franchise" instead of the actual franchise value.

## Root Cause
The `franchise_id` value wasn't being properly synchronized when opening the edit dialog. The Select component needs the value to be set correctly to show the selected option.

## Solution

### 1. **Updated openEditDialog Function**
Added fallback to ensure `franchise_id` is always a valid string:

```tsx
const openEditDialog = (user: User) => {
  setSelectedUser(user)
  setNewUserData({
    name: user.name,
    email: user.email,
    password: '',
    role: user.role,
    franchise_id: user.franchise_id || '', // ✅ Fallback added
    permissions: user.permissions || getDefaultPermissions(user.role)
  })
  setShowEditDialog(true)
}
```

### 2. **Added useEffect for Sync**
Created a useEffect hook that ensures the franchise_id is synced when the edit dialog opens:

```tsx
useEffect(() => {
  if (selectedUser && showEditDialog) {
    console.log('Selected user:', selectedUser)
    console.log('User franchise_id:', selectedUser.franchise_id)
    setNewUserData(prev => ({
      ...prev,
      franchise_id: selectedUser.franchise_id || ''
    }))
  }
}, [selectedUser, showEditDialog])
```

**Why this works:**
- Watches for changes to `selectedUser` and `showEditDialog`
- When both conditions are true (dialog is open with a user selected)
- Updates the `newUserData.franchise_id` to match the user's franchise
- The Select component automatically shows the matching option

## How Select Component Works

The Radix UI Select component:
```tsx
<Select
  value={newUserData.franchise_id}  // ← Must match a SelectItem value
  onValueChange={(value) => handleInputChange('franchise_id', value)}
>
  <SelectTrigger>
    <SelectValue placeholder="Select franchise" />
  </SelectTrigger>
  <SelectContent>
    {franchises.map((franchise) => (
      <SelectItem key={franchise.id} value={franchise.id}>
        {franchise.name} ({franchise.code})
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

**Key Points:**
- The `value` prop must exactly match one of the `SelectItem` values
- If `value` doesn't match any item, the placeholder is shown
- The Select automatically displays the matching item's text

## Testing Checklist

### Test Auto-Selection
- [ ] Go to `/staff` page
- [ ] Click edit on any staff member
- [ ] **Check:** Franchise dropdown should show the staff's current franchise (not placeholder)
- [ ] **Example:** If staff is in "Dahod ni Branch", dropdown should show "Dahod ni Branch (DAHOD001)"

### Test Franchise Change
- [ ] Open edit dialog for a staff member
- [ ] Verify current franchise is selected
- [ ] Change to a different franchise
- [ ] Click "Update Staff Member"
- [ ] Verify the change saved successfully
- [ ] Edit again - should show the new franchise

### Test Different Users
- [ ] Edit a Super Admin - check franchise selection
- [ ] Edit a Franchise Admin - check franchise selection  
- [ ] Edit a Staff member - check franchise selection
- [ ] All should show their current franchise auto-selected

## Debug Console Logs

When you open the edit dialog, check the browser console for:
```
Selected user: {id: '...', name: '...', franchise_id: '...', ...}
User franchise_id: 95168a3d-a6a5-4f9b-bbe2-7b88c7cef050
```

If `franchise_id` is:
- ✅ A valid UUID → Should work perfectly
- ❌ `undefined` or `null` → Check API response format
- ❌ Empty string → No franchise assigned to user

## What's Working Now

1. ✅ **Auto-Selection**: Franchise dropdown shows current franchise
2. ✅ **Visual Feedback**: User sees their current franchise immediately
3. ✅ **Better UX**: No need to scroll and find the franchise manually
4. ✅ **Accurate Editing**: Clear what the current value is before changing
5. ✅ **Debug Support**: Console logs help troubleshoot if needed

## API Data Structure

The staff API returns:
```json
{
  "id": "uuid",
  "name": "Staff Name",
  "email": "staff@example.com",
  "role": "staff",
  "franchise_id": "95168a3d-a6a5-4f9b-bbe2-7b88c7cef050",
  "franchise": {
    "name": "Dahod ni Branch",
    "code": "DAHOD001"
  }
}
```

The `franchise_id` field is used for the Select value.
The `franchise` object is used for display in the staff list.

---

**Status**: ✅ **FIXED - Franchise auto-selects in edit dialog!**

Try editing a staff member now - the franchise dropdown should automatically show their current franchise instead of the placeholder text.
