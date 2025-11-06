# Barcode Print Layout - Visual Specifications

## Diagram: Paper Layout (A4)

```
A4 Paper (210mm × 297mm)
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│ ← 1.5cm →  ┌──────────────┐ ← 1.5cm → ┌──────────────┐ ← 1.5cm →  │
│  MARGIN    │   5cm × 2cm  │  MARGIN   │   5cm × 2cm  │  MARGIN   │
│            │   BARCODE 1  │           │   BARCODE 2  │            │
│            │              │           │              │            │
│            │   [IMAGE]    │           │   [IMAGE]    │            │
│            │   69434...   │           │   69434...   │            │
│            │   Onion Pink │           │   Onion Pink │            │
│            └──────────────┘           └──────────────┘            │
│                                                                     │
│ ← 1.5cm →  ┌──────────────┐ ← 1.5cm → ┌──────────────┐ ← 1.5cm →  │
│  MARGIN    │   5cm × 2cm  │  MARGIN   │   5cm × 2cm  │  MARGIN   │
│            │   BARCODE 3  │           │   BARCODE 4  │            │
│            │              │           │              │            │
│            │   [IMAGE]    │           │   [IMAGE]    │            │
│            │   69434...   │           │   69434...   │            │
│            │   Onion Pink │           │   Onion Pink │            │
│            └──────────────┘           └──────────────┘            │
│                                                                     │
│ ... (continues for ~14 rows = 28 barcodes total per page)         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Width Breakdown (210mm total)
```
1.5cm (Left Margin) + 5cm (Col 1) + 1.5cm (Gap) + 5cm (Col 2) + 1.5cm (Right Margin)
15mm + 50mm + 15mm + 50mm + 15mm = 145mm used of 210mm available ✓
```

## Height Breakdown (297mm total)
```
Each Barcode Row: 2cm (20mm)
Number of Rows: 297mm ÷ 20mm = 14.85 rows ≈ 14-15 barcodes per column
Total Barcodes per page: 14 rows × 2 columns = 28 barcodes
```

## Individual Barcode Cell (5cm × 2cm)
```
┌─────────────────┐
│                 │  ← 1.2cm height for barcode image
│  [BARCODE IMG]  │    (width 4.8cm, auto height)
│                 │
├─────────────────┤
│ 69434484234     │  ← 7px font (monospace)
├─────────────────┤
│ Onion Pink      │  ← 6px font (product name)
│                 │
└─────────────────┘
Total: 5cm wide × 2cm tall
```

## CSS Grid Implementation
```css
.barcode-grid {
  display: grid;
  grid-template-columns: repeat(2, 5cm);  /* 2 columns of 5cm each */
  gap: 1.5cm;                              /* 1.5cm gap between columns */
  padding: 1.5cm;                          /* 1.5cm margin all around */
  width: 210mm;
  height: 297mm;
}

.barcode-item {
  width: 5cm;
  height: 2cm;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
```

## Print Settings
- **Paper Size**: A4 (210mm × 297mm)
- **Orientation**: Portrait
- **Margins**: 1.5cm (handled by container padding)
- **Barcode Size**: 5cm × 2cm
- **Barcode Format**: CODE128
- **Font Sizes**: 
  - Barcode Number: 7px (monospace)
  - Product Name: 6px (sans-serif)
- **Spacing Between Rows**: 0mm (no gap)
- **Spacing Between Columns**: 1.5cm
- **Columns**: 2 (configurable to 1, 3, 4)

## Features
✅ Exactly 5cm × 2cm barcode size
✅ 1.5cm margins on both sides
✅ 1.5cm gap between columns
✅ No spacing between rows (zero gap)
✅ Small, readable fonts
✅ Fits perfectly on A4 paper
✅ ~28 barcodes per page with 2 columns
✅ Configurable columns (1-4)
✅ Dashed border for visual guidance during printing

## Next Steps
1. Test with actual barcode data
2. Verify print output matches specifications
3. Adjust if needed based on printer hardware
4. Create QR code option if needed
