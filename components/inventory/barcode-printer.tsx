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
import { Printer, Copy, Check } from "lucide-react"
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
  const [copied, setCopied] = useState(false)

  const handlePrint = () => {
    if (quantity < 1) {
      toast.error("Enter at least 1 label")
      return
    }

    const barcodes = Array.from({ length: quantity }, () => ({
      code: productCode,
      productName: productName,
    }))

    downloadZPL({
      barcodes,
      labelWidthMM: 50,
      labelHeightMM: 25,
      columns: 2,
    }, `labels_${productCode}.zpl`)

    toast.success("ZPL downloaded! Run the command below to print.")
  }

  const terminalCmd = `lp -d Zebra_Technologies_ZTC_ZD230_203dpi_ZPL ~/Downloads/labels_${productCode}.zpl`

  const copyCommand = async () => {
    await navigator.clipboard.writeText(terminalCmd)
    setCopied(true)
    toast.success("Command copied!")
    setTimeout(() => setCopied(false), 2000)
  }

  const rows = Math.ceil(quantity / 2)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <Printer className="w-4 h-4" />
            Zebra ZD230 Print
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Product Info */}
          <div className="bg-gray-100 p-2 rounded text-sm">
            <div className="font-mono font-bold">{productCode}</div>
            <div className="text-gray-600 text-xs truncate">{productName}</div>
          </div>

          {/* Quantity */}
          <div>
            <Label className="text-xs mb-1 block">Labels</Label>
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
              {quantity} labels = {rows} rows
            </div>
          </div>

          {/* Download Button */}
          <Button
            onClick={handlePrint}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <Printer className="w-4 h-4 mr-2" />
            Download ZPL
          </Button>

          {/* Terminal Command */}
          <div className="space-y-1">
            <Label className="text-xs">Then run in Terminal:</Label>
            <div 
              className="bg-gray-900 text-green-400 p-2 rounded text-xs font-mono cursor-pointer flex items-center gap-2"
              onClick={copyCommand}
            >
              <code className="flex-1 break-all">{terminalCmd}</code>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4 opacity-50" />}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
