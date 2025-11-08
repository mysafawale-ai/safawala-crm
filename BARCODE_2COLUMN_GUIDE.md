# 2-Column Barcode Implementation Guide (50mm × 25mm)

## Problem Analysis
Current implementation issues:
- Uneven barcode sizes (5cm vs 4.8cm inconsistencies)
- Manual margin calculations causing alignment issues
- Grid gap problems affecting layout
- No fixed row height for uniform appearance

## Solution: Precise 2-Column Layout

### Paper Setup (A4: 210mm × 297mm)
```
Layout Calculation:
├─ Left Margin: 10mm
├─ Right Margin: 10mm
├─ Content Width: 210 - 10 - 10 = 190mm
│
├─ Column Width: 190mm / 2 = 95mm per column
├─ Barcode Width: 50mm (fits within 95mm)
├─ Horizontal Gap: (95 - 50) / 2 = 22.5mm padding per side
│
├─ Top Margin: 10mm
├─ Barcode Height: 25mm
├─ Vertical Gap: 2mm between rows
│
├─ Barcodes per page (rows): 
│   (297 - 20) / (25 + 2) = 277 / 27 = 10 rows per page
│   Total per page: 10 rows × 2 columns = 20 barcodes
└─ Pages needed for 40 products: 2 pages
```

## CSS Grid Setup
```css
.barcode-grid {
  display: grid;
  grid-template-columns: 50mm 50mm;  /* 2 columns × 50mm */
  grid-gap: 2mm 0;                   /* 2mm vertical, 0 horizontal */
  width: 100%;
  place-items: center;               /* Center barcode items */
}

.barcode-item {
  width: 50mm;
  height: 25mm;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 1mm;
  border: 0.5pt dashed #ccc;
  page-break-inside: avoid;
}
```

## Barcode Content Layout
```
┌─────────────────────────────┐
│     50mm × 25mm Label        │
│                             │
│  ┌──────────────────────┐  │
│  │  [BARCODE IMAGE]     │  │
│  │   40mm × 12mm        │  │
│  └──────────────────────┘  │
│                             │
│  80001001001 (barcode text) │
│  Safa - Red Traditional     │
│                             │
└─────────────────────────────┘
```

## Implementation Steps

### Step 1: Update barcode-printer.tsx
```tsx
const BARCODE_WIDTH_MM = 50
const BARCODE_HEIGHT_MM = 25
const COLUMNS = 2
const VERTICAL_GAP_MM = 2
const HORIZONTAL_MARGIN_MM = 10
const TOP_MARGIN_MM = 10

// Calculate barcodes per page
const barcodes_per_page = Math.floor((297 - 20) / (BARCODE_HEIGHT_MM + VERTICAL_GAP_MM)) * COLUMNS
```

### Step 2: Update barcode-print-service.ts
Key CSS changes:
```css
@page {
  size: A4;
  margin: 10mm 10mm;
}

.barcode-grid {
  display: grid;
  grid-template-columns: repeat(2, 50mm);
  grid-gap: 2mm 0;
  width: 100%;
}

.barcode-item {
  width: 50mm;
  height: 25mm;
  padding: 1mm;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
}

.barcode-image {
  width: 40mm;
  height: 12mm;
}

.barcode-code {
  font-size: 6pt;
  font-family: 'Courier New';
  margin-top: 0.5mm;
}

.product-name {
  font-size: 5pt;
  margin-top: 0.2mm;
  max-width: 48mm;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

### Step 3: Create Batch Print Component
For 40 products → 2 pages automatically

```tsx
// New feature: Auto-batch printing
generateBatches(items: Product[], itemsPerPage: number = 20) {
  const batches = []
  for (let i = 0; i < items.length; i += itemsPerPage) {
    batches.push(items.slice(i, i + itemsPerPage))
  }
  return batches
}
```

## Testing Checklist
- [ ] Print test page with 10 barcodes (1 page, 5 rows × 2 columns)
- [ ] Verify 50mm × 25mm alignment
- [ ] Check barcode clarity and scanner readability
- [ ] Verify page breaks on 20-barcode limit
- [ ] Print all 40 products (auto-generates 2 pages)
- [ ] Test margins are correct (10mm)
- [ ] Verify vertical spacing (2mm gaps)

## Quick Implementation (30 mins)

1. **Update Constants** (barcode-printer.tsx)
   - Set fixed dimensions: 50mm × 25mm
   - Set columns: 2
   - Calculate rows per page

2. **Update CSS** (barcode-print-service.ts)
   - Grid: 2 columns × 50mm
   - Gap: 2mm vertical, 0 horizontal
   - Margins: 10mm

3. **Test with 40 products**
   - Should auto-generate 2 PDF pages
   - All barcodes uniform size

4. **Print on 50mm × 25mm labels**
   - Standard label sheets available on Amazon

## Result
✅ 2 columns × 10 rows per page = 20 barcodes/page
✅ 40 products = 2 pages automatically
✅ Uniform 50mm × 25mm sizing
✅ Perfect alignment for label printing
