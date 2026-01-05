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
import { Printer, Download } from "lucide-react"
import { toast } from "sonner"
import { generateZPL, downloadZPL } from "@/lib/zebra-zpl-service"

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
    
    // Create barcodes array
    const barcodes = Array.from({ length: quantity }, () => ({
      code: productCode,
      productName: productName,
    }))

    // Download ZPL file
    downloadZPL({
      barcodes,
      labelWidthMM: 50,
      labelHeightMM: 25,
      columns: 2,
    }, `labels_${productCode}_${Date.now()}.zpl`)

    toast.success(`Downloaded ${quantity} labels. Send to printer with: lp -d Zebra_Technologies_ZTC_ZD230_203dpi_ZPL ~/Downloads/labels_*.zpl`)
    setIsPrinting(false)
  }

  const rows = Math.ceil(quantity / 2)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Printer className="w-4 h-4" />
            Print Labels
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Product Info */}
          <div className="bg-gray-50 p-3 rounded-lg text-sm">
            <div className="font-mono font-bold">{productCode}</div>
            <div className="text-gray-600 text-xs truncate">{productName}</div>
          </div>

          {/* Quantity */}
          <div>
            <Label className="text-sm mb-2 block">Quantity</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                min="1"
                max="500"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 h-9"
              />
              <div className="flex gap-1 flex-wrap">
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
            </div>
          </div>

          {/* Info */}
          <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
            <div>📦 {quantity} labels × 2 columns = {rows} rows</div>
            <div>📏 Label: 50mm × 25mm (Zebra ZD230)</div>
          </div>

          {/* Print Button */}
          <Button
            onClick={handlePrint}
            disabled={isPrinting || quantity < 1}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Download ZPL ({quantity} Labels)
          </Button>

          {/* Terminal Command */}
          <div className="text-xs bg-gray-900 text-green-400 p-2 rounded font-mono">
            lp -d Zebra_Technologies_ZTC_ZD230_203dpi_ZPL ~/Downloads/labels_*.zpl
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
