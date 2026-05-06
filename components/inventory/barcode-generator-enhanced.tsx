"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Printer, Download, Loader2, RefreshCw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"

interface Product {
  id: string
  name: string
  barcode?: string
}

interface BarcodeGeneratorEnhancedProps {
  product: Product
  onBarcodeGenerated?: () => void
}

export function BarcodeGenerator({ product, onBarcodeGenerated }: BarcodeGeneratorEnhancedProps) {
  const [quantity, setQuantity] = useState(1)
  const [printing, setPrinting] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [currentBarcode, setCurrentBarcode] = useState(product.barcode || "")

  const generateNewBarcode = async () => {
    setGenerating(true)
    try {
      // Call barcode generation API
      const response = await fetch("/api/products/generate-barcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      })

      if (!response.ok) throw new Error("Failed to generate barcode")

      const { barcode } = await response.json()
      setCurrentBarcode(barcode)

      // Update product barcode in DB
      await supabase
        .from("products")
        .update({ barcode })
        .eq("id", product.id)

      toast.success("Barcode generated successfully")
      onBarcodeGenerated?.()
    } catch (error) {
      console.error("Barcode generation failed:", error)
      toast.error("Failed to generate barcode")
    } finally {
      setGenerating(false)
    }
  }

  const handlePrint = async () => {
    if (!currentBarcode) {
      toast.error("Generate a barcode first")
      return
    }

    if (quantity < 1) {
      toast.error("Enter at least 1 label")
      return
    }

    setPrinting(true)

    try {
      const JsBarcode = (await import("jsbarcode")).default

      // For thermal printer: single label is 50mm × 25mm
      // So we fit 2 labels per 100mm width
      const labelsPerRow = 2
      const rows = Math.ceil(quantity / labelsPerRow)
      let labelsHTML = ""

      for (let row = 0; row < rows; row++) {
        labelsHTML += `<div class="row">`

        for (let col = 0; col < labelsPerRow; col++) {
          const idx = row * labelsPerRow + col
          if (idx < quantity) {
            const canvas = document.createElement("canvas")
            JsBarcode(canvas, currentBarcode, {
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
                <div class="name">${product.name.substring(0, 16)}</div>
                <img src="${barcodeImg}" class="barcode" />
                <div class="code">${currentBarcode}</div>
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
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Barcode Labels</title>
<style>
  @page {
    size: 100mm 25mm;
    margin: 0;
    padding: 0;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    width: 100mm;
    height: 25mm;
    margin: 0;
    padding: 0;
  }
  body {
    font-family: 'Courier New', monospace;
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
    padding: 1mm;
    gap: 0.3mm;
    border: 0.5mm solid #ddd;
  }
  .label.empty { visibility: hidden; }
  .name {
    font-size: 6pt;
    font-weight: bold;
    color: #000;
    text-align: center;
    max-width: 48mm;
    line-height: 1.1;
    word-break: break-word;
    height: 6mm;
    overflow: hidden;
  }
  .barcode {
    width: 42mm;
    height: 10mm;
    display: block;
    image-rendering: pixelated;
    image-rendering: crisp-edges;
  }
  .code {
    font-family: 'Courier New', monospace;
    font-size: 6pt;
    font-weight: bold;
    color: #000;
    text-align: center;
    letter-spacing: 0.3px;
    height: 4mm;
    line-height: 1;
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

      // Wait for rendering before printing
      setTimeout(() => {
        printWindow.focus()
        printWindow.print()
      }, 500)

      toast.success(`Sent ${quantity} labels to printer`)
    } catch (error) {
      console.error("Print error:", error)
      toast.error("Print failed")
    } finally {
      setPrinting(false)
    }
  }

  const handleDownloadPDF = async () => {
    // TODO: Implement PDF export using jsPDF
    toast.info("PDF download coming soon")
  }

  return (
    <div className="space-y-4">
      {/* Barcode Status */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Barcode</h4>
            {currentBarcode && (
              <code className="text-xs font-mono bg-blue-100 px-2 py-1 rounded text-blue-700">
                {currentBarcode}
              </code>
            )}
          </div>
          {!currentBarcode && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No barcode assigned yet. Generate one below.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      {/* Generate Barcode */}
      {!currentBarcode && (
        <Button
          onClick={generateNewBarcode}
          disabled={generating}
          className="w-full"
        >
          {generating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {generating ? "Generating..." : "Generate Barcode"}
        </Button>
      )}

      {currentBarcode && (
        <>
          {/* Barcode Preview */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <p className="text-xs text-muted-foreground mb-3">Preview (50mm × 25mm)</p>
            <div className="bg-white border-2 border-gray-400 rounded p-2 inline-block">
              <div className="flex flex-col items-center gap-1" style={{ width: "200px" }}>
                <div className="text-[10px] font-bold text-center leading-tight max-w-[95%] truncate">
                  {product.name.substring(0, 20)}
                </div>
                <div className="bg-black h-6 w-full flex items-center justify-center">
                  <div className="flex gap-px h-5">
                    {Array.from({ length: 28 }).map((_, j) => (
                      <div
                        key={j}
                        className="bg-white"
                        style={{ width: j % 4 === 0 ? "2px" : "1px" }}
                      />
                    ))}
                  </div>
                </div>
                <div className="text-[9px] font-mono font-bold">{currentBarcode}</div>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 mt-2">Scale: 1:1 on 100mm × 25mm paper</p>
          </div>

          {/* Print Settings */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="print-quantity" className="text-sm">Number of Labels</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="print-quantity"
                  type="number"
                  min="1"
                  max="100"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20"
                />
                <div className="flex gap-1">
                  {[1, 5, 10, 20, 50].map((n) => (
                    <Button
                      key={n}
                      size="sm"
                      variant={quantity === n ? "default" : "outline"}
                      className="px-2 h-9"
                      onClick={() => setQuantity(n)}
                    >
                      {n}
                    </Button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.ceil(quantity / 2)} rows (2 labels per row × 50mm)
              </p>
            </div>

            {/* Printer Instructions */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <h4 className="font-semibold text-xs text-amber-900 mb-2">Thermal Printer Setup</h4>
              <ul className="text-xs text-amber-800 space-y-1">
                <li>• Paper Size: 100mm × 25mm</li>
                <li>• Margins: None (0mm)</li>
                <li>• Scale: 100% (no scaling)</li>
                <li>• Color: Grayscale or Color (print-color-adjust: exact)</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handlePrint}
                disabled={printing || !currentBarcode}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Printer className="w-4 h-4 mr-2" />
                {printing ? "Printing..." : "Print Labels"}
              </Button>
              <Button
                onClick={handleDownloadPDF}
                disabled={!currentBarcode}
                variant="outline"
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>

            {/* Regenerate Option */}
            <Button
              onClick={generateNewBarcode}
              disabled={generating}
              variant="outline"
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {generating ? "Generating..." : "Generate New Barcode"}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
