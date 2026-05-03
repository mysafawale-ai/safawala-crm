"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Printer } from "lucide-react"
import { toast } from "sonner"

interface BarcodePrinterProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productCode: string
  productName: string
  productPrice?: number
}

// High-res canvas PNG — reliable across all browsers and print drivers
async function makeBarcodeDataURL(value: string): Promise<string> {
  const JsBarcode = (await import("jsbarcode")).default
  const canvas = document.createElement("canvas")
  // Generate at 4× printer resolution for sharp output on ZD230-203dpi
  // 44mm × 8dpmm × 4 = 1408px wide, 10mm × 8dpmm × 4 = 320px tall
  canvas.width = 1400
  canvas.height = 320
  JsBarcode(canvas, value, {
    format: "CODE128",
    width: 5,
    height: 260,
    displayValue: false,
    margin: 10,
    background: "#FFFFFF",
    lineColor: "#000000",
  })
  return canvas.toDataURL("image/png")
}

// Print via hidden iframe — no popup, no race condition, works everywhere
function printViaIframe(html: string): void {
  const iframe = document.createElement("iframe")
  iframe.style.cssText = "position:fixed;width:0;height:0;border:0;left:-9999px;top:-9999px;"
  document.body.appendChild(iframe)

  const doc = iframe.contentDocument || iframe.contentWindow?.document
  if (!doc) {
    document.body.removeChild(iframe)
    return
  }

  doc.open()
  doc.write(html)
  doc.close()

  // Wait for images to load before printing
  iframe.contentWindow?.focus()
  setTimeout(() => {
    iframe.contentWindow?.print()
    // Clean up after print dialog closes
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe)
      }
    }, 3000)
  }, 800)
}

export function BarcodePrinter({
  open,
  onOpenChange,
  productCode,
  productName,
  productPrice,
}: BarcodePrinterProps) {
  const [quantity, setQuantity] = useState(10)
  const [isPrinting, setIsPrinting] = useState(false)

  const handlePrint = async () => {
    if (quantity < 1) {
      toast.error("Enter at least 1 label")
      return
    }
    setIsPrinting(true)
    try {
      const barcodeDataURL = await makeBarcodeDataURL("www.safawala.com")

      const name = productName.length > 22
        ? productName.substring(0, 20) + ".."
        : productName

      const mrpLine = productPrice !== undefined
        ? `<div class="mrp">MRP &#8377;${productPrice}/-</div>`
        : ""

      const labelHTML = `
        <div class="label">
          <div class="name">${name}</div>
          <div class="web">www.safawala.com</div>
          ${mrpLine}
          <img class="bc" src="${barcodeDataURL}" alt="barcode" />
          <div class="code">${productCode}</div>
        </div>`

      let rows = ""
      const totalRows = Math.ceil(quantity / 2)
      for (let r = 0; r < totalRows; r++) {
        const a = r * 2
        const b = r * 2 + 1
        rows += `<div class="row">
          ${a < quantity ? labelHTML : '<div class="label"></div>'}
          ${b < quantity ? labelHTML : '<div class="label"></div>'}
        </div>`
      }

      const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Safawala Labels</title>
<style>
  @page {
    size: 100mm 25mm;
    margin: 0;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    width: 100mm;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    color-adjust: exact;
  }
  .row {
    width: 100mm;
    height: 25mm;
    display: flex;
    flex-direction: row;
    page-break-after: always;
    page-break-inside: avoid;
    overflow: hidden;
  }
  .row:last-child { page-break-after: avoid; }
  .label {
    width: 50mm;
    height: 25mm;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 1mm;
    gap: 0.3mm;
    overflow: hidden;
  }
  .name {
    font-family: Arial Black, Arial, sans-serif;
    font-size: 9pt;
    font-weight: 900;
    color: #000 !important;
    text-align: center;
    line-height: 1.1;
    max-width: 48mm;
    word-break: break-word;
  }
  .web {
    font-family: Arial, sans-serif;
    font-size: 6pt;
    font-weight: bold;
    color: #000 !important;
    text-align: center;
  }
  .mrp {
    font-family: Arial, sans-serif;
    font-size: 7pt;
    font-weight: 900;
    color: #000 !important;
    text-align: center;
  }
  .bc {
    width: 46mm;
    height: 9mm;
    display: block;
    object-fit: fill;
    image-rendering: pixelated;
    image-rendering: -webkit-optimize-contrast;
    image-rendering: crisp-edges;
  }
  .code {
    font-family: 'Courier New', monospace;
    font-size: 6.5pt;
    font-weight: bold;
    color: #000 !important;
    text-align: center;
  }
  @media print {
    html, body { width: 100mm; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  }
</style>
</head>
<body>${rows}</body>
</html>`

      printViaIframe(html)
      toast.success(`Printing ${quantity} labels`)
      onOpenChange(false)
    } catch (err) {
      console.error(err)
      toast.error("Print failed — check browser console")
    } finally {
      setIsPrinting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Printer className="w-4 h-4" />
            Print Barcode Labels
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-3 text-sm border">
            <div className="font-bold truncate text-gray-900">{productName}</div>
            <div className="text-gray-500 text-xs mt-0.5">{productCode}</div>
            {productPrice !== undefined && (
              <div className="text-gray-700 text-xs mt-0.5 font-semibold">MRP ₹{productPrice}/-</div>
            )}
          </div>

          <div>
            <Label className="text-xs font-semibold mb-2 block text-gray-700">Quantity</Label>
            <div className="flex gap-1.5 flex-wrap items-center">
              <Input
                type="number"
                min="1"
                max="500"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 h-9 text-sm"
              />
              {[5, 10, 20, 50, 100].map((n) => (
                <Button
                  key={n}
                  size="sm"
                  variant={quantity === n ? "default" : "outline"}
                  className="h-9 px-3 text-xs"
                  onClick={() => setQuantity(n)}
                >
                  {n}
                </Button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              {quantity} labels → {Math.ceil(quantity / 2)} rows · 2 per row
            </p>
          </div>

          <Button
            onClick={handlePrint}
            disabled={isPrinting}
            className="w-full h-10 bg-green-600 hover:bg-green-700 text-white font-semibold"
          >
            <Printer className="w-4 h-4 mr-2" />
            {isPrinting ? "Preparing labels..." : `Print ${quantity} Labels`}
          </Button>

          <p className="text-[10px] text-gray-400 text-center">
            Printer: 100mm × 25mm · Margins: None · Scale: 100%
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
