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
      size: 100mm 25mm;
      margin: 0;
    }
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
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
      height: 12mm;
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <Printer className="w-4 h-4" />
            Print Labels
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="bg-gray-100 p-2 rounded text-sm">
            <div className="font-mono font-bold">{productCode}</div>
            <div className="text-gray-500 text-xs truncate">{productName}</div>
          </div>

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
          </div>

          <Button
            onClick={handlePrint}
            disabled={isPrinting}
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
