"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Printer, Loader2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"

interface Product {
  id: string
  name: string
  barcode?: string
}

interface ProductVariant {
  id: string
  variation_name: string
  sku?: string
  barcode?: string
}

interface BarcodeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
}

export function BarcodePrintDialog({ open, onOpenChange, product }: BarcodeDialogProps) {
  const [quantity, setQuantity] = useState(1)
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [printing, setPrinting] = useState(false)
  const [loadingVariants, setLoadingVariants] = useState(false)
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)

  useEffect(() => {
    if (open && product?.id) {
      loadVariants()
    }
  }, [open, product?.id])

  const loadVariants = async () => {
    if (!product?.id) return
    try {
      setLoadingVariants(true)
      const { data, error } = await supabase
        .from("product_variations")
        .select("id, variation_name, sku, barcode")
        .eq("product_id", product.id)
        .eq("is_active", true)

      if (error) throw error
      setVariants(data || [])
    } catch (error) {
      console.error("Failed to load variants:", error)
      toast.error("Failed to load variants")
    } finally {
      setLoadingVariants(false)
    }
  }

  const handlePrint = async (barcode: string | undefined, label: string) => {
    if (!barcode) {
      toast.error(`No barcode available for ${label}`)
      return
    }

    if (quantity < 1) {
      toast.error("Enter at least 1 label")
      return
    }

    setPrinting(true)

    try {
      const JsBarcode = (await import("jsbarcode")).default

      const labelsPerRow = 2
      const rows = Math.ceil(quantity / labelsPerRow)
      let labelsHTML = ""

      for (let row = 0; row < rows; row++) {
        labelsHTML += `<div class="row">`

        for (let col = 0; col < labelsPerRow; col++) {
          const idx = row * labelsPerRow + col
          if (idx < quantity) {
            const canvas = document.createElement("canvas")
            JsBarcode(canvas, barcode, {
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
                <div class="name">${label.substring(0, 16)}</div>
                <img src="${barcodeImg}" class="barcode" />
                <div class="code">${barcode}</div>
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

  if (!product) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Print Barcodes - {product.name}</DialogTitle>
        </DialogHeader>

        {loadingVariants ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="main" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="main">Main Product</TabsTrigger>
              <TabsTrigger value="variants" disabled={variants.length === 0}>
                Variants ({variants.length})
              </TabsTrigger>
            </TabsList>

            <div className="space-y-4 mt-4">
              {/* Main Product Tab */}
              <TabsContent value="main" className="space-y-4">
                {!product.barcode ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No barcode assigned. Go to product editor to generate one.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Product Barcode</p>
                      <code className="text-sm font-mono font-bold text-blue-700">{product.barcode}</code>
                    </div>

                    <div>
                      <Label htmlFor="main-quantity" className="text-sm">Number of Labels</Label>
                      <Input
                        id="main-quantity"
                        type="number"
                        min="1"
                        max="100"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="mt-2"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {Math.ceil(quantity / 2)} rows (2 labels per row)
                      </p>
                    </div>

                    <Button
                      onClick={() => handlePrint(product.barcode, product.name)}
                      disabled={printing || !product.barcode}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <Printer className="w-4 h-4 mr-2" />
                      {printing ? "Printing..." : "Print Labels"}
                    </Button>
                  </>
                )}
              </TabsContent>

              {/* Variants Tab */}
              <TabsContent value="variants" className="space-y-4">
                {variants.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No variants available for this product.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <div className="space-y-3">
                      {variants.map((variant) => (
                        <div
                          key={variant.id}
                          className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                            selectedVariantId === variant.id
                              ? "bg-purple-50 border-purple-300"
                              : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                          }`}
                          onClick={() => setSelectedVariantId(variant.id)}
                        >
                          <p className="font-semibold text-sm">{variant.variation_name}</p>
                          {variant.sku && <p className="text-xs text-muted-foreground">SKU: {variant.sku}</p>}
                          {variant.barcode ? (
                            <code className="text-xs font-mono text-purple-700 bg-purple-100 px-2 py-1 rounded inline-block mt-1">
                              {variant.barcode}
                            </code>
                          ) : (
                            <p className="text-xs text-amber-600 mt-1">No barcode assigned</p>
                          )}
                        </div>
                      ))}
                    </div>

                    {selectedVariantId && (
                      <>
                        <div>
                          <Label htmlFor="variant-quantity" className="text-sm">Number of Labels</Label>
                          <Input
                            id="variant-quantity"
                            type="number"
                            min="1"
                            max="100"
                            value={quantity}
                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                            className="mt-2"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            {Math.ceil(quantity / 2)} rows (2 labels per row)
                          </p>
                        </div>

                        <Button
                          onClick={() => {
                            const variant = variants.find((v) => v.id === selectedVariantId)
                            if (variant) {
                              handlePrint(
                                variant.barcode,
                                `${product.name} - ${variant.variation_name}`
                              )
                            }
                          }}
                          disabled={printing || !variants.find((v) => v.id === selectedVariantId)?.barcode}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          <Printer className="w-4 h-4 mr-2" />
                          {printing ? "Printing..." : "Print Labels"}
                        </Button>
                      </>
                    )}
                  </>
                )}
              </TabsContent>
            </div>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}
