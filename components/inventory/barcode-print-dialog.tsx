"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Printer, Loader2, AlertCircle, RefreshCw } from "lucide-react"
import { toast } from "sonner"

interface Product {
  id: string
  name: string
  barcode?: string
  price?: number
  regular_price?: number
  rental_price?: number
}

interface ProductVariant {
  id: string
  variation_name: string
  sku?: string
  barcode?: string
  price_adjustment?: number
  regular_price_adjustment?: number
}

interface BarcodeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
}

async function doPrint(barcode: string, label: string, qty: number, regularPrice?: number, salePrice?: number) {
  const JsBarcode = (await import("jsbarcode")).default
  const labelsPerRow = 2
  const rows = Math.ceil(qty / labelsPerRow)
  let labelsHTML = ""

  for (let row = 0; row < rows; row++) {
    labelsHTML += `<div class="row">`
    for (let col = 0; col < labelsPerRow; col++) {
      const idx = row * labelsPerRow + col
      if (idx < qty) {
        const canvas = document.createElement("canvas")
        JsBarcode(canvas, barcode, {
          format: "CODE128", width: 3, height: 80,
          displayValue: false, margin: 4,
          background: "#FFFFFF", lineColor: "#000000",
        })
        const barcodeImg = canvas.toDataURL("image/png")
        labelsHTML += `
          <div class="label">
            <div class="name">${label.substring(0, 20)}</div>
            <div class="prices">
              ${regularPrice ? `<div class="regular-price">₹${regularPrice}</div>` : ""}
              ${salePrice ? `<div class="sale-price">₹${salePrice}</div>` : ""}
            </div>
            <img src="${barcodeImg}" class="barcode" />
            <div class="code">${barcode}</div>
            <div class="website">www.safawala.com</div>
          </div>`
      } else {
        labelsHTML += `<div class="label empty"></div>`
      }
    }
    labelsHTML += `</div>`
  }

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  @page { size: 100mm 25mm; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100mm; height: 25mm; font-family: 'Courier New', monospace; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .row { width: 100mm; height: 25mm; display: flex; page-break-after: always; page-break-inside: avoid; }
  .row:last-child { page-break-after: avoid; }
  .label { width: 50mm; height: 25mm; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 1mm; gap: 0.3mm; border: 0.5mm solid #ddd; }
  .label.empty { visibility: hidden; }
  .name { font-size: 13pt; font-weight: bold; color: #000; text-align: center; max-width: 48mm; height: 5mm; overflow: hidden; line-height: 1.1; word-break: break-word; }
  .prices { display: flex; align-items: center; justify-content: center; gap: 3px; height: 3mm; line-height: 1; }
  .regular-price { font-size: 10pt; color: #666; text-decoration: line-through; }
  .sale-price { font-size: 13pt; font-weight: bold; color: #000; }
  .barcode { width: 42mm; height: 8mm; display: block; image-rendering: pixelated; image-rendering: crisp-edges; }
  .code { font-size: 11pt; font-weight: bold; color: #000; text-align: center; height: 2mm; line-height: 1; }
  .website { font-family: Arial, sans-serif; font-size: 8pt; color: #000; height: 2mm; line-height: 1; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style></head><body>${labelsHTML}</body></html>`

  const win = window.open("", "_blank")
  if (!win) { toast.error("Please allow popups for printing"); return }
  win.document.write(html)
  win.document.close()
  setTimeout(() => { win.focus(); win.print() }, 500)
}

export function BarcodePrintDialog({ open, onOpenChange, product }: BarcodeDialogProps) {
  const [quantity, setQuantity] = useState(1)
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [printing, setPrinting] = useState(false)
  const [loadingVariants, setLoadingVariants] = useState(false)
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("main")

  useEffect(() => {
    if (open && product?.id) {
      loadVariants()
      setSelectedVariantId(null)
      setQuantity(1)
      setActiveTab("main")
    }
  }, [open, product?.id])

  const loadVariants = async () => {
    if (!product?.id) return
    try {
      setLoadingVariants(true)
      const res = await fetch(`/api/products/${product.id}/variations`)
      if (!res.ok) throw new Error("Failed to load variants")
      const json = await res.json()
      setVariants(json.data || [])
    } catch {
      toast.error("Failed to load variants")
    } finally {
      setLoadingVariants(false)
    }
  }

  const handlePrint = async (barcode: string | undefined, label: string, regularPrice?: number, salePrice?: number) => {
    if (!barcode) { toast.error(`No barcode for ${label}`); return }
    if (quantity < 1) { toast.error("Enter at least 1 label"); return }
    setPrinting(true)
    try {
      await doPrint(barcode, label, quantity, regularPrice, salePrice)
      toast.success(`Sent ${quantity} label${quantity > 1 ? "s" : ""} to printer`)
    } catch {
      toast.error("Print failed")
    } finally {
      setPrinting(false)
    }
  }

  if (!product) return null

  const selectedVariant = variants.find((v) => v.id === selectedVariantId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Print Barcodes — {product.name}</DialogTitle>
        </DialogHeader>

        {loadingVariants ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="main">Main Product</TabsTrigger>
              <TabsTrigger value="variants">
                Variants ({variants.length})
              </TabsTrigger>
            </TabsList>

            {/* ── Main Product ── */}
            <TabsContent value="main" className="space-y-4 mt-4">
              {!product.barcode ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No barcode assigned. Open the product editor → Barcode tab to generate one.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  {/* Preview */}
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <p className="text-xs text-muted-foreground mb-3">Label preview (50mm × 25mm)</p>
                    <div className="bg-white border-2 border-gray-400 rounded p-2 inline-block">
                      <div className="flex flex-col items-center gap-0.5" style={{ width: "200px" }}>
                        <div className="text-[10px] font-bold text-center leading-tight max-w-[95%] truncate">
                          {product.name.substring(0, 20)}
                        </div>
                        <div className="flex items-center gap-1 justify-center">
                          {product.regular_price && (
                            <div className="text-[7px] text-gray-500 line-through">₹{product.regular_price}</div>
                          )}
                          {product.price && (
                            <div className="text-[9px] font-bold">₹{product.price}</div>
                          )}
                        </div>
                        <div className="bg-black h-5 w-full flex items-center justify-center">
                          <div className="flex gap-px h-4">
                            {Array.from({ length: 28 }).map((_, j) => (
                              <div key={j} className="bg-white" style={{ width: j % 4 === 0 ? "2px" : "1px" }} />
                            ))}
                          </div>
                        </div>
                        <div className="text-[8px] font-mono font-bold">{product.barcode}</div>
                        <div className="text-[6px] font-sans">www.safawala.com</div>
                      </div>
                    </div>
                  </div>

                  {/* Quantity */}
                  <div>
                    <Label className="text-sm">Number of Labels</Label>
                    <div className="flex gap-2 mt-1">
                      <Input type="number" min="1" max="100" value={quantity}
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
                      {Math.ceil(quantity / 2)} rows (2 labels per row)
                    </p>
                  </div>

                  {/* Thermal setup tip */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <h4 className="font-semibold text-xs text-amber-900 mb-1">Thermal Printer Setup</h4>
                    <ul className="text-xs text-amber-800 space-y-0.5">
                      <li>• Paper Size: 100mm × 25mm</li>
                      <li>• Margins: None (0mm) · Scale: 100%</li>
                    </ul>
                  </div>

                  <Button
                    onClick={() => handlePrint(product.barcode, product.name, product.regular_price, product.price)}
                    disabled={printing}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    {printing ? "Printing..." : "Print Labels"}
                  </Button>
                </>
              )}
            </TabsContent>

            {/* ── Variants ── */}
            <TabsContent value="variants" className="space-y-4 mt-4">
              {variants.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No variants for this product. Add variants in the product editor.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="space-y-2">
                    {variants.map((variant) => (
                      <div
                        key={variant.id}
                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                          selectedVariantId === variant.id
                            ? "bg-purple-50 border-purple-400"
                            : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                        }`}
                        onClick={() => setSelectedVariantId(variant.id)}
                      >
                        <p className="font-semibold text-sm">{variant.variation_name}</p>
                        {variant.sku && <p className="text-xs text-muted-foreground">SKU: {variant.sku}</p>}
                        {variant.barcode ? (
                          <code className="text-xs font-mono text-purple-700 bg-purple-100 px-2 py-0.5 rounded inline-block mt-1">
                            {variant.barcode}
                          </code>
                        ) : (
                          <p className="text-xs text-amber-600 mt-1">No barcode — open editor to regenerate</p>
                        )}
                      </div>
                    ))}
                  </div>

                  {selectedVariant && (
                    <>
                      {/* Preview */}
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <p className="text-xs text-muted-foreground mb-3">Label preview (50mm × 25mm)</p>
                        <div className="bg-white border-2 border-gray-400 rounded p-2 inline-block">
                          <div className="flex flex-col items-center gap-0.5" style={{ width: "200px" }}>
                            <div className="text-[10px] font-bold text-center leading-tight max-w-[95%] truncate">
                              {`${product.name} - ${selectedVariant.variation_name}`.substring(0, 20)}
                            </div>
                            <div className="flex items-center gap-1 justify-center">
                              {((product.regular_price ?? 0) + (selectedVariant.regular_price_adjustment ?? 0)) > 0 && (
                                <div className="text-[7px] text-gray-500 line-through">₹{(product.regular_price ?? 0) + (selectedVariant.regular_price_adjustment ?? 0)}</div>
                              )}
                              {((product.price ?? 0) + (selectedVariant.price_adjustment ?? 0)) > 0 && (
                                <div className="text-[9px] font-bold">₹{(product.price ?? 0) + (selectedVariant.price_adjustment ?? 0)}</div>
                              )}
                            </div>
                            <div className="bg-black h-5 w-full flex items-center justify-center">
                              <div className="flex gap-px h-4">
                                {Array.from({ length: 28 }).map((_, j) => (
                                  <div key={j} className="bg-white" style={{ width: j % 4 === 0 ? "2px" : "1px" }} />
                                ))}
                              </div>
                            </div>
                            <div className="text-[8px] font-mono font-bold">{selectedVariant.barcode || "—"}</div>
                            <div className="text-[6px] font-sans">www.safawala.com</div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm">Number of Labels</Label>
                        <div className="flex gap-2 mt-1">
                          <Input type="number" min="1" max="100" value={quantity}
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
                          {Math.ceil(quantity / 2)} rows (2 labels per row)
                        </p>
                      </div>

                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <h4 className="font-semibold text-xs text-amber-900 mb-1">Thermal Printer Setup</h4>
                        <ul className="text-xs text-amber-800 space-y-0.5">
                          <li>• Paper Size: 100mm × 25mm</li>
                          <li>• Margins: None (0mm) · Scale: 100%</li>
                        </ul>
                      </div>

                      <Button
                        onClick={() => handlePrint(
                          selectedVariant.barcode,
                          `${product.name} - ${selectedVariant.variation_name}`,
                          (product.regular_price ?? 0) + (selectedVariant.regular_price_adjustment ?? 0) || undefined,
                          (product.price ?? 0) + (selectedVariant.price_adjustment ?? 0) || undefined,
                        )}
                        disabled={printing || !selectedVariant.barcode}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <Printer className="w-4 h-4 mr-2" />
                        {printing ? "Printing..." : "Print Labels"}
                      </Button>
                    </>
                  )}
                </>
              )}

              <Button variant="outline" size="sm" className="w-full" onClick={loadVariants}>
                <RefreshCw className="w-3 h-3 mr-2" /> Refresh Variants
              </Button>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}
