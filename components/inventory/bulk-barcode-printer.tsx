"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { generateBarcode } from "@/lib/barcode-generator"
import { Printer } from "lucide-react"

interface BulkBarcodePrinterProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: {
    id: string
    name: string
    barcode: string
  }
}

export function BulkBarcodePrinter({ open, onOpenChange, product }: BulkBarcodePrinterProps) {
  const [quantity, setQuantity] = useState(20)

  const handlePrintMultipleBarcodes = () => {
    if (quantity < 1) {
      toast({
        title: "Error",
        description: "Please enter a quantity of at least 1",
        variant: "destructive",
      })
      return
    }

    try {
      const barcodeToUse = generateBarcode(product.barcode)

      const printWindow = window.open("", "_blank")
      if (printWindow) {
        // Generate barcodes in 2 columns layout
        let barcodeHTML = ""
        let itemsInRow = 0

        for (let i = 0; i < quantity; i++) {
          // Start new row
          if (itemsInRow === 0) {
            if (i > 0) barcodeHTML += "</div>"
            barcodeHTML += '<div class="barcode-row">'
          }

          barcodeHTML += `
            <div class="barcode-item">
              <div class="barcode-wrapper">
                <img src="${barcodeToUse}" alt="Barcode ${i + 1}" class="barcode-image" />
                <div class="barcode-text-overlay">
                  <div class="barcode-code">${product.barcode}</div>
                  <div class="barcode-name">${product.name}</div>
                </div>
              </div>
            </div>
          `

          itemsInRow++
          if (itemsInRow === 2) {
            barcodeHTML += "</div>"
            itemsInRow = 0
          }
        }

        // Close last row if it's incomplete
        if (itemsInRow > 0) {
          barcodeHTML += "</div>"
        }

        printWindow.document.write(`
        <html>
          <head>
            <title>Print Barcodes - ${product.name}</title>
            <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap" rel="stylesheet">
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              
              html, body {
                margin: 0;
                padding: 0;
                width: 100%;
                height: 100%;
              }
              
              @page {
                margin: 0;
                padding: 0;
                size: auto;
              }
              
              body {
                font-family: Arial, sans-serif;
                background: white;
                padding: 0;
              }

              .barcode-row {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 0;
                margin: 0;
                padding: 0;
                page-break-inside: avoid;
              }

              .barcode-item {
                border: 1px solid #ddd;
                padding: 0;
                text-align: center;
                background: white;
                break-inside: avoid;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                width: 2.99in;
                height: 1.495in;
              }

              .barcode-wrapper {
                position: relative;
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 2mm;
              }

              .barcode-image {
                width: 85%;
                height: auto;
                max-height: 55%;
                display: block;
              }

              .barcode-text-overlay {
                width: 100%;
                margin-top: 1mm;
              }

              .barcode-code {
                font-family: 'Cinzel', serif;
                font-size: 17.8px;
                font-weight: 700;
                margin: 0;
                word-break: break-all;
                line-height: 1;
              }

              .barcode-name {
                font-family: 'Cinzel', serif;
                font-size: 15.25px;
                color: #333;
                line-height: 1;
                word-break: break-word;
                margin: 0.5mm 0 0 0;
              }

              @media print {
                html, body {
                  margin: 0;
                  padding: 0;
                  width: 100%;
                }
                
                body {
                  margin: 0;
                  padding: 0;
                }
                
                .barcode-row {
                  margin: 0;
                  padding: 0;
                  page-break-inside: avoid;
                }
                
                .barcode-item {
                  page-break-inside: avoid;
                }
              }
            </style>
          </head>
          <body>
            ${barcodeHTML}
          </body>
        </html>
      `)
        printWindow.document.close()
        
        // Small delay to ensure rendering before print
        setTimeout(() => {
          printWindow.print()
          printWindow.close()
        }, 500)
      }

      toast({
        title: "Success",
        description: `${quantity} barcode(s) sent to printer`,
      })
      onOpenChange(false)
      setQuantity(20)
    } catch (error) {
      console.error("Error printing barcodes:", error)
      toast({
        title: "Error",
        description: "Failed to print barcodes",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Print Multiple Barcodes</DialogTitle>
          <DialogDescription>
            Generate and print multiple copies of the barcode for {product.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="quantity">Number of Barcodes</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max="200"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="mt-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              Layout: 2 columns (2" × 1" barcodes)
            </p>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Preview:</strong> {Math.ceil(quantity / 2)} row(s) × 2 columns
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handlePrintMultipleBarcodes} className="gap-2">
              <Printer className="h-4 w-4" />
              Print {quantity} Barcode{quantity !== 1 ? "s" : ""}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
