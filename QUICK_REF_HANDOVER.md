# 🚀 Unified Handover - Quick Reference Guide

## 🎯 What This Does

When a delivery is marked as **"delivered"**, a **unified handover form** opens where you can:

1. **Capture Recipient Info** - Name & phone of person who received it
2. **Take Photo** - Photo of items at delivery/handover time
3. **Get Signature** - Digital signature for proof of delivery
4. **Categorize Items:**
   - ✓ **Used** → Goes to Laundry
   - ✓ **Not Used** → Returns to Available Inventory
   - ✓ **Damaged** → Goes to Archive (+ reason documented)
   - ✓ **Lost** → Goes to Archive (+ noted as lost)

Then **automatically:**
- ✅ Updates inventory
- ✅ Creates laundry batch entries
- ✅ Creates archive entries
- ✅ Creates return record
- ✅ Stores photos & signature

---

## 📱 UI Flow

```
Deliveries Page
    ↓
[Mark Delivered Button]
    ↓
Dialog Opens with 4 Tabs
├─ Tab 1: Recipient (Name & Phone)
├─ Tab 2: Photo (Upload/Capture)
├─ Tab 3: Items (Categorize: Used/Not Used/Damaged/Lost)
└─ Tab 4: Signature (Draw with mouse)
    ↓
[Complete Handover Button]
    ↓
✅ Done! All data saved
```

---

## 🔄 What Happens Behind the Scenes

### Item Processing:

| Qty Category | Goes To | Inventory Update |
|--------------|---------|------------------|
| **Used** | Laundry Batch | Removed from booked |
| **Not Used** | Inventory (Available) | +1 available, -1 booked |
| **Damaged** | Product Archive | -1 available, -1 booked |
| **Lost** | Product Archive | -1 available, -1 booked |

### Automatic Actions:

✅ **Photo & Signature** → Uploaded to cloud storage  
✅ **Inventory** → Updated in products table  
✅ **Laundry** → Items added to laundry batch (if rental)  
✅ **Archive** → Damaged/lost items documented  
✅ **Return** → Auto-created with status "completed" (if rental)  

---

## 📋 Form Fields

### Tab 1: Recipient
- **Name*** (required) - Full name of person receiving
- **Phone*** (required) - Contact number

### Tab 2: Photo
- **Photo*** (required) - Image of items at handover
- Can upload file or capture from camera

### Tab 3: Items
For each product delivered:
- **Used (→Laundry)** - Qty used by customer
- **Not Used (→Inventory)** - Qty not used, returning
- **Damaged (→Archive)** - Qty damaged
  - *Reason* - Select: Stain/Tear/Burn/Fade/Button/Smell/Other
  - *Notes* - Describe damage details
- **Lost (→Archive)** - Qty lost/missing

**Validation:** Sum of all quantities must equal qty_delivered

### Tab 4: Signature
- **Signature Pad*** (required) - Draw signature with mouse
- [Clear Signature] button to redraw

---

## ✅ Validation Rules

Before submitting:
- ✅ Recipient name filled in
- ✅ Recipient phone filled in
- ✅ Photo captured
- ✅ All items categorized (sum = delivered qty)
- ✅ Damaged items have reason selected
- ✅ Signature drawn

---

## 🐛 Common Scenarios

### Scenario 1: Items in Good Condition
```
Delivered: 5 Safas
├─ Used: 0
├─ Not Used: 5  (all back to inventory)
├─ Damaged: 0
└─ Lost: 0
```

### Scenario 2: Mix of Good & Damaged
```
Delivered: 5 Safas
├─ Used: 2      (to laundry)
├─ Not Used: 2  (to inventory)
├─ Damaged: 1   (to archive - stain)
└─ Lost: 0
```

### Scenario 3: Something Lost
```
Delivered: 5 Safas
├─ Used: 3      (to laundry)
├─ Not Used: 1  (to inventory)
├─ Damaged: 0
└─ Lost: 1      (to archive)
```

---

## 📊 Where Data is Stored

| Data | Storage Location |
|------|------------------|
| **Recipient Info** | deliveries table |
| **Photo** | Supabase Storage (delivery-handovers bucket) |
| **Signature** | Supabase Storage (delivery-handovers bucket) |
| **Item Categorization** | delivery_handover_items table |
| **Damage Details** | delivery_handover_items table |
| **Inventory Updates** | products table |
| **Laundry Queue** | laundry_batch_items table |
| **Archive Entries** | product_archive table |
| **Return Record** | returns table |

---

## 🔐 Permissions Required

You need:
- ✅ Role: Staff or higher
- ✅ Permission: "deliveries"
- ✅ Franchise: Must match delivery's franchise

---

## 🚀 Quick Start

1. Go to **Deliveries** page
2. Find a **pending** delivery
3. Click **"Start Transit"** (changes to in_transit)
4. Click **"Mark Delivered"** (changes to delivered)
5. **Unified Handover Dialog** automatically opens
6. Fill in all 4 tabs
7. Click **"Complete Handover"**
8. ✅ Done!

---

## ⚡ Pro Tips

✅ **Tab Order Tips:**
- Do Recipient first (quick)
- Do Photo second (capture immediately)
- Do Items third (need more thought)
- Do Signature last (verify then sign)

✅ **Photo Tips:**
- Capture items in good lighting
- Include full view of all products
- Take photo at handover time

✅ **Damage Notes Tips:**
- Be specific: "Coffee stain on collar"
- Include size: "2cm diameter hole"
- Note location: "Back left shoulder"

✅ **Signature Tips:**
- Use trackpad or mouse
- Don't worry about perfect signature
- Just needs to be consistent

---

## 🐛 Troubleshooting

### Q: Dialog won't open
**A:** Make sure:
- Delivery status is "in_transit"
- Click "Mark Delivered" first
- No browser console errors

### Q: Photo upload fails
**A:** Check:
- File size < 50MB
- Browser allows camera/file access
- Internet connection is stable

### Q: Quantities don't match
**A:** The form tells you how many are unassigned
- Adjust numbers until sum = delivered

### Q: Can't draw signature
**A:** Try:
- Use Chrome or Firefox
- Enable JavaScript
- Try using trackpad instead of mouse

### Q: Nothing happens after submit
**A:** Check:
- Are all required fields filled (*)
- Internet connection
- Browser console for errors

---

## 📞 Need Help?

See detailed docs:
- **UNIFIED_HANDOVER_SYSTEM.md** - Complete system docs
- **DEPLOYMENT_UNIFIED_HANDOVER.md** - Deployment & troubleshooting
- **VISUAL_HANDOVER_FLOW.md** - Process diagrams

---

## 🎯 Key Differences from Old Process

| Aspect | Old | New |
|--------|-----|-----|
| **Steps** | Handover then Returns tab | Single form |
| **Photos** | Not captured | Required & stored |
| **Signature** | Not captured | Required & stored |
| **Items** | Simple not-tied | Full categorization |
| **Damage** | No tracking | Tracked with reason |
| **Inventory** | Manual updates | Auto-updated |
| **Time** | ~5 min | ~2 min |
| **Errors** | More manual steps = more mistakes | Automated = fewer errors |

---

## ✨ Summary

This unified handover makes delivery completion:
- ✅ **Faster** - One form instead of multiple steps
- ✅ **Easier** - Clean tabbed interface
- ✅ **Accurate** - Automatic inventory updates
- ✅ **Transparent** - Photos & signatures for audit
- ✅ **Complete** - Nothing forgotten or skipped

**Just follow the tabs, fill the fields, and submit. Everything else is automatic!**

🚀 **Happy delivering!**
