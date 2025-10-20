# 🔄 Return Processing System - Complete Guide

## Overview

The return processing system allows you to handle returned rental items efficiently, automatically updating inventory and sending items to appropriate destinations (available stock, product archive, or laundry).

---

## 📊 How It Works

### When Items Are Returned, They Can Go To:

1. **🟢 Available Stock** (qty_not_used)
   - Items that were delivered but never used
   - Go directly back to available inventory
   - Skip laundry process

2. **🔵 Laundry** (qty_returned + send_to_laundry = true)
   - Items that were used and need cleaning
   - Automatically creates a laundry batch
   - Updates stock_in_laundry count
   - After laundry, moved to available

3. **🟠 Product Archive - Damaged** (qty_damaged)
   - Items with damage
   - Moved to product_archive table
   - Reason: "damaged"
   - Requires damage details
   - Updates stock_damaged count

4. **🔴 Product Archive - Lost/Stolen** (qty_lost)
   - Missing items
   - Moved to product_archive table
   - Reason: "lost" or "stolen"
   - Reduces total stock count
   - Requires lost/stolen details

---

## 🎯 The Return Processing Form

### Location
Navigate to: **Deliveries Page** → Find a delivery → Click **"Process Return"**

### Form Structure

#### 1. **Product List**
Each product shows:
- Product name and image
- Category
- Quantity delivered
- Four input fields for disposition

#### 2. **Quantity Fields** (Must add up to delivered quantity)

```
Delivered: 10 items

Split into:
├─ Used (Laundry): 6
├─ Not Used (Extra): 2
├─ Damaged: 1
└─ Stolen/Lost: 1
   Total: 10 ✓
```

#### 3. **Damage Details** (If qty_damaged > 0)
- **Damage Reason** (required):
  - Torn
  - Stained
  - Burned
  - Missing Parts
  - Color Fade
  - Shrunk
  - Other
- **Damage Severity**:
  - Minor
  - Moderate
  - Severe
  - Beyond Repair
- **Description**: Detailed notes

#### 4. **Lost/Stolen Details** (If qty_lost > 0)
- **Lost Reason** (required):
  - Lost
  - Stolen
  - Misplaced
  - Other
- **Description**: Detailed explanation

#### 5. **Send to Laundry Checkbox**
- When checked: Used items (qty_returned) go to laundry
- When unchecked: Used items go directly to available stock

#### 6. **General Notes**
- Overall return notes
- Processing comments

---

## 📝 Example Scenarios

### Scenario 1: Perfect Return (All Items Clean)

**Situation**: Customer returns 10 tablecloths, all unused

```
Product: Tablecloth
Delivered: 10

Fill form:
├─ Used (Laundry): 0
├─ Not Used (Extra): 10  ← All items
├─ Damaged: 0
└─ Stolen/Lost: 0

☐ Send to laundry (unchecked - nothing used)

Result:
✅ 10 items added to available stock immediately
✅ No laundry batch created
✅ Customer happy, efficient return
```

---

### Scenario 2: Normal Wedding Return (Used Items)

**Situation**: Wedding dress rental, 5 dresses delivered and used

```
Product: Wedding Dress
Delivered: 5

Fill form:
├─ Used (Laundry): 5  ← All were used
├─ Not Used (Extra): 0
├─ Damaged: 0
└─ Stolen/Lost: 0

☑ Send to laundry (checked - need cleaning)

Result:
✅ Laundry batch auto-created: "LB-RET-123456"
✅ 5 items moved to stock_in_laundry
✅ Batch appears in Laundry Management page
✅ After laundry processing, moved to available
```

---

### Scenario 3: Partial Damage

**Situation**: 10 chairs delivered, 8 used, 1 damaged, 1 lost

```
Product: Chair
Delivered: 10

Fill form:
├─ Used (Laundry): 8
├─ Not Used (Extra): 0
├─ Damaged: 1
│  ├─ Reason: Torn
│  ├─ Severity: Moderate
│  └─ Description: "Seat cushion torn during event"
└─ Stolen/Lost: 1
   ├─ Reason: Lost
   └─ Description: "Could not locate after event cleanup"

☑ Send to laundry (checked)

Result:
✅ 8 chairs to laundry batch
✅ 1 chair archived as damaged
   - Appears in Product Archive
   - Tagged with damage details
✅ 1 chair archived as lost
   - Total stock reduced by 1
   - Financial loss recorded
✅ stock_damaged = +1
✅ stock_total = -1 (for lost item)
```

---

### Scenario 4: Mixed Return (Complex)

**Situation**: Large event, various item conditions

```
Product: Napkins
Delivered: 100

Fill form:
├─ Used (Laundry): 80  ← Most used
├─ Not Used (Extra): 15  ← Extras not used
├─ Damaged: 3  ← Wine stained beyond repair
└─ Stolen/Lost: 2  ← Missing

Damage Details:
- Reason: Stained
- Severity: Beyond Repair
- Description: "Red wine stains, cannot be cleaned"

Lost Details:
- Reason: Lost
- Description: "Missing after event breakdown"

☑ Send to laundry

Result:
✅ 80 napkins → Laundry batch
✅ 15 napkins → Available immediately
✅ 3 napkins → Product Archive (damaged)
✅ 2 napkins → Product Archive (lost)
✅ Comprehensive tracking for all 100 items
```

---

## 🔧 Technical Flow

### 1. Frontend Form Submission
```typescript
// User fills form and clicks "Process Return"
const payload = {
  items: [
    {
      product_id: "...",
      qty_delivered: 10,
      qty_returned: 7,  // Used
      qty_not_used: 2,  // Extra
      qty_damaged: 1,   // Damaged
      qty_lost: 0,      // None lost
      damage_reason: "torn",
      damage_severity: "moderate",
      damage_description: "...",
    }
  ],
  send_to_laundry: true,
  notes: "...",
  processing_notes: "..."
}
```

### 2. API Processing (`/api/returns/[id]/process`)

```
Step 1: Validate quantities
  └─ Ensure qty_returned + qty_not_used + qty_damaged + qty_lost = qty_delivered

Step 2: Insert return_items records
  └─ Track what happened to each item

Step 3: Update product inventory
  ├─ stock_available += qty_not_used + (send_to_laundry ? 0 : qty_returned)
  ├─ stock_in_laundry += (send_to_laundry ? qty_returned : 0)
  ├─ stock_damaged += qty_damaged
  ├─ stock_total -= qty_lost
  └─ stock_booked -= qty_delivered

Step 4: Archive damaged items
  └─ INSERT INTO product_archive (reason='damaged', ...)

Step 5: Archive lost items
  └─ INSERT INTO product_archive (reason='lost', ...)

Step 6: Create laundry batch (if send_to_laundry)
  ├─ Generate batch number: "LB-RET-{timestamp}"
  ├─ INSERT INTO laundry_batches (auto_created=true)
  └─ INSERT INTO laundry_batch_items

Step 7: Update return record
  └─ status = 'completed', processed_at = NOW()
```

### 3. Backend Database Updates

```sql
-- Product inventory update
UPDATE products SET
  stock_available = stock_available + 2,  -- qty_not_used
  stock_in_laundry = stock_in_laundry + 7, -- qty_returned
  stock_damaged = stock_damaged + 1,      -- qty_damaged
  stock_total = stock_total - 0,          -- qty_lost
  stock_booked = stock_booked - 10        -- qty_delivered
WHERE id = :product_id;

-- Archive damaged
INSERT INTO product_archive (
  product_id, reason, quantity,
  damage_reason, severity, notes, ...
) VALUES (...);

-- Create laundry batch
INSERT INTO laundry_batches (
  batch_number, return_id, auto_created,
  status, total_items, notes
) VALUES ('LB-RET-123456', :return_id, true, 'pending', 7, ...);
```

---

## 📊 Viewing Results

### 1. **Product Archive Page**
Navigate to: `/product-archive`

See:
- All damaged items with damage details
- All lost/stolen items
- Filtering by reason, date, product
- Financial impact (lost revenue)

### 2. **Laundry Management Page**
Navigate to: `/laundry`

See:
- Auto-created laundry batches
- Batch number starting with "LB-RET-"
- Status: "pending" (ready to send to vendor)
- Items in batch
- Notes: "Auto-created from return RET-..."

Action:
- Assign to vendor
- Mark as sent
- Track return from laundry
- Items move to available when complete

### 3. **Inventory Page**
Navigate to: `/inventory`

See updated stock counts:
- Available: Increased by qty_not_used
- In Laundry: Increased by qty_returned (if sent)
- Damaged: Increased by qty_damaged
- Total: Decreased by qty_lost

---

## 🎯 Testing Checklist

### Setup Test Data
1. Run `ADD_SAMPLE_RETURN_DATA.sql`
2. Verify returns created in database
3. Check sample products exist

### Test Cases

#### ✅ Test 1: All Items to Available
- [ ] Fill all items in "Not Used" field
- [ ] Uncheck "Send to laundry"
- [ ] Submit
- [ ] Verify stock_available increased
- [ ] No laundry batch created

#### ✅ Test 2: All Items to Laundry
- [ ] Fill all items in "Used" field
- [ ] Check "Send to laundry"
- [ ] Submit
- [ ] Verify laundry batch created
- [ ] Check batch in Laundry page
- [ ] Verify stock_in_laundry increased

#### ✅ Test 3: Damaged Items
- [ ] Enter qty_damaged > 0
- [ ] Fill damage reason (required)
- [ ] Fill damage severity
- [ ] Add description
- [ ] Submit
- [ ] Check Product Archive page
- [ ] Verify damaged item appears
- [ ] Verify stock_damaged increased

#### ✅ Test 4: Lost Items
- [ ] Enter qty_lost > 0
- [ ] Fill lost reason (required)
- [ ] Add description
- [ ] Submit
- [ ] Check Product Archive page
- [ ] Verify lost item appears
- [ ] Verify stock_total decreased

#### ✅ Test 5: Mixed Return
- [ ] Split items across all fields
- [ ] Ensure total = delivered
- [ ] Fill all required details
- [ ] Submit
- [ ] Verify:
  - [ ] Stock updated correctly
  - [ ] Laundry batch created
  - [ ] Archive items added
  - [ ] Return marked completed

#### ✅ Test 6: Validation Errors
- [ ] Try submitting with total ≠ delivered
- [ ] Try damaged without reason
- [ ] Try lost without reason
- [ ] Verify error messages

---

## 🐛 Common Issues & Solutions

### Issue 1: "Quantity mismatch"
**Problem**: Total doesn't equal delivered
**Solution**: Ensure: Used + Not Used + Damaged + Lost = Delivered

### Issue 2: "Damage reason required"
**Problem**: Damaged items without details
**Solution**: Fill in damage reason, severity, and description

### Issue 3: "Lost reason required"
**Problem**: Lost items without explanation
**Solution**: Fill in lost reason and description

### Issue 4: Laundry batch not created
**Problem**: Expected laundry batch but none appeared
**Check**:
- Is "Send to laundry" checked?
- Is qty_returned > 0?
- Check laundry_batches table for errors

### Issue 5: Inventory not updated
**Problem**: Stock counts unchanged
**Check**:
- Return status = 'completed'?
- Check return_items table for records
- Review API logs for errors

---

## 📈 Business Benefits

### For Operations
- ✅ Accurate inventory tracking
- ✅ Automatic laundry batch creation
- ✅ Damage documentation
- ✅ Loss tracking

### For Finance
- ✅ Track damaged item costs
- ✅ Calculate loss from stolen items
- ✅ Replacement decision data
- ✅ Insurance claims documentation

### For Management
- ✅ Return quality metrics
- ✅ Customer handling patterns
- ✅ Product durability insights
- ✅ Operational efficiency

---

## 🚀 Next Steps

1. **Add Sample Data**:
   ```bash
   # Run in Supabase SQL Editor
   # Execute: ADD_SAMPLE_RETURN_DATA.sql
   ```

2. **Test Return Processing**:
   - Go to Deliveries page
   - Find a return (status: scheduled)
   - Click "Process Return"
   - Fill form and submit

3. **Verify Results**:
   - Check Product Archive
   - Check Laundry Management
   - Check Inventory counts

4. **Production Use**:
   - Train staff on form
   - Document your processes
   - Monitor first few returns
   - Gather feedback

---

## 📚 Related Documentation

- `TASK_3_RETURN_NOT_USED_CATEGORY.md` - Return categories explanation
- `/api/returns/[id]/process/route.ts` - Backend API
- `/components/returns/ReturnProcessingDialog.tsx` - Frontend form

---

**Status**: ✅ Fully Functional  
**Last Updated**: October 20, 2025  
**Version**: 2.0
