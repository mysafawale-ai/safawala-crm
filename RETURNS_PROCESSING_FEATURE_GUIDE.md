# 📦 Returns Processing Feature - Complete Guide

## Overview
The **Deliveries & Returns Management** page handles the complete return workflow for rental products. When a delivery is marked as completed, a return is automatically created with all items ready for processing.

---

## 🔄 Return Processing Workflow

### Step 1: Auto-Create Return (Automatic)
When a **delivery status is marked as "delivered"**:
- A return record is automatically created in the database
- Linked to the original booking (product_order or package_booking)
- Status set to "pending"
- Return date from booking's `return_date` or `pickup_date`

### Step 2: Return Items Loading
When you open the **Return Processing Dialog**, the system:
1. **Fetches all delivered items** from the original booking
2. **Pre-fills quantities** from the delivery's handover data (if available)
3. **Calculates defaults**:
   - `qty_returned` = Used items (items that need processing)
   - `qty_not_used` = Extra items never used (can go back to stock)
   - `qty_damaged` = Damaged during use
   - `qty_lost` = Lost or not returned by customer

### Step 3: Manual Return Processing
Users must categorize each returned item:

#### **Category A: Not Used (Extra Items)**
- Items that were never used
- Go back to available stock
- Counted as `qty_not_used`

#### **Category B: Used & Returned (qty_returned)**
Has 3 sub-options:

**Option B1: Send to Laundry** ✨
```
Used Item → Laundry Processing → Cleaned → Back to Stock
```
- Can specify how many items to send to laundry
- Marked with `in_laundry` status in inventory
- Cleaned items return to available stock

**Option B2: Directly to Stock**
```
Used Item → Quality Check → Back to Stock (if okay)
```
- Items go directly to available inventory
- For items that don't need cleaning

**Option B3: Damaged (qty_damaged)**
```
Used Item → Damage Assessment → Damaged Stock
```
- Requires selecting damage reason (torn, stained, burned, etc.)
- Requires severity level (minor, moderate, severe, beyond_repair)
- Marked in inventory as damaged (unusable until repaired)

#### **Category C: Lost/Not Returned (qty_lost)**
```
Customer didn't return → Record as Lost
```
- Requires selecting lost reason:
  - Stolen
  - Lost
  - Not returned by customer
  - Other
- Deducted from inventory permanently

---

## 🎯 Key Features

### 1. **Handover Pre-fill**
If delivery had a "Handover" (document signed by driver listing items not tied/returned):
- `qty_not_used` is pre-populated from handover data
- Saves time in data entry

### 2. **Laundry Management** 🌊
```
Special handling for rentals that need cleaning:
- Separate "qty_to_laundry" field for each item
- Can be bulk selected with "Send All Used Items to Laundry" toggle
- Tracked in inventory as "in_laundry" status
- Cleaned items automatically available again
```

### 3. **Inventory Impact Preview** 📊
Before submitting:
- View how inventory will change
- See all updated stock levels
- Warnings for low stock situations

### 4. **Quantity Validation**
System enforces:
- Total categories = delivered quantity
- Laundry qty ≤ used qty
- All damage reasons documented
- All loss reasons documented

---

## 💡 Example Workflow

### Scenario: Package Rental with 50 Turbans

**Delivered**: 50 turbans

**Return Processing**:
- **10 items** - Not used (extra items kept as backup)
- **35 items** - Used & returned
  - **20 items** → Send to laundry for cleaning ✨
  - **15 items** → Return to stock (already clean)
- **3 items** - Damaged (torn)
- **2 items** - Lost (customer forgot them)

**Total**: 10 + 35 + 3 + 2 = 50 ✅

**Inventory Changes**:
- Extra stock: +10
- Available inventory: +15
- In laundry: +20 (will become available after cleaning)
- Damaged inventory: +3
- Lost/Deducted: -2

---

## 🚀 Return Processing Steps (UI)

### In Deliveries & Returns Page:

1. **Click "Returns" Tab** to see pending returns
2. **Click "Process Return"** button on any return
3. **Return Processing Dialog Opens**:
   - Shows all items from the delivery
   - Displays current stock levels
   - Shows delivered quantities

4. **For Each Item**, specify:
   - **Qty Returned** (used items)
     - With sub-choice: Laundry vs Stock
   - **Qty Not Used** (extra items)
   - **Qty Damaged** (damaged items)
     - Required: Damage reason & severity
   - **Qty Lost** (unreturned items)
     - Required: Loss reason

5. **Optional: Bulk Actions**
   - "Send All Used Items to Laundry" toggle (for convenience)
   - Notes field for processing remarks

6. **Review Preview**
   - Click "Preview Inventory Changes"
   - See updated stock levels
   - Check for warnings

7. **Submit Return**
   - Inventory updated
   - Items marked as processed
   - Return status changed to "completed"

---

## 📊 Data Flow

```
Delivery Created (with items)
    ↓
Delivery Marked as "Delivered"
    ↓
Return Auto-Created (pending)
    ↓
Staff Opens Return Processing
    ↓
Items Categorized (not used, laundry, stock, damaged, lost)
    ↓
Inventory Preview Checked
    ↓
Return Submitted
    ↓
Inventory Updated:
  - Available stock: +qty_returned + qty_not_used + cleaned_items
  - In laundry: +qty_to_laundry
  - Damaged: +qty_damaged
  - Deducted: -qty_lost
```

---

## 🔗 Related Tables

| Table | Purpose |
|-------|---------|
| `deliveries` | Stores delivery records with status |
| `returns` | Auto-created when delivery = delivered |
| `return_items` | Detailed return data per product |
| `inventory` | Stock levels (available, in_laundry, damaged, etc.) |
| `laundry` | Tracks items sent to laundry (optional integration) |

---

## ✅ Benefits

✨ **Automated Workflow** - Returns auto-create when delivery completes
🌊 **Laundry Integration** - Built-in flow for rental cleaning
📊 **Inventory Accuracy** - Real-time stock updates with different categories
⚠️ **Damage & Loss Tracking** - Complete documentation for accountability
🔄 **Flexible Categorization** - Handle all return scenarios (not used, laundry, damaged, lost)

---

## 🎓 Summary

The Returns Processing system handles the complete return lifecycle:

1. **Automatic Creation** - When delivery is completed
2. **Item Categorization** - Not used, laundry, stock, damaged, lost
3. **Laundry Management** - Can route items directly to cleaning
4. **Inventory Update** - Stock levels updated automatically
5. **Damage Documentation** - Track damage reasons and severity
6. **Loss Tracking** - Document why items weren't returned

This ensures every rental item is properly accounted for and the inventory stays accurate! 🎯
