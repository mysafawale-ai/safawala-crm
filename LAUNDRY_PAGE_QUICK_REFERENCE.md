# 🚀 Laundry Page - Quick Reference Card

## What's New? (6 Features)

| Feature | Icon | Where to Find | What It Does |
|---------|------|---------------|--------------|
| **Date Filter** | 📅 | Filter section → Date Filter button | Filter batches by date range |
| **Rich Vendor Info** | 💼 | Create Batch → Vendor dropdown | See full vendor details before selecting |
| **Batch Editing** | ✏️ | Table → In Progress batch → Edit | Add/remove items from active batches |
| **Enhanced Details** | 📊 | Any batch → View button | See vendor card + better layout |
| **Notes Tracking** | 📝 | Batch Details → Add Note section | Add timestamped notes to batches |
| **Mobile Ready** | 📱 | All pages | Perfect on phones & tablets |

---

## Quick Actions

### Filter Batches by Date
```
1. Click [📅 Date Filter]
2. From: [Pick Date] To: [Pick Date]
3. [Apply Filter]
```

### Create Batch with Vendor Info
```
1. Click [+ Create Batch]
2. Select vendor → See contact card
3. Add items → [Create Batch]
```

### Edit a Batch
```
1. Find "In Progress" batch
2. Click [✏️ Edit]
3. Remove: Click [🗑️] on item
4. Add: Select product → [+ Add Item]
5. Click [Save Changes]
```

### Add Note to Batch
```
1. Click [👁️ View] on batch
2. Scroll down → "Add Note" section
3. Type note → [Add Note]
```

---

## Status Colors

| Status | Color | Icon |
|--------|-------|------|
| Pending | 🟨 Yellow | ⏰ |
| In Progress | 🟦 Blue | 🚚 |
| Completed | 🟩 Green | ✅ |
| Returned | 🟪 Purple | 📦 |
| Cancelled | 🟥 Red | ❌ |

---

## Button Guide

| Button | Action | When Available |
|--------|--------|----------------|
| [👁️ View] | See batch details | Always |
| [✏️ Edit] | Edit batch items | In Progress only |
| [📦 Mark Returned] | Mark batch returned | In Progress only |
| [❌ Cancel] | Cancel batch | In Progress or Returned |
| [🔄 Refresh] | Reload data | Always |
| [+ Create Batch] | New batch | Always |

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Tab` | Navigate between fields |
| `Enter` | Submit forms / Click focused button |
| `Esc` | Close dialogs |
| `Ctrl/Cmd + F` | Browser search (search batches) |

---

## Mobile Tips

📱 **On Phone/Tablet**:
- Swipe table left/right to see all columns
- Filters stack vertically - scroll to see all
- Dialogs scroll internally - swipe up/down
- All buttons are touch-friendly (44px min)

---

## Common Tasks

### Find Old Batches
```
1. Click [📅 Date Filter]
2. Set From: [Old Date]
3. Leave To: [Empty] for all after date
4. [Apply Filter]
```

### Fix Batch Mistake
```
1. Find batch → [✏️ Edit]
2. Remove wrong item: [🗑️]
3. Add correct item: Select → [+ Add Item]
4. [Save Changes]
```

### Track Vendor Communication
```
1. [👁️ View] vendor batch
2. Scroll to "Add Note"
3. Type: "Called vendor, will be ready tomorrow"
4. [Add Note] - Timestamp added automatically
```

### See Vendor Contact
```
Method 1: Create Batch → Select vendor → See card
Method 2: View Batch → Vendor Info Card at top
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Date filter not working | Check dates are in correct format |
| Edit button missing | Only appears for "In Progress" status |
| Can't save batch edit | Need at least 1 item in batch |
| Vendor card not showing | Vendor may be missing contact info |
| Table overflow | Scroll horizontally on mobile |
| Dialog too tall | Scroll within dialog |

---

## Data Fields

### Batch Information
- Batch Number (auto-generated)
- Vendor Name
- Sent Date
- Expected Return Date
- Status
- Total Items
- Total Cost
- Notes

### Item Information
- Product Name
- Category
- Quantity
- Condition Before
- Condition After
- Unit Cost
- Total Cost
- Notes

### Vendor Information
- Name
- Contact Person
- Phone
- Email
- Service Type
- Pricing per Item
- Notes

---

## Best Practices

✅ **Do**:
- Add notes for important communications
- Use date filter for monthly reviews
- Edit batches to fix mistakes quickly
- Check vendor details before creating batch
- Use descriptive item notes

❌ **Don't**:
- Edit completed batches (create new instead)
- Delete items unless certain
- Forget to save changes
- Skip vendor contact verification

---

## Tips & Tricks

💡 **Pro Tips**:
1. Add vendor phone to speed dial for quick calls
2. Use date filter for monthly cost tracking
3. Note arrival time when batch returns
4. Check vendor notes before selecting
5. Use item notes for special instructions
6. Mobile users: rotate to landscape for table

---

## Quick Stats

View these stats at top of page:
- 📦 **Total Batches**: All batches
- 🚚 **In Progress**: Currently out
- ⏰ **Total Items**: All items in all batches
- 💰 **Total Cost**: Sum of all batch costs

---

## Support

🆘 **Need Help?**
1. Check `LAUNDRY_PAGE_COMPLETE_SUMMARY.md`
2. See `LAUNDRY_PAGE_VISUAL_GUIDE.md`
3. Review `LAUNDRY_PAGE_TESTING_GUIDE.md`
4. Check code comments in `/app/laundry/page.tsx`

---

## Version Info

- **Version**: 2.0
- **Last Updated**: Oct 20, 2025
- **Features**: 6 new enhancements
- **Status**: ✅ Production Ready

---

**Print this card for quick reference!** 📄

Or bookmark this file: `/LAUNDRY_PAGE_QUICK_REFERENCE.md`
