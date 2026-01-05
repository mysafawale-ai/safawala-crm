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
      // Generate barcode images
      const JsBarcode = (await import("jsbarcode")).default
      
      // Create barcodes HTML
      const rows = Math.ceil(quantity / 2)
      let labelsHTML = ""
      
      for (let row = 0; row < rows; row++) {
        labelsHTML += `<div class="row">`
        
        for (let col = 0; col < 2; col++) {
          const idx = row * 2 + col
          if (idx < quantity) {
            // Create canvas for barcode
            const canvas = document.createElement("canvas")
            JsBarcode(canvas, productCode, {
              format: "CODE128",
              width: 2,
              height: 50,
              displayValue: false,
              margin: 0,
            })
            const barcodeImg = canvas.toDataURL("image/png")
            
            const displayName = productName.length > 18 
              ? productName.substring(0, 16) + ".." 
              : productName
            
            labelsHTML += `
              <div class="label">
                <img src="${barcodeImg}" class="barcode" />
                <div class="code">${productCode}</div>
                <div class="name">${displayName}</div>
              </div>
            `
          }
        }
        
        labelsHTML += `</div>`
      }

      // Create print HTML
      const printHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Labels - ${productCode}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    @page {
      size: 100mm 25mm;
      margin: 0;
    }
    
    @media print {
      html, body {
        width: 100mm;
        margin: 0;
        padding: 0;
      }
      .row {
        page-break-after: always;
      }
    }
    
    body {
      font-family: Arial, sans-serif;
      background: white;
    }
    
    .row {
      width: 100mm;
      height: 25mm;
      display: flex;
      flex-direction: row;
    }
    
    .label {
      width: 50mm;
      height: 25mm;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 1mm;
      box-sizing: border-box;
    }
    
    .barcode {
      width: 40mm;
      height: 12mm;
      object-fit: contain;
    }
    
    .code {
      font-family: monospace;
      font-size: 9pt;
      font-weight: bold;
      margin-top: 1mm;
    }
    
    .name {
      font-size: 7pt;
      color: #333;
      text-align: center;
    }
  </style>
</head>
<body>
  ${labelsHTML}
</body>
</html>
`

      // Open print window
      const printWindow = window.open("", "_blank")
      if (!printWindow) {
        throw new Error("Popup blocked")
      }

      printWindow.document.write(printHTML)
      printWindow.document.close()

      // Wait and print
      setTimeout(() => {
        printWindow.print()
      }, 300)

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
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <Printer className="w-4 h-4" />
            Print Labels
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Product Info */}
          <div className="bg-gray-50 p-3 rounded text-sm">
            <div className="font-mono font-bold">{productCode}</div>
            <div className="text-gray-600 text-xs truncate">{productName}</div>
          </div>

          {/* Quantity */}
          <div>
            <Label className="text-sm mb-2 block">Quantity</Label>
            <div className="flex gap-2 flex-wrap">
              <Input
                type="number"
                min="1"
                max="200"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 h-8 text-sm"
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
          </div>

          {/* Info */}
          <div className="text-xs text-gray-500">
            {quantity} labels = {rows} rows (2 per row)
          </div>

          {/* Print Button */}
          <Button
            onClick={handlePrint}
            disabled={isPrinting || quantity < 1}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <Printer className="w-4 h-4 mr-2" />
            {isPrinting ? "Printing..." : `Print ${quantity} Labels`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
