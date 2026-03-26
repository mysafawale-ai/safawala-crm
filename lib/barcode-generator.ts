import QRCode from 'qrcode'
import JsBarcode from 'jsbarcode'

export const generateQRCode = async (text: string): Promise<string> => {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(text, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
    return qrCodeDataURL
  } catch (error) {
    console.error('Error generating QR code:', error)
    return ''
  }
}

export const generateBarcode = (text: string): string => {
  try {
    const canvas = document.createElement('canvas')
    JsBarcode(canvas, 'www.safawala.com', {
      format: 'CODE128',
      width: 2,
      height: 100,
      displayValue: false, // Updated to prevent the product code from being rendered twice
      fontSize: 14,
      textMargin: 5
    })
    return canvas.toDataURL()
  } catch (error) {
    console.error('Error generating barcode:', error)
    return ''
  }
}

export interface BarcodeLabelOptions {
  barcodeText: string       // The barcode value (e.g., VAR-12345678)
  variationName?: string    // e.g., "Duppata Red"
  mrp?: number              // Selling price / MRP
}

/**
 * Generates a barcode label image with:
 * 1. Variation / product name
 * 2. safawala.com (small text)
 * 3. MRP - ₹{price}/-
 * 4. Barcode image
 */
export const generateBarcodeLabel = (options: BarcodeLabelOptions): string => {
  try {
    // First generate the raw barcode on a temp canvas
    const barcodeCanvas = document.createElement('canvas')
    JsBarcode(barcodeCanvas, 'www.safawala.com', {
      format: 'CODE128',
      width: 2,
      height: 70,
      displayValue: false,
      margin: 0,
    })

    const padding = 16
    const labelWidth = Math.max(barcodeCanvas.width + padding * 2, 280)
    const lineHeight = 18
    const smallLineHeight = 14

    // Calculate heights for text lines
    let textBlockHeight = 0
    if (options.variationName) textBlockHeight += lineHeight
    textBlockHeight += smallLineHeight // safawala.com
    if (options.mrp !== undefined) textBlockHeight += lineHeight
    textBlockHeight += 6 // spacing before barcode

    const labelHeight = padding + textBlockHeight + barcodeCanvas.height + smallLineHeight + padding

    const canvas = document.createElement('canvas')
    canvas.width = labelWidth
    canvas.height = labelHeight
    const ctx = canvas.getContext('2d')!
    
    // White background
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, labelWidth, labelHeight)

    let y = padding

    // 1. Variation / product name (bold)
    if (options.variationName) {
      ctx.fillStyle = '#000000'
      ctx.font = 'bold 14px Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(options.variationName, labelWidth / 2, y + 12)
      y += lineHeight
    }

    // 2. safawala.com (small)
    ctx.fillStyle = '#555555'
    ctx.font = '10px Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('www.safawala.com', labelWidth / 2, y + 10)
    y += smallLineHeight

    // 3. MRP
    if (options.mrp !== undefined) {
      ctx.fillStyle = '#000000'
      ctx.font = 'bold 13px Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`MRP - ₹${options.mrp}/-`, labelWidth / 2, y + 12)
      y += lineHeight
    }

    y += 6 // spacing

    // 4. Barcode image centered
    const barcodeX = (labelWidth - barcodeCanvas.width) / 2
    ctx.drawImage(barcodeCanvas, barcodeX, y)
    y += barcodeCanvas.height + 2

    // 5. Barcode number (small mono)
    ctx.fillStyle = '#666666'
    ctx.font = '10px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(options.barcodeText, labelWidth / 2, y + 10)

    return canvas.toDataURL()
  } catch (error) {
    console.error('Error generating barcode label:', error)
    return ''
  }
}

export const downloadQRCode = (dataURL: string, filename: string) => {
  const link = document.createElement('a')
  link.href = dataURL
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export const printQRCode = (dataURL: string) => {
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Code</title>
          <style>
            body { 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              height: 100vh; 
              margin: 0; 
            }
            img { 
              max-width: 100%; 
              height: auto; 
            }
          </style>
        </head>
        <body>
          <img src="${dataURL}" alt="QR Code" />
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }
}
