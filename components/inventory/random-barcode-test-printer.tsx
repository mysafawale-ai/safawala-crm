"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { generateBarcode } from "@/lib/barcode-generator"
import { Printer } from "lucide-react"

interface RandomBarcodePrinterProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RandomBarcodePrinter({ open, onOpenChange }: RandomBarcodePrinterProps) {
  const [quantity, setQuantity] = useState(10)

  // Generate random barcode
  const generateRandomBarcode = () => {
    return 'RAND' + Math.random().toString(36).substring(2, 11).toUpperCase()
  }

  const handlePrintRandomBarcodes = () => {
    if (quantity < 1) {
      toast({
        title: "Error",
        description: "Please enter a quantity of at least 1",
        variant: "destructive",
      })
      return
    }

    try {
      const printWindow = window.open("", "_blank")
      if (printWindow) {
        // Generate random barcodes - 2 columns, compact attached layout
        let barcodeHTML = ""

        for (let i = 0; i < quantity; i += 2) {
          const randomBarcode1 = generateRandomBarcode()
          const randomBarcode2 = i + 1 < quantity ? generateRandomBarcode() : null
          const productName1 = `Product ${i + 1}`
          const productName2 = i + 1 < quantity ? `Product ${i + 2}` : null
          const barcodeImage1 = generateBarcode(randomBarcode1)
          const barcodeImage2 = randomBarcode2 ? generateBarcode(randomBarcode2) : null

          // Row with 2 columns, no gaps, attached together
          barcodeHTML += `
            <div class="barcode-row" style="display: flex; margin: 0; padding: 0; border-bottom: 2px solid #333; height: 140px;">
              <div class="barcode-column" style="flex: 1; border-right: 2px solid #333; padding: 12px 10px; text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                <img src="${barcodeImage1}" alt="Barcode ${i + 1}" style="width: 90%; height: auto; max-height: 50%; display: block; margin-bottom: 6px;" />
                <div style="font-family: 'Courier New', monospace; font-size: 10px; font-weight: 700; margin: 0; line-height: 1;">
                  ${randomBarcode1}
                </div>
                <div style="font-family: Arial, sans-serif; font-size: 7px; color: #333; margin-top: 2px; line-height: 1;">
                  ${productName1}
                </div>
              </div>
              ${randomBarcode2 ? `
              <div class="barcode-column" style="flex: 1; padding: 12px 10px; text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                <img src="${barcodeImage2}" alt="Barcode ${i + 2}" style="width: 90%; height: auto; max-height: 50%; display: block; margin-bottom: 6px;" />
                <div style="font-family: 'Courier New', monospace; font-size: 10px; font-weight: 700; margin: 0; line-height: 1;">
                  ${randomBarcode2}
                </div>
                <div style="font-family: Arial, sans-serif; font-size: 7px; color: #333; margin-top: 2px; line-height: 1;">
                  ${productName2}
                </div>
              </div>
              ` : `
              <div class="barcode-column" style="flex: 1; padding: 12px 10px;"></div>
              `}
            </div>
          `
        }

        printWindow.document.write(`
        <html>
          <head>
            <title>Random Barcode Test Print - 2 Column</title>
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
                size: A4;
              }
              
              body {
                font-family: Arial, sans-serif;
                background: white;
                margin: 0;
                padding: 0;
              }

              .barcode-row {
                display: flex;
                margin: 0;
                padding: 0;
                border-bottom: 2px solid #333;
                height: 140px;
                page-break-inside: avoid;
              }

              .barcode-column {
                flex: 1;
                padding: 12px 10px;
                text-align: center;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                border-right: 2px solid #333;
              }

              .barcode-column:last-child {
                border-right: none;
              }

              .barcode-image {
                width: 90%;
                height: auto;
                max-height: 50%;
                display: block;
                margin-bottom: 6px;
              }

              .barcode-code {
                font-family: 'Courier New', monospace;
                font-size: 10px;
                font-weight: 700;
                margin: 0;
                line-height: 1;
              }

              .barcode-name {
                font-family: Arial, sans-serif;
                font-size: 7px;
                color: #333;
                margin-top: 2px;
                line-height: 1;
              }

              @media print {
                html, body {
                  margin: 0;
                  padding: 0;
                }
                
                body {
                  margin: 0;
                  padding: 0;
                }
                
                .barcode-row {
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
        description: `Generated ${quantity} random barcodes in 2-column layout`,
      })
      onOpenChange(false)
      setQuantity(10)
    } catch (error) {
      console.error("Error printing random barcodes:", error)
      toast({
        title: "Error",
        description: "Failed to print random barcodes",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Random Barcode Test Printer</DialogTitle>
          <DialogDescription>
            Generate and print random barcodes for testing layout and alignment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max="1000"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Button
              onClick={handlePrintRandomBarcodes}
              className="w-full"
              size="lg"
            >
              <Printer className="mr-2 h-4 w-4" />
              Print Random Barcodes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
