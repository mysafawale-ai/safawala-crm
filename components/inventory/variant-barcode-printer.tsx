"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Printer } from "lucide-react"
import { toast } from "sonner"

interface VariantBarcodePrinterProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  variantCode: string
  variantName: string
  productName?: string
  productPrice?: number
  priceAdjustment?: number
}

export function VariantBarcodePrinter({
  open,
  onOpenChange,
  variantCode,
  variantName,
  productName,
  productPrice,
  priceAdjustment = 0,
}: VariantBarcodePrinterProps) {
  const [quantity, setQuantity] = useState(10)
  const [isPrinting, setIsPrinting] = useState(false)

  const variantPrice = productPrice ? productPrice + (priceAdjustment || 0) : undefined
  const labelTitle = productName ? `${productName} - ${variantName}` : variantName

  const handlePrint = async () => {
    if (quantity < 1) {
      toast.error("Enter at least 1 label")
      return
    }

    setIsPrinting(true)

    try {
      const JsBarcode = (await import("jsbarcode")).default

      const rows = Math.ceil(quantity / 2)
      let labelsHTML = ""

      for (let row = 0; row < rows; row++) {
        labelsHTML += `<div class="row">`

        for (let col = 0; col < 2; col++) {
          const idx = row * 2 + col
          if (idx < quantity) {
            const canvas = document.createElement("canvas")
            JsBarcode(canvas, variantCode, {
              format: "CODE128",
              width: 3,
              height: 80,
              displayValue: false,
              margin: 4,
              background: "#FFFFFF",
              lineColor: "#000000",
            })
            const barcodeImg = canvas.toDataURL("image/png")

            labelsHTML += `
              <div class="label">
                <div class="variant-name">${variantName}</div>
                <img src="${barcodeImg}" class="barcode" />
                <div class="code">${variantCode}</div>
                ${variantPrice ? `<div class="price">₹${variantPrice.toFixed(2)}</div>` : ""}
              </div>`
          } else {
            labelsHTML += `<div class="label empty"></div>`
          }
        }

        labelsHTML += `</div>`
      }

      const printHTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${variantName} Labels</title>
<style>
  @page {
    size: 100mm 25mm;
    margin: 0;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: Arial, sans-serif;
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
  }
  .row:last-child { page-break-after: avoid; }
  .label {
    width: 50mm;
    height: 25mm;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 1.5mm;
    gap: 0.3mm;
    box-sizing: border-box;
  }
  .label.empty { visibility: hidden; }
  .variant-name {
    font-size: 7pt;
    font-weight: bold;
    color: #000;
    text-align: center;
    max-width: 48mm;
    line-height: 1.1;
    word-break: break-word;
    margin-bottom: 0.5mm;
  }
  .barcode {
    width: 44mm;
    height: 10mm;
    display: block;
    image-rendering: pixelated;
    image-rendering: crisp-edges;
    margin: 0 auto;
  }
  .code {
    font-family: 'Courier New', monospace;
    font-size: 6.5pt;
    font-weight: bold;
    color: #000;
    text-align: center;
    letter-spacing: 0.5px;
    margin-top: 0.3mm;
  }
  .price {
    font-size: 6.5pt;
    font-weight: bold;
    color: #000;
    text-align: center;
    margin-top: 0.2mm;
  }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>${labelsHTML}</body>
</html>`

      const printWindow = window.open("", "_blank")
      if (!printWindow) {
        toast.error("Please allow popups for printing")
        return
      }

      printWindow.document.write(printHTML)
      printWindow.document.close()

      setTimeout(() => {
        printWindow.focus()
        printWindow.print()
      }, 500)

      toast.success(`Printing ${quantity} ${variantName} labels`)
      onOpenChange(false)
    } catch (error) {
      console.error("Print error:", error)
      toast.error("Print failed")
    } finally {
      setIsPrinting(false)
    }
  }

  const rows = Math.ceil(quantity / 2)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <Printer className="w-4 h-4" />
            Print {variantName} Labels
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {productName && (
            <div className="text-sm text-gray-600">
              Product: <span className="font-semibold">{productName}</span>
            </div>
          )}

          <div>
            <Label className="text-xs mb-1 block">Quantity</Label>
            <div className="flex gap-1 flex-wrap">
              <Input
                type="number"
                min="1"
                max="500"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-14 h-8 text-sm"
              />
              {[5, 10, 20, 50, 100].map((n) => (
                <Button
                  key={n}
                  size="sm"
                  variant={quantity === n ? "default" : "outline"}
                  className="h-8 px-2 text-xs"
                  onClick={() => setQuantity(n)}
                >
                  {n}
                </Button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {quantity} labels = {rows} rows (2 per row)
            </p>
          </div>

          {/* Preview */}
          <div>
            <Label className="text-xs mb-1 block">Preview (50mm × 25mm)</Label>
            <div className="border-2 border-dashed border-gray-300 rounded p-3 bg-white">
              <div className="flex gap-2">
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    className="flex-1 border border-gray-400 p-2 bg-gray-50 flex flex-col items-center gap-0.5"
                  >
                    <div className="text-[7px] font-bold text-center leading-tight text-gray-800 max-w-full break-words">
                      {variantName}
                    </div>
                    <div className="bg-black h-4 w-full flex items-center justify-center">
                      <div className="flex gap-px h-3">
                        {Array.from({ length: 28 }).map((_, j) => (
                          <div
                            key={j}
                            className="bg-white"
                            style={{ width: j % 4 === 0 ? "2px" : "1px" }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="text-[6px] font-mono font-bold text-gray-900">{variantCode}</div>
                    {variantPrice && (
                      <div className="text-[6px] font-bold text-gray-900">₹{variantPrice.toFixed(0)}</div>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-center text-[10px] text-gray-400 mt-2">← 100mm (50mm × 2) →</p>
            </div>
          </div>

          <Button
            onClick={handlePrint}
            disabled={isPrinting}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            <Printer className="w-4 h-4 mr-2" />
            {isPrinting ? "Printing..." : `Print ${quantity} Labels (${rows} Rows)`}
          </Button>

          <p className="text-[10px] text-gray-400 text-center">
            Set printer paper: 100mm × 25mm · Margins: None · Scale: 100%
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
