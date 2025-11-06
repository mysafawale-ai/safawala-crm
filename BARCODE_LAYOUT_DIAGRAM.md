# Barcode Print Layout Diagram

## Paper Setup (A4)
- **Paper Size**: 210mm × 297mm (A4)
- **Total Width**: 210mm
- **Total Height**: 297mm

## Layout Specifications
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  ← 1.5cm →  ┌─────────────┐  ← 1.5cm →  ┌─────────────┐  ← 1.5cm → │
│  Margin     │   Column 1  │  Gap/Space  │   Column 2  │  Margin   │
│             │  (5cm × 2cm)│             │  (5cm × 2cm)│           │
│             └─────────────┘             └─────────────┘           │
│                                                         │
│             Barcode Row 1                              │
│                                                         │
│  ← 1.5cm →  ┌─────────────┐  ← 1.5cm →  ┌─────────────┐  ← 1.5cm → │
│  Margin     │   Column 1  │  Gap/Space  │   Column 2  │  Margin   │
│             │  (5cm × 2cm)│             │  (5cm × 2cm)│           │
│             └─────────────┘             └─────────────┘           │
│                                                         │
│             Barcode Row 2                              │
│                                                         │
│             ... (continues down page)                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Width Calculation
```
Total Width: 210mm

Left Margin:          1.5cm  = 15mm
Column 1:             5cm    = 50mm
Gap Between Columns:  1.5cm  = 15mm
Column 2:             5cm    = 50mm
Right Margin:         1.5cm  = 15mm
─────────────────────────────
TOTAL:               15 + 50 + 15 + 50 + 15 = 145mm ✓ (fits in 210mm)

Remaining Space: 210mm - 145mm = 65mm (for flexibility)
```

## Height Calculation
```
Total Height: 297mm

Each Barcode:         2cm  = 20mm
Spacing Between:      (no space between rows - zero gap) = 0mm
Number of Rows:       297mm ÷ 20mm = ~14 barcodes per column

Approximately 14 × 2 = 28 barcodes per page
```

## CSS Grid Layout
```
Paper: 210mm wide, 297mm tall

Grid Setup:
- 2 columns
- Column 1: starts at 15mm (1.5cm), width 50mm (5cm)
- Gap: 15mm (1.5cm)
- Column 2: starts at 80mm (15+50+15), width 50mm (5cm)
- Right margin: 15mm from edge

Grid: grid-template-columns: 1fr 1fr
      with 15mm left margin on container
      gap: 15mm (between columns)
      width: 170mm (container, accounting for margins and gap)
```

## Barcode Item Specifications
```
┌─────────────────────┐
│    Barcode Image    │ ← 5cm wide × 1.5cm tall
│  (CODE128 format)   │
├─────────────────────┤
│  Code: 69434484234  │ ← Font 7px
│   SW9005 - Tissue   │ ← Font 6px
└─────────────────────┘
Total Height: 2cm (includes image + text)
```

## Print Settings for Thermal Printer
- **Thermal Sticker Size**: 5cm × 2cm
- **Page Format**: A4
- **Margins**: 1.5cm left/right
- **Columns**: 2
- **Row Gap**: 0mm (no space between rows)
- **Font Sizes**: Code 7px, Product 6px
- **Total Barcodes per Page**: ~14 × 2 = 28 barcodes

## Key Points
✅ No spacing between rows (zero gap)
✅ 1.5cm margin on both sides
✅ 5cm × 2cm barcode size exactly
✅ 2 columns layout
✅ Small fonts for code and product name
✅ Grid-based layout for perfect alignment
