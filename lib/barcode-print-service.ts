/**
 * Barcode Print Service
 * Handles barcode printing and layout generation for thermal printers
 */

interface BarcodeItem {
  code: string
  productName: string
}

interface PrintConfig {
  barcodes: BarcodeItem[]
  columns: number
  leftMargin?: number // in cm
  rightMargin?: number // in cm
  topMargin?: number // in cm
  barcodeScale?: number // 1 = 50×25mm, 1.5 = 75×37.5mm, 2 = 100×50mm
  barcodeRotation?: number // 0° (normal) or 90° (rotated/landscape)
}

/**
 * Generate barcode image using JsBarcode
 */
export async function generateBarcodeImage(code: string): Promise<string> {
  try {
    const JsBarcode = (await import("jsbarcode")).default
    const canvas = document.createElement("canvas")
    canvas.width = 400
    canvas.height = 150

    JsBarcode(canvas, code, {
      format: "CODE128",
      width: 2,
      height: 40,
      displayValue: false,
      margin: 0,
    })

    return canvas.toDataURL("image/png")
  } catch (error) {
    console.error("Error generating barcode image:", error)
    throw new Error("Failed to generate barcode image")
  }
}

/**
 * Generate multiple barcode images
 */
export async function generateMultipleBarcodeImages(
  codes: string[]
): Promise<string[]> {
  const images: string[] = []
  for (const code of codes) {
    const image = await generateBarcodeImage(code)
    images.push(image)
  }
  return images
}

/**
 * Create print HTML with proper barcode grid layout
 * Supports both thermal (4x6") and standard paper (A4, A5, A6)
 */
export function createPrintHTML(config: PrintConfig): string {
  const {
    barcodes,
    columns = 2,
    leftMargin = 1,
    rightMargin = 1,
    topMargin = 1,
    barcodeScale = 1,
    barcodeRotation = 0,
  } = config

  // Base dimensions for barcode labels (50mm × 25mm)
  const BASE_BARCODE_WIDTH_MM = 50
  const BASE_BARCODE_HEIGHT_MM = 25
  
  // Apply scale
  let BARCODE_WIDTH_MM = BASE_BARCODE_WIDTH_MM * barcodeScale
  let BARCODE_HEIGHT_MM = BASE_BARCODE_HEIGHT_MM * barcodeScale

  // For 90° rotation, swap dimensions
  if (barcodeRotation === 90) {
    [BARCODE_WIDTH_MM, BARCODE_HEIGHT_MM] = [BARCODE_HEIGHT_MM, BARCODE_WIDTH_MM]
  }
  const HORIZONTAL_GAP_MM = 2
  const VERTICAL_GAP_MM = 2

  // Base image dimensions (for 50mm × 25mm barcode)
  const BASE_IMAGE_WIDTH_MM = 48
  const BASE_IMAGE_HEIGHT_MM = 14
  const IMAGE_WIDTH_MM = BASE_IMAGE_WIDTH_MM * barcodeScale
  const IMAGE_HEIGHT_MM = BASE_IMAGE_HEIGHT_MM * barcodeScale

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Barcodes Print</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        @page { 
          size: A4; 
          margin: 0;
        }
        
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
          background: white;
          width: 100%;
          height: 100%;
        }
        
        .page {
          width: 210mm;
          height: 297mm;
          page-break-after: always;
          position: relative;
          padding: ${topMargin}cm ${rightMargin}cm 0.5cm ${leftMargin}cm;
          display: flex;
          flex-direction: column;
          margin: 0;
        }
        
        .barcode-grid {
          display: grid;
          grid-template-columns: repeat(${columns}, 1fr);
          grid-gap: 0;
          grid-auto-rows: auto;
          width: 100%;
          height: 100%;
          background: white;
          flex: 1;
          border: 2px solid #333;
          border-collapse: collapse;
        }
        
        .barcode-item {
          width: 100%;
          height: ${BARCODE_HEIGHT_MM}mm;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 0.5mm;
          border: 1px solid #333;
          background: white;
          page-break-inside: avoid;
          font-size: ${6 * barcodeScale}px;
          line-height: 1;
          text-align: center;
          overflow: hidden;
          transform: rotate(${barcodeRotation}deg);
          transform-origin: center;
        }
        
        .barcode-image {
          width: ${IMAGE_WIDTH_MM}mm;
          height: ${IMAGE_HEIGHT_MM}mm;
          margin-bottom: 1mm;
          display: block;
          image-rendering: pixelated;
        }
        
        .barcode-code {
          font-family: 'Courier New', monospace;
          font-size: ${5 * barcodeScale}px;
          font-weight: bold;
          letter-spacing: 0.3px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 100%;
          margin-bottom: 0.2mm;
          line-height: 1;
        }
        
        .product-name {
          font-family: Arial, sans-serif;
          font-size: ${4 * barcodeScale}px;
          color: #333;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 100%;
          line-height: 1;
        }
        
        @media print {
          body { 
            margin: 0;
            padding: 0;
            background: white;
          }
          .page {
            margin: 0;
            padding: ${topMargin}cm ${rightMargin}cm 0.5cm ${leftMargin}cm;
            page-break-after: always;
          }
          .barcode-item {
            border: 1px solid #eee;
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
  `

  // Split barcodes into pages
  const barcodesPerPage = columns * 10 // 10 rows per page
  const pages = Math.ceil(barcodes.length / barcodesPerPage)

  for (let pageNum = 0; pageNum < pages; pageNum++) {
    html += `<div class="page"><div class="barcode-grid">`

    const startIdx = pageNum * barcodesPerPage
    const endIdx = Math.min(startIdx + barcodesPerPage, barcodes.length)

    for (let i = startIdx; i < endIdx; i++) {
      const barcode = barcodes[i]
      html += `
        <div class="barcode-item">
          <img src="IMAGE_PLACEHOLDER_${i}" alt="Barcode" class="barcode-image" />
          <div class="barcode-code">${barcode.code}</div>
          <div class="product-name">${barcode.productName}</div>
        </div>
      `
    }

    html += `</div></div>`
  }

  html += `
    </body>
    </html>
  `

  return html
}


/**
 * Print barcodes to printer
 */
export async function printBarcodes(config: PrintConfig): Promise<void> {
  try {
    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      throw new Error("Could not open print window. Check pop-up blocker.")
    }

    // Generate barcode images
    const barcodeImages = await generateMultipleBarcodeImages(
      config.barcodes.map((b) => b.code)
    )

    // Create HTML
    let html = createPrintHTML(config)

    // Replace image placeholders with actual images
    barcodeImages.forEach((image, index) => {
      html = html.replace(`IMAGE_PLACEHOLDER_${index}`, image)
    })

    printWindow.document.write(html)
    printWindow.document.close()

    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 500)
  } catch (error) {
    console.error("Error printing barcodes:", error)
    throw error
  }
}

/**
 * Get recommended barcodes per page based on 2-column 50mm × 25mm layout
 * 
 * Calculation:
 * - A4 height: 297mm
 * - Margins (top + bottom): 20mm (10mm each)
 * - Available height: 297 - 20 = 277mm
 * - Barcode height + vertical gap: 25mm + 2mm = 27mm
 * - Rows per page: Math.floor(277 / 27) = 10 rows
 * - Columns: 2
 * - Result: 10 rows × 2 columns = 20 barcodes per page
 */
export function getBarcodesPerPage(columns: number = 2): number {
  const pageHeightMM = 297
  const topMarginMM = 10
  const bottomMarginMM = 10
  const barcodeHeightMM = 25
  const verticalGapMM = 2
  
  const availableHeightMM = pageHeightMM - topMarginMM - bottomMarginMM
  const rowHeightMM = barcodeHeightMM + verticalGapMM
  const rows = Math.floor(availableHeightMM / rowHeightMM)
  
  return rows * columns
}
