# Barcode Layout Optimization - Zebra ZD230 Thermal Printer

## Overview
Optimized barcode printing layout specifically for **Zebra ZD230 Thermal Transfer Printer** with 4" width and 203 dpi resolution. Each barcode is printed on an individual 4" × 6" thermal label, perfect for warehouse inventory tracking and product scanning.

## Printer Specifications

### Zebra ZD230TA Details
- **Model:** ZD23A42-30GG0GNZ
- **Type:** Thermal Transfer Printer (74M)
- **Width:** 4 inches (101.6mm)
- **Resolution:** 203 dpi
- **Connectivity:** USB, 8 MB Flash RAM/16 MB SD RAM
- **Use Case:** Warehouse scanning, inventory management, product labeling

## Configuration Summary

| Specification | Value |
|---------------|-------|
| **Label Width** | 4 inches (101.6mm) |
| **Label Height** | 6 inches (152.4mm) |
| **Barcode Width** | 90mm |
| **Barcode Height** | 30mm |
| **Barcodes per Page** | 1 |
| **Resolution** | 203 dpi |
| **Format** | CODE128 (Thermal) |
| **Orientation** | Portrait |
| **Margins** | 5mm (all sides) |

## Implementation Details

### 1. barcode-management-dialog.tsx
- Paper format: 4" × 6" (101.6mm × 152.4mm)
- Single barcode per label (1 col × 1 row)
- Barcode width: 90mm (maximum for 4" label)
- Optimized margins: 5mm for thermal printer

### 2. bulk-download-pdf.ts
- `downloadAsSheet()` function optimized for Zebra ZD230
- Custom page size: [101.6mm, 152.4mm]
- Single barcode per page
- Thermal-optimized spacing

### 3. bulk-barcode-download-dialog.tsx
- Layout name: "Thermal Label Printer"
- Description: "Optimized for Zebra ZD230 (4\" × 6\" labels)"
- Preview: "One barcode per 4\" × 6\" thermal label. Perfect for warehouse scanning."

## How to Use

### Printing Barcodes:
1. Navigate to **Inventory** page
2. Select a product
3. Click **"Barcode Management"**
4. Select barcodes to print
5. Click **"Download Selected"** or **"Download Filtered"**
6. Choose **"Thermal Label Printer"** layout
7. Download PDF and send to Zebra ZD230

### Print Settings:
- Paper Size: 4" × 6" (Custom)
- Orientation: Portrait
- Scale: 100% (do NOT scale)
- Quality: Best
- Color: Grayscale or B&W
- Resolution: 203 dpi

## Files Modified

- `components/inventory/barcode-management-dialog.tsx`
- `lib/barcode/bulk-download-pdf.ts`
- `components/inventory/bulk-barcode-download-dialog.tsx`

## Commits

- **b67ee4b**: Optimize barcode layout for Zebra ZD230 thermal printer
- **4977311**: Add comprehensive barcode layout optimization documentation
- **571baf6**: Barcode Layout Optimization: 2 columns, 4.2" paper size

## Status

✅ **Production Ready** - Optimized for Zebra ZD230 thermal printer
✅ **Build Verified** - Zero compilation errors
✅ **TypeScript** - Full type safety maintained
✅ **Backward Compatible** - Other layouts still available

---
**Last Updated:** November 3, 2025
**Printer:** Zebra ZD230 Thermal Transfer Printer (203 dpi, 4" width)
