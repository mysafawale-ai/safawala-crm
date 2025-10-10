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
    JsBarcode(canvas, text, {
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
