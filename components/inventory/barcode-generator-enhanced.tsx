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
  regular_price?: number
  price?: number
  color?: string
  size?: string
  material?: string
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
      const response = await fetch("/api/products/generate-barcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      })
      if (!response.ok) throw new Error("Failed to generate barcode")
      const { barcode } = await response.json()
      setCurrentBarcode(barcode)
      await supabase.from("products").update({ barcode }).eq("id", product.id)
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
    if (!currentBarcode) { toast.error("Generate a barcode first"); return }
    if (quantity < 1) { toast.error("Enter at least 1 label"); return }
    setPrinting(true)
    try {
      const JsBarcode = (await import("jsbarcode")).default
      const labelsPerRow = 2
      const rows = Math.ceil(quantity / labelsPerRow)
      let labelsHTML = ""

      const metaParts = [product.color, product.size, product.material].filter(Boolean)
      const metaLine = metaParts.join(" | ")
      const savings = product.regular_price && product.price && product.regular_price > product.price
        ? product.regular_price - product.price : 0

      for (let row = 0; row < rows; row++) {
        labelsHTML += `<div class="row">`
        for (let col = 0; col < labelsPerRow; col++) {
          const idx = row * labelsPerRow + col
          if (idx < quantity) {
            const canvas = document.createElement("canvas")
            JsBarcode(canvas, currentBarcode, {
              format: "CODE128", width: 3, height: 80,
              displayValue: false, margin: 4,
              background: "#FFFFFF", lineColor: "#000000",
            })
            const barcodeImg = canvas.toDataURL("image/png")
            labelsHTML += `
              <div class="label">
                <div class="name">${product.name.substring(0, 22)}</div>
                ${metaLine ? `<div class="meta">${metaLine}</div>` : ""}
                ${(product.regular_price || product.price) ? `<div class="pricing-row">
                  ${product.regular_price ? `MRP: <span class="mrp-price">&#8377;${product.regular_price}</span>` : ""}
                  ${product.price ? `<span class="sale-price">&#8377;${product.price}</span>` : ""}
                  ${savings > 0 ? `<span class="you-save">You save &#8377;${savings}</span>` : ""}
                </div>` : ""}
                <img src="${barcodeImg}" class="barcode" />
                <div class="code">${currentBarcode}</div>
                <div class="website">www.safawala.com</div>
              </div>`
          } else {
            labelsHTML += `<div class="label empty"></div>`
          }
        }
        labelsHTML += `</div>`
      }

      const printHTML = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@700;800&display=swap" rel="stylesheet">
<style>
  @page { size: 100mm 25mm; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Poppins', sans-serif; font-weight: 700; }
  html, body { width: 100mm; height: 25mm; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .row { width: 100mm; height: 25mm; display: flex; page-break-after: always; page-break-inside: avoid; }
  .row:last-child { page-break-after: avoid; }
  .label { width: 50mm; height: 25mm; display: flex; flex-direction: column; justify-content: flex-start; align-items: center; padding: 3mm 1mm 1mm 1mm; gap: 0.15mm; border: 0.5mm solid #ddd; }
  .label.empty { visibility: hidden; }
  .name { font-size: 6.7pt; font-weight: 800; color: #000; text-align: center; max-width: 48mm; overflow: hidden; line-height: 1.1; word-break: break-word; }
  .meta { font-size: 6.5pt; font-weight: 700; color: #333; text-align: center; max-width: 48mm; white-space: nowrap; overflow: hidden; line-height: 1.1; }
  .pricing-row { font-size: 6.5pt; font-weight: 700; color: #000; text-align: center; line-height: 1.2; white-space: nowrap; }
  .mrp-price { text-decoration: line-through; margin-right: 2px; }
  .sale-price { font-size: 8pt; font-weight: 800; color: #000; margin-right: 2px; }
  .you-save { font-size: 6.5pt; font-weight: 700; color: #000; }
  .barcode { width: 42mm; height: 5mm; display: block; image-rendering: pixelated; image-rendering: crisp-edges; }
  .code { font-size: 7.5pt; font-weight: 700; color: #000; text-align: center; line-height: 1; }
  .website { font-size: 6.5pt; font-weight: 700; color: #000; line-height: 1; margin-top: 0.5mm; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style></head><body>${labelsHTML}</body></html>`

      const printWindow = window.open("", "_blank")
      if (!printWindow) { toast.error("Please allow popups for printing"); return }
      printWindow.document.write(printHTML)
      printWindow.document.close()
      setTimeout(() => { printWindow.focus(); printWindow.print() }, 500)
      toast.success(`Sent ${quantity} labels to printer`)
    } catch (error) {
      console.error("Print error:", error)
      toast.error("Print failed")
    } finally {
      setPrinting(false)
    }
  }

  const metaPreview = [product.color, product.size, product.material].filter(Boolean).join(" | ")
  const savings = product.regular_price && product.price && product.regular_price > product.price
    ? product.regular_price - product.price : 0

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
              <AlertDescription>No barcode assigned yet. Generate one below.</AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      {!currentBarcode && (
        <Button onClick={generateNewBarcode} disabled={generating} className="w-full">
          {generating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {generating ? "Generating..." : "Generate Barcode"}
        </Button>
      )}

      {currentBarcode && (
        <>
          {/* Preview */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <p className="text-xs text-muted-foreground mb-3">Preview (50mm × 25mm)</p>
            <div className="bg-white border-2 border-gray-400 rounded p-2 inline-block">
              <div className="flex flex-col items-center gap-0.5" style={{ width: "200px" }}>
                <div className="text-[10px] font-bold text-center leading-tight">{product.name.substring(0, 22)}</div>
                {metaPreview && (
                  <div className="text-[8px] font-bold text-gray-600 text-center">{metaPreview}</div>
                )}
                {product.regular_price ? (
                  <div className="text-[8px] font-bold text-center">MRP: <span className="line-through">₹{product.regular_price}</span></div>
                ) : null}
                {product.price ? <div className="text-[11px] font-bold text-center">₹{product.price}</div> : null}
                {savings > 0 ? <div className="text-[7px] font-bold text-center">You save ₹{savings}</div> : null}
                <div className="bg-black h-5 w-full flex items-center justify-center mt-0.5">
                  <div className="flex gap-px h-4">
                    {Array.from({ length: 28 }).map((_, j) => (
                      <div key={j} className="bg-white" style={{ width: j % 4 === 0 ? "2px" : "1px" }} />
                    ))}
                  </div>
                </div>
                <div className="text-[8px] font-mono font-bold">{currentBarcode}</div>
                <div className="text-[7px] font-bold font-sans mt-0.5">www.safawala.com</div>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 mt-2">Scale: 1:1 on 100mm × 25mm paper</p>
          </div>

          {/* Print Settings */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="print-quantity" className="text-sm">Number of Labels</Label>
              <div className="flex gap-2 mt-1">
                <Input id="print-quantity" type="number" min="1" max="100" value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20" />
                <div className="flex gap-1">
                  {[1, 5, 10, 20, 50].map((n) => (
                    <Button key={n} size="sm" variant={quantity === n ? "default" : "outline"}
                      className="px-2 h-9" onClick={() => setQuantity(n)}>
                      {n}
                    </Button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.ceil(quantity / 2)} rows (2 labels per row × 50mm)
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <h4 className="font-semibold text-xs text-amber-900 mb-2">Thermal Printer Setup</h4>
              <ul className="text-xs text-amber-800 space-y-1">
                <li>• Paper Size: 100mm × 25mm</li>
                <li>• Margins: None (0mm)</li>
                <li>• Scale: 100% (no scaling)</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <Button onClick={handlePrint} disabled={printing || !currentBarcode}
                className="flex-1 bg-green-600 hover:bg-green-700">
                <Printer className="w-4 h-4 mr-2" />
                {printing ? "Printing..." : "Print Labels"}
              </Button>
              <Button disabled variant="outline" className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>

            <Button onClick={generateNewBarcode} disabled={generating} variant="outline" className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              {generating ? "Generating..." : "Generate New Barcode"}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
