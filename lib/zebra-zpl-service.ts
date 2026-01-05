/**
 * Zebra ZPL Barcode Print Service
 * Generates ZPL commands for Zebra ZD230 thermal label printer
 * 
 * Label Size: 25mm × 50mm (2 columns per row)
 * Printer: Zebra ZD230-203dpi ZPL
 * Resolution: 203 dpi (8 dots/mm)
 */

export interface ZebraBarcodeItem {
  code: string
  productName: string
}

export interface ZebraPrintConfig {
  barcodes: ZebraBarcodeItem[]
  labelWidthMM?: number  // Default: 50mm per label
  labelHeightMM?: number // Default: 25mm per label
  columns?: number       // Default: 2
  printDensity?: number  // 0-15, Default: 10
  printSpeed?: number    // 2-6 inches/sec, Default: 4
}

// Zebra ZD230 at 203 DPI = 8 dots per mm
const DOTS_PER_MM = 8

/**
 * Convert mm to dots for ZPL
 */
function mmToDots(mm: number): number {
  return Math.round(mm * DOTS_PER_MM)
}

/**
 * Generate ZPL code for a single barcode label
 */
function generateSingleLabelZPL(
  item: ZebraBarcodeItem,
  labelWidthMM: number,
  labelHeightMM: number
): string {
  const labelWidthDots = mmToDots(labelWidthMM)
  const labelHeightDots = mmToDots(labelHeightMM)
  
  // Barcode positioning (centered)
  const barcodeWidth = mmToDots(40) // 40mm barcode width
  const barcodeX = Math.round((labelWidthDots - barcodeWidth) / 2)
  const barcodeY = mmToDots(3) // 3mm from top
  
  // Text positioning
  const codeTextY = barcodeY + mmToDots(12) // Below barcode
  const nameTextY = codeTextY + mmToDots(4) // Below code
  
  // Truncate product name if too long
  const maxNameLength = 20
  const displayName = item.productName.length > maxNameLength 
    ? item.productName.substring(0, maxNameLength - 2) + '..'
    : item.productName

  return `
^XA
^PW${labelWidthDots}
^LL${labelHeightDots}
^CF0,20
^BY2,3,${mmToDots(10)}
^FO${barcodeX},${barcodeY}^BC,${mmToDots(10)},N,N,N^FD${item.code}^FS
^FO${barcodeX},${codeTextY}^A0N,24,24^FD${item.code}^FS
^FO${barcodeX},${nameTextY}^A0N,18,18^FD${displayName}^FS
^XZ
`.trim()
}

/**
 * Generate ZPL for 2-column layout (2 labels side by side)
 */
function generate2ColumnLabelZPL(
  item1: ZebraBarcodeItem,
  item2: ZebraBarcodeItem | null,
  labelWidthMM: number,
  labelHeightMM: number
): string {
  const totalWidthDots = mmToDots(labelWidthMM * 2) // 100mm total
  const labelHeightDots = mmToDots(labelHeightMM) // 25mm height
  
  // Each label is 50mm wide
  const singleLabelWidth = mmToDots(labelWidthMM)
  
  // Barcode positioning within each label (centered in 50mm)
  const barcodeWidthDots = mmToDots(38) // 38mm barcode width
  const barcodeX1 = Math.round((singleLabelWidth - barcodeWidthDots) / 2)
  const barcodeX2 = singleLabelWidth + barcodeX1
  
  const barcodeY = mmToDots(2) // 2mm from top
  const barcodeHeight = mmToDots(10) // 10mm barcode height
  
  // Text positioning
  const codeTextY = barcodeY + barcodeHeight + mmToDots(1)
  const nameTextY = codeTextY + mmToDots(4)
  
  // Truncate product names
  const maxNameLength = 18
  const displayName1 = item1.productName.length > maxNameLength 
    ? item1.productName.substring(0, maxNameLength - 2) + '..'
    : item1.productName

  let zpl = `
^XA
^PW${totalWidthDots}
^LL${labelHeightDots}
^CF0,18

^BY2,2.5,${barcodeHeight}
^FO${barcodeX1},${barcodeY}^BCN,${barcodeHeight},N,N,N^FD${item1.code}^FS
^FO${barcodeX1},${codeTextY}^A0N,22,22^FD${item1.code}^FS
^FO${barcodeX1},${nameTextY}^A0N,16,16^FD${displayName1}^FS
`

  // Add second label if exists
  if (item2) {
    const displayName2 = item2.productName.length > maxNameLength 
      ? item2.productName.substring(0, maxNameLength - 2) + '..'
      : item2.productName
    
    zpl += `
^FO${barcodeX2},${barcodeY}^BCN,${barcodeHeight},N,N,N^FD${item2.code}^FS
^FO${barcodeX2},${codeTextY}^A0N,22,22^FD${item2.code}^FS
^FO${barcodeX2},${nameTextY}^A0N,16,16^FD${displayName2}^FS
`
  }

  zpl += `^XZ`
  
  return zpl.trim()
}

/**
 * Generate complete ZPL for all barcodes in 2-column layout
 */
export function generateZPL(config: ZebraPrintConfig): string {
  const {
    barcodes,
    labelWidthMM = 50,
    labelHeightMM = 25,
    columns = 2,
    printDensity = 10,
    printSpeed = 4,
  } = config

  if (barcodes.length === 0) {
    return ''
  }

  let zpl = ''
  
  // Add printer configuration at the start
  zpl += `
^XA
^MMT
~SD${printDensity.toString().padStart(2, '0')}
^PR${printSpeed},${printSpeed},${printSpeed}
^XZ
`.trim() + '\n'

  if (columns === 2) {
    // Generate 2-column labels
    for (let i = 0; i < barcodes.length; i += 2) {
      const item1 = barcodes[i]
      const item2 = i + 1 < barcodes.length ? barcodes[i + 1] : null
      zpl += '\n' + generate2ColumnLabelZPL(item1, item2, labelWidthMM, labelHeightMM)
    }
  } else {
    // Generate single column labels
    for (const item of barcodes) {
      zpl += '\n' + generateSingleLabelZPL(item, labelWidthMM, labelHeightMM)
    }
  }

  return zpl
}

/**
 * Download ZPL as a file for manual printing
 */
export function downloadZPL(config: ZebraPrintConfig, filename: string = 'barcodes.zpl'): void {
  const zpl = generateZPL(config)
  const blob = new Blob([zpl], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  
  URL.revokeObjectURL(url)
}

/**
 * Print ZPL directly to Zebra printer via Browser Print (if available)
 * Requires Zebra Browser Print to be installed
 */
export async function printZPLDirect(config: ZebraPrintConfig): Promise<boolean> {
  const zpl = generateZPL(config)
  
  // Try using Zebra Browser Print API
  if (typeof window !== 'undefined' && (window as any).BrowserPrint) {
    try {
      const BrowserPrint = (window as any).BrowserPrint
      
      return new Promise((resolve, reject) => {
        BrowserPrint.getDefaultDevice('printer', (device: any) => {
          if (device) {
            device.send(zpl, () => {
              console.log('ZPL sent successfully')
              resolve(true)
            }, (error: any) => {
              console.error('Error sending ZPL:', error)
              reject(error)
            })
          } else {
            reject(new Error('No Zebra printer found'))
          }
        }, (error: any) => {
          reject(error)
        })
      })
    } catch (error) {
      console.error('Zebra Browser Print error:', error)
      return false
    }
  }
  
  // Fallback: Download ZPL file
  downloadZPL(config)
  return false
}

/**
 * Copy ZPL to clipboard
 */
export async function copyZPLToClipboard(config: ZebraPrintConfig): Promise<void> {
  const zpl = generateZPL(config)
  await navigator.clipboard.writeText(zpl)
}

/**
 * Create printable HTML for thermal labels (fallback when ZPL isn't available)
 * Optimized for Zebra ZD230 with 25mm × 50mm labels in 2-column layout
 */
export function createThermalPrintHTML(config: ZebraPrintConfig): string {
  const {
    barcodes,
    labelWidthMM = 50,
    labelHeightMM = 25,
    columns = 2,
  } = config

  const totalWidthMM = labelWidthMM * columns
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Zebra Label Print - ${barcodes.length} Labels</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    @page {
      size: ${totalWidthMM}mm ${labelHeightMM}mm;
      margin: 0;
    }
    
    @media print {
      html, body {
        width: ${totalWidthMM}mm;
        height: ${labelHeightMM}mm;
        margin: 0;
        padding: 0;
      }
    }
    
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      background: white;
    }
    
    .label-row {
      width: ${totalWidthMM}mm;
      height: ${labelHeightMM}mm;
      display: flex;
      flex-direction: row;
      page-break-after: always;
      page-break-inside: avoid;
    }
    
    .label {
      width: ${labelWidthMM}mm;
      height: ${labelHeightMM}mm;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 1mm;
      box-sizing: border-box;
      overflow: hidden;
    }
    
    .barcode-image {
      width: ${labelWidthMM - 6}mm;
      height: ${labelHeightMM - 12}mm;
      object-fit: contain;
      image-rendering: pixelated;
    }
    
    .barcode-code {
      font-family: 'Courier New', monospace;
      font-size: 8pt;
      font-weight: bold;
      text-align: center;
      margin-top: 0.5mm;
      line-height: 1;
    }
    
    .product-name {
      font-family: Arial, sans-serif;
      font-size: 6pt;
      text-align: center;
      color: #333;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: ${labelWidthMM - 4}mm;
      line-height: 1;
    }
  </style>
</head>
<body>
`

  let bodyContent = ''
  
  // Generate rows with 2 columns each
  for (let i = 0; i < barcodes.length; i += columns) {
    bodyContent += `<div class="label-row">`
    
    for (let col = 0; col < columns; col++) {
      const idx = i + col
      if (idx < barcodes.length) {
        const item = barcodes[idx]
        const displayName = item.productName.length > 20 
          ? item.productName.substring(0, 18) + '..'
          : item.productName
        
        bodyContent += `
          <div class="label">
            <img src="BARCODE_PLACEHOLDER_${idx}" class="barcode-image" alt="Barcode" />
            <div class="barcode-code">${item.code}</div>
            <div class="product-name">${displayName}</div>
          </div>
        `
      } else {
        // Empty placeholder for odd number of barcodes
        bodyContent += `<div class="label"></div>`
      }
    }
    
    bodyContent += `</div>`
  }

  return html + bodyContent + `</body></html>`
}

/**
 * Print thermal labels using HTML (browser-based printing)
 */
export async function printThermalLabels(config: ZebraPrintConfig): Promise<void> {
  const { barcodes } = config
  
  // Generate barcode images
  const JsBarcode = (await import('jsbarcode')).default
  const barcodeImages: string[] = []
  
  for (const item of barcodes) {
    const canvas = document.createElement('canvas')
    canvas.width = 300
    canvas.height = 100
    
    JsBarcode(canvas, item.code, {
      format: 'CODE128',
      width: 2,
      height: 50,
      displayValue: false,
      margin: 0,
    })
    
    barcodeImages.push(canvas.toDataURL('image/png'))
  }
  
  // Create HTML
  let html = createThermalPrintHTML(config)
  
  // Replace placeholders with actual images
  barcodeImages.forEach((image, idx) => {
    html = html.replace(`BARCODE_PLACEHOLDER_${idx}`, image)
  })
  
  // Open print window
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    throw new Error('Could not open print window. Check pop-up blocker.')
  }
  
  printWindow.document.write(html)
  printWindow.document.close()
  
  setTimeout(() => {
    printWindow.print()
  }, 500)
}

/**
 * Get Zebra printer setup instructions
 */
export function getZebraSetupInstructions(): string {
  return `
## Zebra ZD230 Printer Setup for 25mm × 50mm Labels (2 Columns)

### Printer Driver Settings:
1. Open "Devices and Printers" in Windows
2. Right-click on "ZTC ZD230-203dpi ZPL" → Printer Properties
3. Go to "Preferences" or "Printing Preferences"
4. Set the following:

   **Stock Type:** Roll
   **Label Width:** 100mm (4 inches) - for 2 columns of 50mm labels
   **Label Height:** 25mm (1 inch)
   **Orientation:** Portrait
   **Print Speed:** 4 inches/second
   **Darkness:** 10-15

### Label Stock Setup:
- Media Type: Direct Thermal or Thermal Transfer
- Gap/Notch Detection: Gap (between labels)
- Label Format: 2-across (2 columns)

### Calibration:
1. Load label roll into printer
2. Press and hold PAUSE + CANCEL for 2 seconds
3. Printer will auto-calibrate for label size

### Browser Print Settings:
When using "Print" from browser:
- Paper Size: Custom (100mm × 25mm)
- Margins: None / Minimum
- Scale: 100% (Do NOT fit to page)
- Headers/Footers: Off

### For Best Results:
- Use Zebra's direct ZPL printing when possible
- Download ZPL file and send to printer using:
  - Zebra Setup Utilities
  - Command: COPY /B barcodes.zpl LPT1 (Windows)
  - Zebra Browser Print extension
`
}
