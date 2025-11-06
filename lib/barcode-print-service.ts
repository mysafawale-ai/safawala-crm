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
 * Create print HTML with barcode grid layout
 * Barcode size: 5cm × 2.5cm
 * Margins: 1.5cm from sides
 * Gap between columns: 0mm
 */
export function createPrintHTML(config: PrintConfig): string {
  const {
    barcodes,
    columns,
    leftMargin = 1.5,
    rightMargin = 1.5,
    topMargin = 1.5,
  } = config

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Barcodes Print</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { margin: 0; padding: 0; }
        @page { 
          size: A4; 
          margin: 0; 
        }
        body {
          font-family: Arial, sans-serif;
          background: white;
          margin: 0;
          padding: ${topMargin}cm ${rightMargin}cm ${topMargin}cm ${leftMargin}cm;
          width: 210mm;
          height: 297mm;
        }
        .barcode-grid {
          display: grid;
          grid-template-columns: repeat(${columns}, 5cm);
          gap: 0;
          width: 100%;
          background: white;
        }
        .barcode-item {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 2mm;
          margin: 0;
          width: 5cm;
          height: 2.5cm;
          border: 1px dashed #999;
          position: relative;
        }
        .barcode-image {
          width: 4.8cm;
          height: 1.2cm;
          display: block;
          margin: 0;
          padding: 0;
        }
        .barcode-code {
          font-family: 'Courier New', monospace;
          font-size: 7px;
          font-weight: bold;
          margin-top: 0.5mm;
          text-align: center;
          letter-spacing: 0.3px;
          line-height: 1;
        }
        .product-name {
          font-family: Arial, sans-serif;
          font-size: 6px;
          margin-top: 0.3mm;
          text-align: center;
          color: #333;
          max-width: 4.8cm;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          line-height: 1;
        }
        @media print {
          body { margin: 0; padding: ${topMargin}cm ${rightMargin}cm ${topMargin}cm ${leftMargin}cm; }
          .barcode-item { border: 1px dashed #999; page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="barcode-grid">
  `

  barcodes.forEach((barcode, index) => {
    html += `
      <div class="barcode-item">
        <img src="IMAGE_PLACEHOLDER_${index}" alt="Barcode" class="barcode-image" />
        <div class="barcode-code">${barcode.code}</div>
        <div class="product-name">${barcode.productName}</div>
      </div>
    `
  })

  html += `
      </div>
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
 * Get recommended barcodes per page based on columns and paper size
 */
export function getBarcodesPerPage(columns: number): number {
  // A4 height: 297mm, each barcode: 25mm (2.5cm)
  // Top margin: 15mm, bottom margin: 15mm
  // Available height: 297 - 30 = 267mm
  // Rows: 267 / 25 = ~10.68 rows
  const rows = Math.floor((297 - 30) / 25)
  return rows * columns
}
