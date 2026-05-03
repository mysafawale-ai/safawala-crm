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

// Generate barcode as inline SVG string using JsBarcode
async function makeSVGBarcode(value: string): Promise<string> {
  const JsBarcode = (await import("jsbarcode")).default
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
  JsBarcode(svg, value, {
    format: "CODE128",
    width: 3,
    height: 72,
    displayValue: false,
    margin: 0,
    background: "#FFFFFF",
    lineColor: "#000000",
  })
  return svg.outerHTML
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
      // SVG barcode — vector, prints sharp at any DPI
      const barcodeSVG = await makeSVGBarcode("www.safawala.com")

      const name = productName.length > 24
        ? productName.substring(0, 22) + ".."
        : productName

      const mrpLine = productPrice !== undefined
        ? `<div class="mrp">MRP &#8377;${productPrice}/-</div>`
        : ""

      const labelHTML = `
        <div class="label">
          <div class="name">${name}</div>
          <div class="web">www.safawala.com</div>
          ${mrpLine}
          <div class="bc">${barcodeSVG}</div>
          <div class="code">${productCode}</div>
        </div>`

      const emptyLabel = `<div class="label"></div>`

      let rows = ""
      const totalRows = Math.ceil(quantity / 2)
      for (let r = 0; r < totalRows; r++) {
        const a = r * 2
        const b = r * 2 + 1
        rows += `<div class="row">
          ${a < quantity ? labelHTML : emptyLabel}
          ${b < quantity ? labelHTML : emptyLabel}
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
  }
  .row {
    width: 100mm;
    height: 25mm;
    display: flex;
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
    padding: 1mm 1mm;
    gap: 0.4mm;
    overflow: hidden;
  }
  .name {
    font-family: Arial Black, Arial, sans-serif;
    font-size: 9pt;
    font-weight: 900;
    color: #000;
    text-align: center;
    line-height: 1.1;
    max-width: 48mm;
    word-break: break-word;
  }
  .web {
    font-family: Arial, sans-serif;
    font-size: 6.5pt;
    font-weight: bold;
    color: #000;
    text-align: center;
  }
  .mrp {
    font-family: Arial, sans-serif;
    font-size: 7.5pt;
    font-weight: 900;
    color: #000;
    text-align: center;
  }
  .bc {
    width: 46mm;
    height: 9.5mm;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  .bc svg {
    width: 46mm !important;
    height: 9.5mm !important;
    display: block;
  }
  .code {
    font-family: 'Courier New', monospace;
    font-size: 7pt;
    font-weight: bold;
    color: #000;
    text-align: center;
    letter-spacing: 0.2px;
  }
</style>
</head>
<body>${rows}</body>
</html>`

      const win = window.open("", "_blank", "width=500,height=400")
      if (!win) { toast.error("Allow popups to print"); return }
      win.document.write(html)
      win.document.close()
      win.onload = () => setTimeout(() => { win.focus(); win.print() }, 250)

      toast.success(`Printing ${quantity} labels`)
      onOpenChange(false)
    } catch (err) {
      console.error(err)
      toast.error("Print failed")
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
              {quantity} labels → {Math.ceil(quantity / 2)} rows (2 labels per row)
            </p>
          </div>

          <Button
            onClick={handlePrint}
            disabled={isPrinting}
            className="w-full h-10 bg-green-600 hover:bg-green-700 text-white font-semibold"
          >
            <Printer className="w-4 h-4 mr-2" />
            {isPrinting ? "Opening print dialog..." : `Print ${quantity} Labels`}
          </Button>

          <div className="text-[10px] text-gray-400 text-center leading-relaxed">
            Printer settings: Paper 100mm × 25mm · Margins: None · Scale: 100%
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
