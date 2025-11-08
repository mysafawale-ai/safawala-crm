"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Printer, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { printBarcodes, getBarcodesPerPage } from "@/lib/barcode-print-service"

interface BarcodeItem {
  id: string
  code: string
  productName: string
}

interface BarcodePrinterProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productCode: string
  productName: string
}

export function BarcodePrinter({ open, onOpenChange, productCode, productName }: BarcodePrinterProps) {
  const [barcodes, setBarcodes] = useState<BarcodeItem[]>([
    { id: "1", code: productCode, productName: productName },
  ])
  const [columns, setColumns] = useState(2)  // Fixed to 2 columns for 50mm × 25mm labels

  const addBarcode = () => {
    const newBarcode: BarcodeItem = {
      id: Date.now().toString(),
      code: productCode,
      productName: productName,
    }
    setBarcodes([...barcodes, newBarcode])
  }

  const removeBarcode = (id: string) => {
    setBarcodes(barcodes.filter((b) => b.id !== id))
  }

  const updateBarcode = (id: string, field: "code" | "productName", value: string) => {
    setBarcodes(
      barcodes.map((b) =>
        b.id === id ? { ...b, [field]: value } : b
      )
    )
  }

  const handlePrint = async () => {
    if (barcodes.length === 0) {
      toast.error("Add at least one barcode")
      return
    }

    try {
      await printBarcodes({
        barcodes,
        columns: 2,  // Fixed 2-column layout
        leftMargin: 1,
        rightMargin: 1,
        topMargin: 1,
      })

      toast.success(`Printing ${barcodes.length} barcodes (${Math.ceil(barcodes.length / 20)} page${Math.ceil(barcodes.length / 20) > 1 ? 's' : ''})`)
    } catch (error) {
      console.error("Print error:", error)
      toast.error("Failed to print barcodes")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Print Barcodes</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Layout Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Layout Settings</CardTitle>
              <CardDescription className="text-xs">Optimized for 50mm × 25mm label sheets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  <strong>2-Column Fixed Layout</strong>
                </p>
                <p className="text-xs text-muted-foreground">
                  • 2 columns per row<br/>
                  • 50mm × 25mm per barcode<br/>
                  • 10 rows per page = 20 barcodes/page<br/>
                  • 40 products = 2 pages
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Barcode Items */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Barcodes ({barcodes.length})</CardTitle>
                  <CardDescription className="text-xs">50mm × 25mm labels, 2 columns, 20 per page</CardDescription>
                </div>
                <Button size="sm" onClick={addBarcode} className="h-8">
                  <Plus className="w-3 h-3 mr-1" />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 max-h-80 overflow-y-auto">
              {barcodes.map((barcode, index) => (
                <div key={barcode.id} className="flex gap-2 items-end pb-2 border-b">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Barcode Code</Label>
                    <Input
                      value={barcode.code}
                      onChange={(e) => updateBarcode(barcode.id, "code", e.target.value)}
                      placeholder="Barcode code"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Product Name</Label>
                    <Input
                      value={barcode.productName}
                      onChange={(e) => updateBarcode(barcode.id, "productName", e.target.value)}
                      placeholder="Product name"
                      className="h-8 text-xs"
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => removeBarcode(barcode.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Layout Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <div className="p-3 bg-gray-50 rounded border space-y-2">
                <p><strong>Paper:</strong> A4 (210mm × 297mm)</p>
                <p><strong>Barcode Size:</strong> 50mm × 25mm</p>
                <p><strong>Margins:</strong> 10mm from all sides</p>
                <p><strong>Vertical Gap:</strong> 2mm between rows</p>
                <p><strong>Columns:</strong> 2 (fixed)</p>
                <p><strong>Rows per Page:</strong> 10</p>
                <p><strong>Barcodes per Page:</strong> 20 (10 rows × 2 columns)</p>
                <p><strong>Total Barcodes:</strong> {barcodes.length}</p>
                <p><strong>Pages Needed:</strong> {Math.ceil(barcodes.length / 20)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Print Button */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
              <Printer className="w-4 h-4 mr-2" />
              Print Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
