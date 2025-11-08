# 🎯 Barcode Printer - Quick Setup Guide

**Commit:** `f5780cb`  
**Status:** ✅ LIVE & DEPLOYED

---

## 📋 New Features Added

### 1️⃣ **Number of Barcodes Selector**
- Input field to set exact quantity needed
- Quick buttons: **+5** and **+10** for fast addition
- Auto-generates sequential barcode codes
- Works perfectly for printing multiple items at once

```
Example: You need 50 barcodes
├─ Set Paper: A4
├─ Set Columns: 2
├─ Set Number of Barcodes: 50
├─ View: 2×12 = 24 per page
├─ Total Pages: 3 pages (50 ÷ 24 = 2.08 → 3 pages)
└─ Print!
```

### 2️⃣ **Rotation Controls (Prominent)**
- **Portrait (Normal)** - Standard 50×25mm orientation
- **Landscape (90° Rotated)** - Rotated 25×50mm orientation
- Highlighted in blue when active
- Easy visual feedback

```
Portrait:  [50mm × 25mm]  →  📷 (Tall)
Landscape: [25mm × 50mm]  →  🔄 (Wide)
```

---

## 🎮 Complete Control Panel

### **Print Settings**
```
┌─────────────────────────────────────┐
│  📄 Paper Size                      │
│  [A4 ▼]  (210×297mm)              │
│                                     │
│  🔢 Number of Barcodes: 10          │
│  [10] [+5] [+10]                   │
│                                     │
│  📊 Columns: 2                      │
│  [━━━●━━━━] (1-4 range)             │
│                                     │
│  🔄 Barcode Rotation                │ ← NEW! PROMINENT
│  [📷 Portrait] [🔄 Landscape]       │
│                                     │
│  ↑ Top Margin: 10mm                │
│  [━━━━━●━━━━━]                      │
│                                     │
│  ← Left Margin: 10mm                │
│  [━━━━━●━━━━━]                      │
│                                     │
│  → Right Margin: 10mm               │
│  [━━━━━●━━━━━]                      │
│                                     │
│  📏 Barcode Size: 50×25mm           │
│  [0.5x ── ●── 3x]                  │
│  (25×12.5mm to 150×75mm)           │
│                                     │
│  [➕ Add] [🔨 Print]                │
└─────────────────────────────────────┘
```

---

## 📱 Usage Example: Print 50 Barcodes

### **Step 1: Open Barcode Printer**
```
Inventory → Select Product → View → "Advanced Settings"
```

### **Step 2: Configure Settings**
```
✓ Paper Size: A4
✓ Columns: 2
✓ Number of Barcodes: 50
```

### **Step 3: Watch Live Preview Update**
```
Layout Stats:
├─ Columns: 2
├─ Rows: 12
├─ Per Page: 24
└─ Total Pages: 3
```

### **Step 4: Click Print**
```
→ Browser Print Dialog
→ Select Printer
→ Generate PDF (3 pages)
```

---

## 🚀 Quick Quantity Additions

```
Current: 10 barcodes

Click [+5]:
└─ Now: 15 barcodes (added 5 more)

Click [+10]:
└─ Now: 25 barcodes (added 10 more)

Or Type Directly:
└─ [50] → Instantly: 50 barcodes
```

---

## 🔄 Rotation Feature

### **When to Use Portrait (Normal)**
- Standard barcode printing
- Typical label sheets
- Most common use case
- Default orientation

### **When to Use Landscape (90°)**
- Wide label formats
- Thermal printer wide mode
- Custom label designs
- Space-constrained layouts

### **Effect of Rotation**
```
Portrait (0°):
├─ Width: 50mm
├─ Height: 25mm
└─ Layout: More columns, fewer rows

Landscape (90°):
├─ Width: 25mm
├─ Height: 50mm
└─ Layout: Fewer columns, more rows
```

---

## 📊 Real-Time Layout Statistics

As you adjust settings, the system shows:

```
Paper:    116×210mm
Barcode:  50×25mm
Scale:    100%
Cols:     2
Rows:     12
Per Page: 24 barcodes
Total Pages: 3 (for 50 items)
```

---

## ✨ Key Features

✅ **Simple Number Input** - Type exact quantity  
✅ **Quick Buttons** - +5 and +10 for fast additions  
✅ **Auto-Generate Codes** - Sequential codes created automatically  
✅ **Rotation Toggle** - Portrait/Landscape with visual feedback  
✅ **Live Preview** - See changes instantly  
✅ **Full Page Coverage** - No wasted space  
✅ **Scale Control** - 0.5x to 3x multiplier  
✅ **Responsive Layout** - Works all paper sizes  

---

## 🎯 Common Tasks

### **Print 20 Thermal Labels**
```
1. Paper: Thermal 4×6"
2. Columns: 2
3. Number: 20
4. Rotation: Portrait
5. Print!
```

### **Print 100 A4 Labels**
```
1. Paper: A4
2. Columns: 3
3. Number: 100
4. Click [+5] × 20 (or type 100)
5. Rotation: Portrait
6. Print! (4 pages)
```

### **Wide Format (Landscape)**
```
1. Paper: A4
2. Columns: 2
3. Number: 30
4. Rotation: Landscape
5. Print! (2 pages)
```

---

## 🔧 Advanced Tips

### **Maximize Per-Page Count**
```
→ Reduce Margins (0mm)
→ Increase Columns (3-4)
→ Reduce Scale (0.5x-0.8x)
→ Use Landscape (90°)
Result: 40+ barcodes per page
```

### **Large, Scannable Labels**
```
→ Increase Scale (2x-3x)
→ Reduce Columns (1-2)
→ Increase Margins (5-10mm)
Result: Larger, easier-to-scan barcodes
```

### **Custom Calibration**
```
→ Print test page
→ Measure actual output
→ Adjust margins accordingly
→ Save for future use
```

---

## 💡 Tips & Tricks

| Need | Action |
|------|--------|
| **More per page** | ↑ Columns, ↓ Scale, ↓ Margins |
| **Fewer per page** | ↓ Columns, ↑ Scale, ↑ Margins |
| **Exactly 50 items** | Type `50` in Number field |
| **Add 5 more** | Click `[+5]` button |
| **Rotate labels** | Click `[🔄 Landscape]` button |
| **Thermal printer** | Select "Thermal 4×6"" |
| **Large labels** | Increase Scale to 2x-3x |
| **Compact layout** | Use Landscape + 3-4 columns |

---

## 🎨 Visual Feedback

### **Active Rotation Button**
```
Inactive (Gray):
[📷 Portrait]

Active (Blue):
[📷 Portrait]  ← Blue background, selected
```

---

## 📦 What's Included

✅ Number of Barcodes input  
✅ +5 and +10 quick buttons  
✅ Sequential code generation  
✅ Prominent rotation controls  
✅ Live preview updates  
✅ Auto-layout calculations  
✅ Full page coverage  
✅ All scaling options  

---

## ✅ Deployment Status

**Commit:** `f5780cb`  
**Branch:** `main`  
**Status:** ✅ LIVE ON VERCEL  
**Build:** ✓ Compiled successfully  
**Last Updated:** November 8, 2025

---

**Ready to use!** 🚀
