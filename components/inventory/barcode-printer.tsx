"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
}

export function BarcodePrinter({
  open,
  onOpenChange,
  productCode,
  productName,
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
      const JsBarcode = (await import("jsbarcode")).default
      
      const rows = Math.ceil(quantity / 2)
      let labelsHTML = ""
      
      for (let row = 0; row < rows; row++) {
        labelsHTML += `<div class="row">`
        
        for (let col = 0; col < 2; col++) {
          const idx = row * 2 + col
          if (idx < quantity) {
            const canvas = document.createElement("canvas")
            JsBarcode(canvas, productCode, {
              format: "CODE128",
              width: 2,
              height: 50,
              displayValue: false,
              margin: 0,
            })
            const barcodeImg = canvas.toDataURL("image/png")
            
            labelsHTML += `
              <div class="label">
                <img src="${barcodeImg}" class="barcode" />
                <div class="code">${productCode}</div>
                <div class="name">${productName}</div>
              </div>
            `
          } else {
            labelsHTML += `<div class="label empty"></div>`
          }
        }
        
        labelsHTML += `</div>`
      }

      const printHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Labels</title>
  <style>
    @page {
      size: 100mm 25mm landscape;
      margin: 0;
    }
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      width: 100mm;
    }
    
    .row {
      width: 100mm;
      height: 25mm;
      display: flex;
      page-break-after: always;
    }
    
    .row:last-child {
      page-break-after: avoid;
    }
    
    .label {
      width: 50mm;
      height: 25mm;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 1mm;
    }
    
    .label.empty {
      visibility: hidden;
    }
    
    .barcode {
      width: 42mm;
      height: 10mm;
    }
    
    .code {
      font-family: monospace;
      font-size: 8pt;
      font-weight: bold;
      margin-top: 0.5mm;
    }
    
    .name {
      font-size: 6pt;
      color: #333;
      text-align: center;
      max-width: 48mm;
      line-height: 1.2;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    
    @media print {
      body { -webkit-print-color-adjust: exact; }
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

      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.focus()
          printWindow.print()
        }, 200)
      }

      toast.success(`Printing ${quantity} labels`)
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
            Print Labels
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Quantity */}
          <div>
            <Label className="text-xs mb-1 block">Quantity</Label>
            <div className="flex gap-1 flex-wrap">
              <Input
                type="number"
                min="1"
                max="200"
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
            <div className="text-xs text-gray-500 mt-1">
              {quantity} labels = {rows} rows (2 per row)
            </div>
          </div>

          {/* Preview */}
          <div>
            <Label className="text-xs mb-1 block">Preview (1 Row = 2 Labels)</Label>
            <div className="border-2 border-dashed border-gray-300 rounded p-3 bg-white">
              <div className="flex gap-2">
                {/* Left Label */}
                <div className="flex-1 border border-gray-400 p-2 bg-gray-50 flex flex-col items-center">
                  <div className="bg-black h-6 w-full flex items-center justify-center mb-1">
                    <div className="flex gap-px">
                      {Array.from({ length: 30 }).map((_, i) => (
                        <div key={i} className="w-0.5 h-4 bg-white" style={{ width: i % 3 === 0 ? '2px' : '1px' }} />
                      ))}
                    </div>
                  </div>
                  <div className="text-[10px] font-mono font-bold">{productCode}</div>
                  <div className="text-[8px] text-gray-600 text-center leading-tight max-w-full">{productName}</div>
                </div>
                {/* Right Label */}
                <div className="flex-1 border border-gray-400 p-2 bg-gray-50 flex flex-col items-center">
                  <div className="bg-black h-6 w-full flex items-center justify-center mb-1">
                    <div className="flex gap-px">
                      {Array.from({ length: 30 }).map((_, i) => (
                        <div key={i} className="w-0.5 h-4 bg-white" style={{ width: i % 3 === 0 ? '2px' : '1px' }} />
                      ))}
                    </div>
                  </div>
                  <div className="text-[10px] font-mono font-bold">{productCode}</div>
                  <div className="text-[8px] text-gray-600 text-center leading-tight max-w-full">{productName}</div>
                </div>
              </div>
              <div className="text-center text-[10px] text-gray-400 mt-2">
                ← 100mm (50mm × 2) →
              </div>
            </div>
          </div>

          <Button
            onClick={handlePrint}
            disabled={isPrinting}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <Printer className="w-4 h-4 mr-2" />
            {isPrinting ? "Printing..." : `Print ${quantity} Labels (${rows} Rows)`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
