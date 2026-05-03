import QRCode from 'qrcode'

export const generateQRCode = async (text: string): Promise<string> => {
  try {
    return await QRCode.toDataURL(text, {
      width: 300,
      margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' },
    })
  } catch (error) {
    console.error('Error generating QR code:', error)
    return ''
  }
}

// Returns inline SVG string — sharp at any printer DPI
export const generateBarcode = async (text: string): Promise<string> => {
  try {
    const JsBarcode = (await import('jsbarcode')).default
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    JsBarcode(svg, text, {
      format: 'CODE128',
      width: 3,
      height: 80,
      displayValue: false,
      margin: 0,
      background: '#FFFFFF',
      lineColor: '#000000',
    })
    return svg.outerHTML
  } catch (error) {
    console.error('Error generating barcode:', error)
    return ''
  }
}

export interface BarcodeLabelOptions {
  barcodeText: string
  variationName?: string
  mrp?: number
}

// Builds a full label as a self-contained HTML string (for embedding in print pages)
export const generateBarcodeLabelHTML = (options: BarcodeLabelOptions, barcodeSVG: string): string => {
  const name = options.variationName
    ? `<div style="font-family:Arial Black,Arial,sans-serif;font-size:9pt;font-weight:900;text-align:center;color:#000;line-height:1.1;">${options.variationName}</div>`
    : ''
  const web = `<div style="font-family:Arial,sans-serif;font-size:6.5pt;font-weight:bold;text-align:center;color:#000;">www.safawala.com</div>`
  const mrp = options.mrp !== undefined
    ? `<div style="font-family:Arial,sans-serif;font-size:7.5pt;font-weight:900;text-align:center;color:#000;">MRP &#8377;${options.mrp}/-</div>`
    : ''
  const bc = `<div style="width:46mm;height:9.5mm;display:flex;align-items:center;justify-content:center;overflow:hidden;">${barcodeSVG.replace(/width="[^"]*"/, 'width="46mm"').replace(/height="[^"]*"/, 'height="9.5mm"')}</div>`
  const code = `<div style="font-family:'Courier New',monospace;font-size:7pt;font-weight:bold;text-align:center;color:#000;">${options.barcodeText}</div>`

  return `<div style="width:50mm;height:25mm;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:1mm;gap:0.4mm;overflow:hidden;box-sizing:border-box;">${name}${web}${mrp}${bc}${code}</div>`
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
  const win = window.open('', '_blank')
  if (win) {
    win.document.write(`<html><head><title>QR Code</title><style>body{display:flex;justify-content:center;align-items:center;height:100vh;margin:0;}img{max-width:100%;height:auto;}</style></head><body><img src="${dataURL}" /></body></html>`)
    win.document.close()
    win.print()
  }
}
