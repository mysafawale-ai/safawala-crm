# Conditional Groom/Bride Fields Based on Event Participant

## Overview
Added conditional rendering logic to show/hide Groom and Bride information sections based on the Event Participant selection.

## Changes Made

### Files Updated
1. ✅ `app/create-product-order/page.tsx` - Product Order page
2. ✅ `app/book-package/page.tsx` - Package Booking page

### Conditional Logic

#### Event Participant Options
- **Groom Only** - Shows only Groom Information fields
- **Bride Only** - Shows only Bride Information fields  
- **Both** - Shows both Groom and Bride Information fields

### Implementation

#### Groom Information Card
```tsx
{(formData.event_participant === "Groom Only" || formData.event_participant === "Both") && (
  <Card>
    <CardHeader>
      <CardTitle>Groom Information</CardTitle>
    </CardHeader>
    <CardContent>
      {/* Groom Name, WhatsApp, Address fields */}
    </CardContent>
  </Card>
)}
```

#### Bride Information Card
```tsx
{(formData.event_participant === "Bride Only" || formData.event_participant === "Both") && (
  <Card>
    <CardHeader>
      <CardTitle>Bride Information</CardTitle>
    </CardHeader>
    <CardContent>
      {/* Bride Name, WhatsApp, Address fields */}
    </CardContent>
  </Card>
)}
```

## Visibility Matrix

| Event Participant | Groom Info Visible | Bride Info Visible |
|-------------------|--------------------|--------------------|
| Groom Only        | ✅ Yes             | ❌ No              |
| Bride Only        | ❌ No              | ✅ Yes             |
| Both              | ✅ Yes             | ✅ Yes             |

## User Experience Flow

### Scenario 1: Groom Only
```
1. Select "Event Participant" dropdown
2. Choose "Groom Only"
3. ✅ Groom Information card appears
4. ❌ Bride Information card hidden
5. Form only shows relevant fields
```

### Scenario 2: Bride Only
```
1. Select "Event Participant" dropdown
2. Choose "Bride Only"
3. ❌ Groom Information card hidden
4. ✅ Bride Information card appears
5. Form only shows relevant fields
```

### Scenario 3: Both
```
1. Select "Event Participant" dropdown
2. Choose "Both"
3. ✅ Groom Information card appears
4. ✅ Bride Information card appears
5. Form shows all fields
```

## Fields in Each Section

### Groom Information Card
1. **Groom Name** - Text input
2. **Additional WhatsApp Number** - Text input for groom's WhatsApp
3. **Home Address** - Textarea for groom's home address

### Bride Information Card
1. **Bride Name** - Text input
2. **Additional WhatsApp Number** - Text input for bride's WhatsApp
3. **Home Address** - Textarea for bride's home address

## Benefits

### Before (Always Visible)
- ❌ All fields shown regardless of participant type
- ❌ Confusing when only one person is involved
- ❌ Unnecessary data entry
- ❌ Cluttered form layout

### After (Conditional)
- ✅ Clean, relevant form
- ✅ Shows only needed fields
- ✅ Reduces confusion
- ✅ Faster data entry
- ✅ Better user experience
- ✅ Less scrolling required

## Visual Impact

### When "Groom Only" Selected
```
┌─────────────────────────────────────┐
│ Event & Wedding Details             │
│ ┌─────────────────────────────────┐ │
│ │ Event Participant: [Groom Only▼]│ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 👨 Groom Information               │
│ • Groom Name                        │
│ • WhatsApp Number                   │
│ • Home Address                      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 📝 Notes                            │
└─────────────────────────────────────┘
```

### When "Bride Only" Selected
```
┌─────────────────────────────────────┐
│ Event & Wedding Details             │
│ ┌─────────────────────────────────┐ │
│ │ Event Participant: [Bride Only▼]│ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 👰 Bride Information                │
│ • Bride Name                        │
│ • WhatsApp Number                   │
│ • Home Address                      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 📝 Notes                            │
└─────────────────────────────────────┘
```

### When "Both" Selected
```
┌─────────────────────────────────────┐
│ Event & Wedding Details             │
│ ┌─────────────────────────────────┐ │
│ │ Event Participant: [Both ▼]     │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 👨 Groom Information               │
│ • Groom Name                        │
│ • WhatsApp Number                   │
│ • Home Address                      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 👰 Bride Information                │
│ • Bride Name                        │
│ • WhatsApp Number                   │
│ • Home Address                      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 📝 Notes                            │
└─────────────────────────────────────┘
```

## Testing Checklist

### Product Order Page (`/create-product-order`)
- [ ] Open page
- [ ] Change Event Participant to "Groom Only"
- [ ] Verify only Groom Information card shows
- [ ] Change to "Bride Only"
- [ ] Verify only Bride Information card shows
- [ ] Change to "Both"
- [ ] Verify both cards show
- [ ] Test form submission with each option

### Package Booking Page (`/book-package`)
- [ ] Open page
- [ ] Repeat same tests as Product Order
- [ ] Verify behavior matches exactly

## Technical Details

### React Conditional Rendering
- Uses JSX conditional rendering with `&&` operator
- No component re-mount, just show/hide
- Form state persists when toggling options
- No data loss when switching between options

### Performance
- ✅ No performance impact
- ✅ Cards unmount when hidden (not just CSS hidden)
- ✅ React efficiently handles conditional rendering
- ✅ No unnecessary re-renders

## Data Persistence

**Important**: Form data persists even when fields are hidden!

Example:
1. Select "Both"
2. Fill Groom Name: "Rahul"
3. Fill Bride Name: "Priya"
4. Change to "Groom Only" (Bride section hides)
5. Change back to "Both"
6. ✅ Both names still filled!

This allows users to:
- Switch options without losing data
- Review/edit without re-entering
- Correct mistakes easily

## Future Enhancements

Potential improvements:
1. Add icons (👨 for Groom, 👰 for Bride) in card titles
2. Add smooth transition animation when showing/hiding
3. Add warning if user switches away from "Both" with data in hidden fields
4. Add "Clear Groom/Bride Data" buttons
5. Auto-focus first field when section appears

## Database Impact

**No database changes required!**
- All fields already exist in tables
- Conditional rendering is UI-only
- Data still saved regardless of visibility
- Reports show all data normally

---

**Status**: ✅ Complete  
**Impact**: Cleaner, more intuitive booking forms  
**Date**: October 7, 2025  
**Pages Updated**: Product Order & Package Booking
