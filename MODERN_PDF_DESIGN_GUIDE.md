# Modern PDF Design Implementation Guide

## Overview
Created an alternative modern PDF design for quotes with a cleaner, card-based layout. Users can now choose between two PDF designs: **Classic** and **Modern**.

## Files Created

### 1. `/lib/pdf/pdf-service-modern.ts`
A completely new PDF generation service with modern design features:
- **Card-based layout** with rounded corners and subtle shadows
- **Clean typography** with better spacing
- **Side-by-side information cards** for customer/document info
- **Color-coded sections** using branding colors
- **Modern badges** for document type and status
- **Enhanced visual hierarchy** with better use of whitespace
- **Professional footer** with company branding
- **Image support** for logo, signature, and QR codes

**Key Design Differences from Classic:**
| Feature | Classic | Modern |
|---------|---------|--------|
| Layout | Linear, top-to-bottom | Card-based with columns |
| Headers | Bold text with underlines | Color badges with rounded corners |
| Tables | Standard table with borders | Clean table with alternating row colors |
| Colors | Minimal use | Strategic use of branding colors |
| Spacing | Compact | Generous whitespace |
| Visual Style | Traditional/formal | Contemporary/clean |

### 2. `/lib/pdf/generate-quote-pdf.ts`
A wrapper function that allows switching between PDF designs:

```typescript
export type PDFDesignType = "classic" | "modern"

export async function downloadQuotePDF(
  quote: Quote,
  franchiseId: string | undefined,
  design: PDFDesignType = "classic"
): Promise<void>
```

**Features:**
- Accepts `design` parameter ("classic" or "modern")
- Uses same data preparation for both designs
- Downloads PDF with design name in filename (e.g., `QT001_modern.pdf`)
- Provides `generateQuotePDFBlob` for preview without download

## Integration with Quotes Page

### State Addition
Add PDF design selector state to both `QuotesPageContent` and `QuotesPage` components:

```typescript
const [pdfDesign, setPdfDesign] = useState<PDFDesignType>("classic")
```

### Update handleDownloadPDF Function

**Current code (both components at lines ~355 and ~1333):**
```typescript
const handleDownloadPDF = async (quote: Quote) => {
  try {
    // TODO: Get franchise_id from user session
    const franchiseId = undefined // Replace with actual franchise_id from auth context
    
    await downloadQuotePDF(quote, franchiseId)

    toast({
      title: "Success",
      description: `Quote PDF downloaded successfully`,
    })
  } catch (error) {
    console.error("Error downloading PDF:", error)
    toast({
      title: "Error",
      description: "Failed to download quote PDF. Please try again.",
      variant: "destructive",
    })
  }
}
```

**Updated code (apply to BOTH components):**
```typescript
const handleDownloadPDF = async (quote: Quote) => {
  try {
    const franchiseId = user?.franchise_id
    if (!franchiseId) {
      console.warn("[PDF Download] No franchise_id available")
    }
    
    await downloadQuotePDF(quote, franchiseId, pdfDesign)

    toast({
      title: "Success",
      description: `Quote PDF (${pdfDesign}) downloaded successfully`,
    })
  } catch (error) {
    console.error("Error downloading PDF:", error)
    toast({
      title: "Error",
      description: "Failed to download quote PDF. Please try again.",
      variant: "destructive",
    })
  }
}
```

### UI Component for PDF Design Selector

Add this selector before the download button in the quotes table and detail view:

```typescript
{/* PDF Design Selector */}
<Select value={pdfDesign} onValueChange={(value: PDFDesignType) => setPdfDesign(value)}>
  <SelectTrigger className="w-[140px]">
    <SelectValue placeholder="PDF Design" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="classic">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4" />
        Classic
      </div>
    </SelectItem>
    <SelectItem value="modern">
      <div className="flex items-center gap-2">
        <Package className="h-4 w-4" />
        Modern
      </div>
    </SelectItem>
  </SelectContent>
</Select>
```

### Recommended Placement

**1. In the main header actions (around line ~600):**
```typescript
<div className="flex items-center gap-2">
  {/* PDF Design Selector */}
  <Select value={pdfDesign} onValueChange={(value: PDFDesignType) => setPdfDesign(value)}>
    <SelectTrigger className="w-[140px]">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="classic">Classic PDF</SelectItem>
      <SelectItem value="modern">Modern PDF</SelectItem>
    </SelectContent>
  </Select>

  <Button onClick={() => router.push("/quotes/create")}>
    <Plus className="mr-2 h-4 w-4" />
    New Quote
  </Button>
</div>
```

**2. In the quote detail dialog actions (around line ~1090):**
```typescript
<div className="flex gap-2">
  {/* PDF Design Selector */}
  <Select value={pdfDesign} onValueChange={(value: PDFDesignType) => setPdfDesign(value)}>
    <SelectTrigger className="w-[130px]">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="classic">Classic</SelectItem>
      <SelectItem value="modern">Modern</SelectItem>
    </SelectContent>
  </Select>

  <Button
    size="sm"
    variant="outline"
    onClick={() => handleDownloadPDF(selectedQuote)}
  >
    <Download className="mr-2 h-4 w-4" />
    Download
  </Button>
</div>
```

## Modern PDF Design Features

### Visual Elements

1. **Header Section:**
   - Logo/initial in rounded square with primary color
   - Company name in large, bold font
   - Document type badge in top-right corner
   - Clean bottom border in primary color

2. **Information Cards:**
   - Light gray background with rounded corners
   - Subtle border
   - White title bar with bold text
   - Organized in two-column layout

3. **Items Table:**
   - Clean design with alternating row colors
   - Primary color header
   - Right-aligned numbers for better readability
   - Generous cell padding

4. **Pricing Summary:**
   - Card format with light background
   - Total highlighted with primary color background
   - Advanced/balance shown in accent color
   - Right-aligned for financial data

5. **Banking Section:**
   - Accent color border (green) for emphasis
   - QR code integrated with "Scan to Pay" label
   - Two-column layout for bank details

6. **Footer:**
   - Light gray background bar
   - Company info centered
   - Signature lines with image support
   - "Computer-generated document" disclaimer

### Color Usage

The modern design strategically uses branding colors:
- **Primary Color:** Headers, badges, total section
- **Secondary Color:** Secondary text, labels
- **Accent Color:** Special instructions, payment highlights
- **Light Background:** Card backgrounds, alternating rows
- **White:** Clean contrast areas

## Usage Example

```typescript
import { downloadQuotePDF } from "@/lib/pdf/generate-quote-pdf"

// Download classic design
await downloadQuotePDF(quote, franchiseId, "classic")

// Download modern design  
await downloadQuotePDF(quote, franchiseId, "modern")

// Get blob for preview
import { generateQuotePDFBlob } from "@/lib/pdf/generate-quote-pdf"
const pdfBlob = await generateQuotePDFBlob(quote, franchiseId, "modern")
const url = URL.createObjectURL(pdfBlob)
// Use url for preview
```

## Testing Checklist

- [ ] PDF design selector appears in UI
- [ ] Classic design generates correctly
- [ ] Modern design generates correctly
- [ ] Logo loads from branding settings
- [ ] Signature renders in footer
- [ ] QR code displays in banking section
- [ ] Colors match branding settings
- [ ] All customer/event/delivery data renders
- [ ] Items table shows all products
- [ ] Pricing calculations are correct
- [ ] Terms & conditions display properly
- [ ] Multi-page PDFs handle page breaks correctly
- [ ] Downloaded filename includes design name

## Future Enhancements

1. **PDF Preview Modal:** Show PDF in browser before download
2. **Template Management:** Save design preference per franchise
3. **Custom Templates:** Allow users to create custom PDF designs
4. **Email Integration:** Send quotes via email with selected design
5. **Watermark Option:** Add draft watermark for unsent quotes
6. **Multi-language Support:** Translate PDF content based on locale
7. **Print Optimization:** Add print-specific CSS for better quality

## Technical Notes

- Both PDF services use the same `DocumentData` interface
- Data preparation is centralized in `prepare-quote-pdf.ts`
- Images are loaded asynchronously as base64 data URLs
- jsPDF and jspdf-autotable are used for rendering
- Page breaks are automatically managed
- Color values are converted from hex to RGB for jsPDF

## Support

For issues or questions:
1. Check browser console for error messages
2. Verify branding settings have logo/signature URLs
3. Ensure franchiseId is properly passed
4. Test with simple quotes first (fewer items)
5. Check network tab for image loading failures
