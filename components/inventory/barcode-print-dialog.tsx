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
  color?: string
  size?: string
  material?: string
}

interface ProductVariant {
  id: string
  variation_name: string
  sku?: string
  barcode?: string
  price_adjustment?: number
  regular_price_adjustment?: number
  color?: string
  size?: string
  material?: string
}

interface BarcodeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
}

async function doPrint(
  barcode: string,
  label: string,
  qty: number,
  regularPrice?: number,
  salePrice?: number,
  color?: string,
  size?: string,
  material?: string,
) {
  const JsBarcode = (await import("jsbarcode")).default
  const labelsPerRow = 2
  const rows = Math.ceil(qty / labelsPerRow)
  let labelsHTML = ""

  // Split meta into 2 lines so it doesn't overflow the label
  const metaLine1 = [color, size].filter(Boolean).join(" | ")
  const metaLine2 = material || ""
  const savings = regularPrice && salePrice && regularPrice > salePrice ? regularPrice - salePrice : 0

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
            <div class="name">${label}</div>
            ${metaLine1 ? `<div class="meta">${metaLine1}</div>` : ""}
            ${metaLine2 ? `<div class="meta">${metaLine2}</div>` : ""}
            ${(regularPrice || salePrice) ? `<div class="pricing-row">
              ${regularPrice ? `MRP: <span class="mrp-price">&#8377;${regularPrice}</span>` : ""}
              ${salePrice ? `<span class="sale-price">&#8377;${salePrice}</span>` : ""}
              ${savings > 0 ? `<span class="you-save">You save &#8377;${savings}</span>` : ""}
            </div>` : ""}
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
  * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Arial Black', Arial, sans-serif; }
  html, body { width: 100mm; height: 25mm; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; overflow: hidden; }
  .row { width: 100mm; height: 25mm; display: flex; page-break-after: always; page-break-inside: avoid; }
  .row:last-child { page-break-after: avoid; }
  .label { width: 50mm; height: 25mm; display: flex; flex-direction: column; justify-content: flex-start; align-items: center; padding: 2.5pt 1mm 0 1mm; gap: 0; border: 0.5mm solid #ddd; overflow: hidden; }
  .label.empty { visibility: hidden; }
  .name { font-size: 8pt; font-weight: 900; color: #000; text-align: center; width: 48mm; overflow: hidden; line-height: 1.15; word-break: break-word; margin-bottom: 0.4mm; }
  .meta { font-size: 6.5pt; font-weight: 700; color: #000; text-align: center; width: 48mm; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.15; }
  .pricing-row { font-size: 6.5pt; font-weight: 700; color: #000; text-align: center; line-height: 1.15; white-space: nowrap; margin-top: 0.4mm; }
  .mrp-price { text-decoration: line-through; margin-right: 2px; color: #555; }
  .sale-price { font-size: 8pt; font-weight: 900; color: #000; margin-right: 2px; }
  .you-save { font-size: 6pt; font-weight: 700; color: #000; }
  .barcode { width: 43mm; height: 5mm; display: block; image-rendering: pixelated; image-rendering: crisp-edges; margin-top: 0.4mm; }
  .code { font-size: 6.5pt; font-weight: 700; color: #000; text-align: center; letter-spacing: 0.5px; line-height: 1.1; font-family: 'Courier New', monospace; }
  .website { font-size: 6pt; font-weight: 700; color: #000; line-height: 1.1; font-family: Arial, sans-serif; }
  @media print { * { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style></head><body>${labelsHTML}</body></html>`

  const win = window.open("", "_blank")
  if (!win) { toast.error("Please allow popups for printing"); return }
  win.document.write(html)
  win.document.close()
  setTimeout(() => { win.focus(); win.print() }, 200)
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

  const handlePrint = async (
    barcode: string | undefined,
    label: string,
    regularPrice?: number,
    salePrice?: number,
    color?: string,
    size?: string,
    material?: string,
  ) => {
    if (!barcode) { toast.error(`No barcode for ${label}`); return }
    if (quantity < 1) { toast.error("Enter at least 1 label"); return }
    setPrinting(true)
    try {
      await doPrint(barcode, label, quantity, regularPrice, salePrice, color, size, material)
      toast.success(`Sent ${quantity} label${quantity > 1 ? "s" : ""} to printer`)
    } catch {
      toast.error("Print failed")
    } finally {
      setPrinting(false)
    }
  }

  if (!product) return null

  const selectedVariant = variants.find((v) => v.id === selectedVariantId)

  // Helper to build meta preview string
  const buildMeta = (color?: string, size?: string, material?: string) =>
    [color, size, material].filter(Boolean).join(" | ")

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
              <TabsTrigger value="variants">Variants ({variants.length})</TabsTrigger>
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
                        <div className="text-[10px] font-bold text-center leading-tight">{product.name.substring(0, 22)}</div>
                        {buildMeta(product.color, product.size, product.material) && (
                          <div className="text-[8px] font-bold text-gray-600 text-center">{buildMeta(product.color, product.size, product.material)}</div>
                        )}
                        {product.regular_price ? (
                          <div className="text-[8px] font-bold text-center">MRP: <span className="line-through">₹{product.regular_price}</span></div>
                        ) : null}
                        {product.price ? <div className="text-[11px] font-bold text-center">₹{product.price}</div> : null}
                        {product.regular_price && product.price && product.regular_price > product.price ? (
                          <div className="text-[7px] font-bold text-center">You save ₹{product.regular_price - product.price}</div>
                        ) : null}
                        <div className="bg-black h-5 w-full flex items-center justify-center mt-0.5">
                          <div className="flex gap-px h-4">
                            {Array.from({ length: 28 }).map((_, j) => (
                              <div key={j} className="bg-white" style={{ width: j % 4 === 0 ? "2px" : "1px" }} />
                            ))}
                          </div>
                        </div>
                        <div className="text-[8px] font-mono font-bold">{product.barcode}</div>
                        <div className="text-[7px] font-bold font-sans mt-0.5">www.safawala.com</div>
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
                    onClick={() => handlePrint(product.barcode, product.name, product.regular_price, product.price, product.color, product.size, product.material)}
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
                        {buildMeta(variant.color, variant.size, variant.material) && (
                          <p className="text-xs text-muted-foreground">{buildMeta(variant.color, variant.size, variant.material)}</p>
                        )}
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

                  {selectedVariant && (() => {
                    const regPrice = (product.regular_price ?? 0) + (selectedVariant.regular_price_adjustment ?? 0) || undefined
                    const salPrice = (product.price ?? 0) + (selectedVariant.price_adjustment ?? 0) || undefined
                    const varColor = selectedVariant.color || product.color
                    const varSize = selectedVariant.size || product.size
                    const varMaterial = selectedVariant.material || product.material
                    return (
                      <>
                        {/* Preview */}
                        <div className="border rounded-lg p-4 bg-gray-50">
                          <p className="text-xs text-muted-foreground mb-3">Label preview (50mm × 25mm)</p>
                          <div className="bg-white border-2 border-gray-400 rounded p-2 inline-block">
                            <div className="flex flex-col items-center gap-0.5" style={{ width: "200px" }}>
                              <div className="text-[10px] font-bold text-center leading-tight">
                                {`${product.name} - ${selectedVariant.variation_name}`.substring(0, 22)}
                              </div>
                              {buildMeta(varColor, varSize, varMaterial) && (
                                <div className="text-[8px] font-bold text-gray-600 text-center">{buildMeta(varColor, varSize, varMaterial)}</div>
                              )}
                              {regPrice ? (
                                <div className="text-[8px] font-bold text-center">MRP: <span className="line-through">₹{regPrice}</span></div>
                              ) : null}
                              {salPrice ? <div className="text-[11px] font-bold text-center">₹{salPrice}</div> : null}
                              {regPrice && salPrice && regPrice > salPrice ? (
                                <div className="text-[7px] font-bold text-center">You save ₹{regPrice - salPrice}</div>
                              ) : null}
                              <div className="bg-black h-5 w-full flex items-center justify-center mt-0.5">
                                <div className="flex gap-px h-4">
                                  {Array.from({ length: 28 }).map((_, j) => (
                                    <div key={j} className="bg-white" style={{ width: j % 4 === 0 ? "2px" : "1px" }} />
                                  ))}
                                </div>
                              </div>
                              <div className="text-[8px] font-mono font-bold">{selectedVariant.barcode || "—"}</div>
                              <div className="text-[7px] font-bold font-sans mt-0.5">www.safawala.com</div>
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
                          onClick={() => handlePrint(selectedVariant.barcode, `${product.name} - ${selectedVariant.variation_name}`, regPrice, salPrice, varColor, varSize, varMaterial)}
                          disabled={printing || !selectedVariant.barcode}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          <Printer className="w-4 h-4 mr-2" />
                          {printing ? "Printing..." : "Print Labels"}
                        </Button>
                      </>
                    )
                  })()}
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
