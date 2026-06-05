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

export function getCleanVariantName(productName: string, variationName: string): string {
  if (!productName) return variationName || ""
  if (!variationName) return productName

  const pName = productName.trim()
  const vName = variationName.trim()
  const pNameLower = pName.toLowerCase()
  const vNameLower = vName.toLowerCase()

  if (pNameLower === vNameLower) return pName
  if (vNameLower.startsWith(pNameLower)) {
    const rest = vName.substring(pName.length).replace(/^[\s\-\|\,\:]+/, "")
    return rest ? `${pName} - ${rest}` : pName
  }
  const firstWord = pName.split(/\s+/)[0]
  if (firstWord && firstWord.length > 1) {
    const firstWordLower = firstWord.toLowerCase()
    if (vNameLower.startsWith(firstWordLower)) {
      const rest = vName.substring(firstWord.length).replace(/^[\s\-\|\,\:]+/, "")
      return rest ? `${pName} - ${rest}` : pName
    }
  }
  return `${pName} - ${vName}`
}

// ── Style 1: 50mm × 25mm, 2-up ──────────────────────────────────────────────
export async function doPrint(
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
              ${regularPrice ? `MRP: <span class="mrp-price">₹${regularPrice}</span>` : ""}
              ${salePrice ? `<span class="sale-price">₹${salePrice}</span>` : ""}
              ${savings > 0 ? `<span class="you-save">You save ₹${savings}</span>` : ""}
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
  .label { width: 50mm; height: 25mm; display: flex; flex-direction: column; justify-content: flex-start; align-items: center; padding: 3mm 1mm 0 1mm; gap: 0; border: 0.5mm solid #ddd; overflow: hidden; }
  .label.empty { visibility: hidden; }
  .name { font-size: 6.7pt; font-weight: 900; color: #000; text-align: center; width: 48mm; overflow: hidden; line-height: 1.15; word-break: break-word; margin-bottom: 0.4mm; }
  .meta { font-size: 6.5pt; font-weight: 500; color: #000; text-align: center; width: 48mm; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.15; }
  .pricing-row { font-size: 6.5pt; font-weight: 700; color: #000; text-align: center; line-height: 1.15; white-space: nowrap; margin-top: 0.4mm; font-family: Arial, sans-serif; }
  .mrp-price { position: relative; display: inline-block; margin-right: 2px; color: #777; white-space: nowrap; font-family: Arial, sans-serif; }
  .mrp-price::before, .mrp-price::after { content: ""; position: absolute; left: -5%; top: 50%; width: 110%; height: 1px; background: #777; }
  .mrp-price::before { transform: rotate(15deg); }
  .mrp-price::after { transform: rotate(-15deg); }
  .sale-price { font-size: 8pt; font-weight: 900; color: #000; margin-right: 2px; font-family: Arial, sans-serif; }
  .you-save { font-size: 6pt; font-weight: 700; color: #000; font-family: Arial, sans-serif; }
  .barcode { width: 43mm; height: 5mm; display: block; image-rendering: pixelated; image-rendering: crisp-edges; margin-top: 0.4mm; }
  .code { font-size: 6.5pt; font-weight: 700; color: #000; text-align: center; letter-spacing: 0.5px; line-height: 1.1; font-family: 'Courier New', monospace; }
  .website { font-size: 6pt; font-weight: 700; color: #000; line-height: 1.1; font-family: Arial, sans-serif; }
  @media print { * { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style></head><body>${labelsHTML}</body></html>`

  const win1 = window.open("", "_blank")
  if (!win1) { toast.error("Please allow popups for printing"); return }
  win1.document.write(html)
  win1.document.close()
  setTimeout(() => { win1.focus(); win1.print() }, 200)
}

// ── Style 2: 100mm × 15mm jewelry price tag labels ──────────────────────────────────────────
export async function doPrintStyle2(
  barcode: string,
  label: string,
  qty: number,
  regularPrice?: number,
  salePrice?: number,
  color?: string,
  size?: string,
  material?: string,
  topOffset: number = 0,
) {
  // Identical flow to doPrint — only the label HTML differs
  const JsBarcode = (await import("jsbarcode")).default
  const savings = regularPrice && salePrice && regularPrice > salePrice ? regularPrice - salePrice : 0

  const canvas = document.createElement("canvas")
  JsBarcode(canvas, barcode, {
    format: "CODE128", width: 3, height: 80,
    displayValue: false, margin: 4,
    background: "#FFFFFF", lineColor: "#000000",
  })
  const barcodeImg = canvas.toDataURL("image/png")

  // Logo as canvas data URL — avoids cross-origin issues in print window
  let logoSrc = ""
  try {
    const logoImg = new Image()
    logoImg.crossOrigin = "anonymous"
    await new Promise<void>((resolve) => {
      logoImg.onload = () => {
        const c = document.createElement("canvas")
        c.width = logoImg.naturalWidth
        c.height = logoImg.naturalHeight
        c.getContext("2d")!.drawImage(logoImg, 0, 0)
        logoSrc = c.toDataURL("image/png")
        resolve()
      }
      logoImg.onerror = () => resolve()
      logoImg.src = "/safawalalogo.png"
    })
  } catch { /* text fallback */ }

  const logoHTML = logoSrc
    ? `<img src="${logoSrc}" style="max-width:22mm;max-height:4mm;object-fit:contain;" />`
    : `<span style="font-size:6pt;font-weight:900;color:#c8a84b;letter-spacing:0.5px;">SAFAWALA</span>`

  const feats = [
    material ? `<div class="feat"><span class="fk">Material</span><span class="fv">${material}</span></div>` : "",
    size     ? `<div class="feat"><span class="fk">Size</span><span class="fv">${size}</span></div>` : "",
    color    ? `<div class="feat"><span class="fk">Colour</span><span class="fv">${color}</span></div>` : "",
  ].join("")

  let labelsHTML = ""
  for (let row = 0; row < qty; row++) {
    const isFirst = row === 0
    const rowStyle = isFirst && topOffset > 0 ? `style="padding-top: ${topOffset}mm;"` : ""
    labelsHTML += `
    <div class="row" ${rowStyle}>
      <div class="s1">
        <div class="prow">
          ${regularPrice ? `MRP: <span class="mrp">₹${regularPrice}</span>` : ""}
          ${salePrice ? `<span class="sale">₹${salePrice}</span>` : ""}
          ${savings > 0 ? `<span class="save">You save ₹${savings}</span>` : ""}
        </div>
        <img src="${barcodeImg}" class="bc" />
        <div class="code">${barcode}</div>
        <div class="web">www.safawala.com</div>
      </div>
      <div class="sep"></div>
      <div class="s2">
        <div class="logo">${logoHTML}</div>
        <div class="hr"></div>
        <div class="pname">${label}</div>
        ${feats ? `<div class="feats">${feats}</div>` : ""}
      </div>
      <div class="s3"></div>
    </div>`
  }

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  @page { size: 100mm 15mm; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; font-family: Arial, sans-serif; }
  html, body { width: 100mm; margin: 0; padding: 0; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .row { width: 100mm; height: 15mm; display: flex; flex-direction: row; page-break-after: always; page-break-inside: avoid; overflow: hidden; }
  .row:last-child { page-break-after: avoid; }
  .s1 { width: 35mm; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0.5mm 1mm; gap: 0.2mm; }
  .prow { font-size: 4.5pt; font-weight: 700; color: #000; text-align: center; white-space: nowrap; line-height: 1.2; }
  .mrp { position: relative; display: inline-block; color: #aaa; margin-right: 0.5mm; }
  .mrp::before, .mrp::after { content: ""; position: absolute; left: -5%; top: 50%; width: 110%; height: 1px; background: #aaa; }
  .mrp::before { transform: rotate(12deg); } .mrp::after { transform: rotate(-12deg); }
  .sale { font-size: 7pt; font-weight: 900; color: #000; margin-right: 0.5mm; }
  .save { font-size: 3.5pt; color: #555; }
  .bc { width: 32mm; height: 5mm; display: block; image-rendering: pixelated; image-rendering: crisp-edges; }
  .code { font-family: 'Courier New', monospace; font-size: 4pt; color: #333; text-align: center; }
  .web { font-size: 3.5pt; color: #888; }
  .sep { width: 0.2mm; background: #ddd; align-self: stretch; margin: 1mm 0; }
  .s2 { width: 35mm; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0.5mm 1mm; gap: 0.3mm; }
  .logo { display: flex; align-items: center; justify-content: center; }
  .hr { width: 80%; height: 0.15mm; background: #ddd; }
  .pname { font-size: 5pt; font-weight: 900; color: #111; text-align: center; line-height: 1.1; max-width: 33mm; word-break: break-word; overflow: hidden; max-height: 3.5mm; }
  .feats { display: flex; flex-direction: column; gap: 0.3mm; align-items: flex-start; width: 100%; }
  .feat { display: flex; gap: 1mm; align-items: center; }
  .fk { font-size: 3.5pt; color: #999; text-transform: uppercase; min-width: 9mm; }
  .fv { font-size: 4pt; font-weight: bold; color: #222; }
  .s3 { width: 30mm; height: 100%; }
  @media print { * { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style></head><body>${labelsHTML}</body></html>`

  const win = window.open("", "_blank")
  if (!win) { toast.error("Please allow popups for printing"); return }
  win.document.write(html)
  win.document.close()
  setTimeout(() => { win.focus(); win.print() }, 200)
}

// ── Dialog ───────────────────────────────────────────────────────────────────
export function BarcodePrintDialog({ open, onOpenChange, product }: BarcodeDialogProps) {
  const [quantity, setQuantity] = useState(1)
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [printing, setPrinting] = useState(false)
  const [loadingVariants, setLoadingVariants] = useState(false)
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("main")
  const [printStyle, setPrintStyle] = useState<1 | 2>(1)
  const [topOffset, setTopOffset] = useState(0) // mm offset for first label alignment

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
      if (printStyle === 2) {
        await doPrintStyle2(barcode, label, quantity, regularPrice, salePrice, color, size, material, topOffset)
      } else {
        await doPrint(barcode, label, quantity, regularPrice, salePrice, color, size, material)
      }
      toast.success(`Sent ${quantity} label${quantity > 1 ? "s" : ""} to printer`)
    } catch {
      toast.error("Print failed")
    } finally {
      setPrinting(false)
    }
  }

  if (!product) return null

  const selectedVariant = variants.find((v) => v.id === selectedVariantId)
  const regPrice = selectedVariant
    ? (product.regular_price ?? 0) + (selectedVariant.regular_price_adjustment ?? 0) || undefined
    : undefined
  const salPrice = selectedVariant
    ? (product.price ?? 0) + (selectedVariant.price_adjustment ?? 0) || undefined
    : undefined
  const varColor    = selectedVariant ? selectedVariant.color    || product.color    : undefined
  const varSize     = selectedVariant ? selectedVariant.size     || product.size     : undefined
  const varMaterial = selectedVariant ? selectedVariant.material || product.material : undefined
  const varName     = selectedVariant ? getCleanVariantName(product.name, selectedVariant.variation_name) : ""

  const buildMeta = (color?: string, size?: string, material?: string) =>
    [color, size, material].filter(Boolean).join(" | ")

  // ── Style selector (shared across tabs) ──
  const StyleSelector = () => (
    <div className="mb-1">
      <Label className="text-xs mb-1.5 block">Label Style</Label>
      <div className="flex gap-2">
        {/* Style 1 card */}
        <button
          onClick={() => setPrintStyle(1)}
          className={`flex-1 rounded border-2 p-2 text-left transition-all ${
            printStyle === 1 ? "border-green-600 bg-green-50" : "border-gray-200 hover:border-gray-300 bg-white"
          }`}
        >
          <div className="text-[10px] font-bold mb-1.5">Style 1 — Simple</div>
          <div className="flex gap-1">
            {[0, 1].map((i) => (
              <div key={i} className="flex-1 border border-gray-300 p-1 bg-white flex flex-col items-center gap-0.5">
                <div className="text-[5px] font-bold truncate w-full text-center text-gray-700 leading-tight">
                  {(product.name || "Product").substring(0, 12)}
                </div>
                <div className="bg-black h-2 w-full" />
                <div className="text-[4px] font-mono text-gray-500 truncate w-full text-center">
                  {product.barcode?.substring(0, 10) || "BARCODE"}
                </div>
              </div>
            ))}
          </div>
          <div className="text-[8px] text-gray-400 text-center mt-1">50mm × 2 per row · 25mm tall</div>
        </button>

        {/* Style 2 card */}
        <button
          onClick={() => setPrintStyle(2)}
          className={`flex-1 rounded border-2 p-2 text-left transition-all ${
            printStyle === 2 ? "border-green-600 bg-green-50" : "border-gray-200 hover:border-gray-300 bg-white"
          }`}
        >
          <div className="text-[10px] font-bold mb-1.5">Style 2 — Branded</div>
          <div className="border border-gray-300 bg-white flex h-8 overflow-hidden rounded-sm">
            {/* mini sec 1 */}
            <div className="flex-1 border-r border-gray-200 flex flex-col items-center justify-center gap-px px-0.5">
              {product.price && <div className="text-[5.5px] font-black leading-none">₹{product.price}</div>}
              <div className="bg-black h-1.5 w-full" />
              <div className="text-[3.5px] font-mono text-gray-400 truncate w-full text-center leading-none">
                {product.barcode?.substring(0, 10) || "BARCODE"}
              </div>
              <div className="text-[3px] text-gray-300 leading-none">safawala.com</div>
            </div>
            {/* mini sec 2 */}
            <div className="flex-1 flex flex-col items-center justify-center gap-px px-0.5">
              <div className="text-[4.5px] font-black text-yellow-600 leading-none">SAFAWALA</div>
              <div className="text-[4px] font-bold text-center text-gray-700 truncate w-full leading-tight">
                {(product.name || "Product").substring(0, 10)}
              </div>
              {product.material && <div className="text-[3px] text-gray-400 leading-none">{product.material}</div>}
            </div>
            {/* mini sec 3 blank */}
            <div className="w-4 bg-gray-50" />
          </div>
          <div className="text-[8px] text-gray-400 text-center mt-1">100mm × 1 per row · 15mm tall</div>
        </button>
      </div>
    </div>
  )

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
            <TabsContent value="main" className="space-y-3 mt-4">
              {!product.barcode ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No barcode assigned. Open the product editor → Barcode tab to generate one.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <StyleSelector />

                  {/* Preview */}
                  <div className="border rounded-lg p-3 bg-gray-50">
                    <p className="text-xs text-muted-foreground mb-2">
                      {printStyle === 1 ? "Label preview (50mm × 25mm)" : "Label preview (100mm × 15mm)"}
                    </p>
                    {printStyle === 1 ? (
                      <div className="bg-white border-2 border-gray-400 rounded p-2 inline-block">
                        <div className="flex flex-col items-center gap-0.5" style={{ width: "200px" }}>
                          <div className="text-[10px] font-bold text-center leading-tight">{product.name.substring(0, 22)}</div>
                          {buildMeta(product.color, product.size, product.material) && (
                            <div className="text-[8px] font-bold text-gray-600 text-center">{buildMeta(product.color, product.size, product.material)}</div>
                          )}
                          {product.regular_price ? (
                            <div className="text-[8px] font-bold text-center">
                              MRP:{" "}
                              <span className="relative inline-block mr-0.5 text-gray-500">
                                ₹{product.regular_price}
                                <span className="absolute left-[-5%] top-1/2 w-[110%] h-[1px] bg-gray-500 rotate-[15deg]"></span>
                                <span className="absolute left-[-5%] top-1/2 w-[110%] h-[1px] bg-gray-500 -rotate-[15deg]"></span>
                              </span>
                            </div>
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
                    ) : (
                      /* Style 2 preview */
                      <div className="bg-white border-2 border-gray-400 rounded flex overflow-hidden" style={{ width: "100%", height: "56px" }}>
                        {/* sec 1 */}
                        <div className="flex flex-col items-center justify-center gap-0.5 border-r border-gray-200 px-2" style={{ width: "35%" }}>
                          {product.price && <div className="text-[9px] font-black">₹{product.price}</div>}
                          <div className="bg-black h-3 w-full" />
                          <div className="text-[6px] font-mono text-gray-500 truncate w-full text-center">{product.barcode}</div>
                          <div className="text-[5px] text-gray-400">www.safawala.com</div>
                        </div>
                        {/* sec 2 */}
                        <div className="flex flex-col items-center justify-center gap-0.5 px-2" style={{ width: "35%" }}>
                          <div className="text-[7px] font-black text-yellow-600">SAFAWALA</div>
                          <div className="w-full h-px bg-gray-200" />
                          <div className="text-[7px] font-bold text-center leading-tight text-gray-800">{product.name.substring(0, 18)}</div>
                          {product.material && <div className="text-[5px] text-gray-400">Mat: {product.material}</div>}
                          {product.size     && <div className="text-[5px] text-gray-400">Size: {product.size}</div>}
                          {product.color    && <div className="text-[5px] text-gray-400">Col: {product.color}</div>}
                        </div>
                        {/* sec 3 blank */}
                        <div className="bg-gray-50" style={{ width: "30%" }} />
                      </div>
                    )}
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
                          <Button key={n} type="button" size="sm" variant={quantity === n ? "default" : "outline"}
                            className="px-2 h-9" onClick={() => setQuantity(n)}>
                            {n}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {printStyle === 1
                        ? `${Math.ceil(quantity / 2)} rows (2 labels per row)`
                        : `${quantity} rows (1 label per row)`}
                    </p>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <h4 className="font-semibold text-xs text-amber-900 mb-1">Thermal Printer Setup</h4>
                    <ul className="text-xs text-amber-800 space-y-0.5">
                      {printStyle === 1 ? (
                        <>
                          <li>• Paper Size: 100mm × 25mm</li>
                          <li>• Margins: None (0mm) · Scale: 100%</li>
                        </>
                      ) : (
                        <>
                          <li>• Paper Size: 100mm × 15mm</li>
                          <li>• Margins: None (0mm) · Scale: 100%</li>
                        </>
                      )}
                    </ul>
                  </div>

                  {/* Top Offset — only for Style 2 */}
                  {printStyle === 2 && (
                    <div>
                      <Label className="text-xs">Top Offset (alignment)</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          type="number"
                          min="0"
                          max="50"
                          step="1"
                          value={topOffset}
                          onChange={(e) => setTopOffset(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-16 h-8 text-sm"
                        />
                        <span className="text-xs text-gray-500">mm</span>
                        <div className="flex gap-1">
                          {[0, 5, 10, 15, 20].map((n) => (
                            <Button key={n} type="button" size="sm" variant={topOffset === n ? "default" : "outline"}
                              className="h-7 px-2 text-[10px]" onClick={() => setTopOffset(n)}>
                              {n}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">
                        Adjust if labels print between stickers. Default: 15mm.
                      </p>
                    </div>
                  )}

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
            <TabsContent value="variants" className="space-y-3 mt-4">
              {variants.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No variants for this product. Add variants in the product editor.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <StyleSelector />

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

                  {selectedVariant && (
                    <>
                      {/* Preview */}
                      <div className="border rounded-lg p-3 bg-gray-50">
                        <p className="text-xs text-muted-foreground mb-2">
                          {printStyle === 1 ? "Label preview (50mm × 25mm)" : "Label preview (100mm × 15mm)"}
                        </p>
                        {printStyle === 1 ? (
                          <div className="bg-white border-2 border-gray-400 rounded p-2 inline-block">
                            <div className="flex flex-col items-center gap-0.5" style={{ width: "200px" }}>
                              <div className="text-[10px] font-bold text-center leading-tight">{varName}</div>
                              {buildMeta(varColor, varSize, varMaterial) && (
                                <div className="text-[8px] font-bold text-gray-600 text-center">{buildMeta(varColor, varSize, varMaterial)}</div>
                              )}
                              {regPrice ? (
                                <div className="text-[8px] font-bold text-center">
                                  MRP:{" "}
                                  <span className="relative inline-block mr-0.5 text-gray-500">
                                    ₹{regPrice}
                                    <span className="absolute left-[-5%] top-1/2 w-[110%] h-[1px] bg-gray-500 rotate-[15deg]"></span>
                                    <span className="absolute left-[-5%] top-1/2 w-[110%] h-[1px] bg-gray-500 -rotate-[15deg]"></span>
                                  </span>
                                </div>
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
                        ) : (
                          <div className="bg-white border-2 border-gray-400 rounded flex overflow-hidden" style={{ width: "100%", height: "56px" }}>
                            <div className="flex flex-col items-center justify-center gap-0.5 border-r border-gray-200 px-2" style={{ width: "35%" }}>
                              {salPrice && <div className="text-[9px] font-black">₹{salPrice}</div>}
                              <div className="bg-black h-3 w-full" />
                              <div className="text-[6px] font-mono text-gray-500 truncate w-full text-center">{selectedVariant.barcode || "—"}</div>
                              <div className="text-[5px] text-gray-400">www.safawala.com</div>
                            </div>
                            <div className="flex flex-col items-center justify-center gap-0.5 px-2" style={{ width: "35%" }}>
                              <div className="text-[7px] font-black text-yellow-600">SAFAWALA</div>
                              <div className="w-full h-px bg-gray-200" />
                              <div className="text-[7px] font-bold text-center leading-tight text-gray-800">{varName.substring(0, 18)}</div>
                              {varMaterial && <div className="text-[5px] text-gray-400">Mat: {varMaterial}</div>}
                              {varSize     && <div className="text-[5px] text-gray-400">Size: {varSize}</div>}
                              {varColor    && <div className="text-[5px] text-gray-400">Col: {varColor}</div>}
                            </div>
                            <div className="bg-gray-50" style={{ width: "30%" }} />
                          </div>
                        )}
                      </div>

                      <div>
                        <Label className="text-sm">Number of Labels</Label>
                        <div className="flex gap-2 mt-1">
                          <Input type="number" min="1" max="100" value={quantity}
                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-20" />
                          <div className="flex gap-1">
                            {[1, 5, 10, 20, 50].map((n) => (
                              <Button key={n} type="button" size="sm" variant={quantity === n ? "default" : "outline"}
                                className="px-2 h-9" onClick={() => setQuantity(n)}>
                                {n}
                              </Button>
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {printStyle === 1
                            ? `${Math.ceil(quantity / 2)} rows (2 labels per row)`
                            : `${quantity} rows (1 label per row)`}
                        </p>
                      </div>

                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <h4 className="font-semibold text-xs text-amber-900 mb-1">Thermal Printer Setup</h4>
                        <ul className="text-xs text-amber-800 space-y-0.5">
                          {printStyle === 1 ? (
                            <>
                              <li>• Paper Size: 100mm × 25mm</li>
                              <li>• Margins: None (0mm) · Scale: 100%</li>
                            </>
                          ) : (
                            <>
                              <li>• Paper Size: 100mm × 15mm</li>
                              <li>• Margins: None (0mm) · Scale: 100%</li>
                            </>
                          )}
                        </ul>
                      </div>

                      {/* Top Offset — only for Style 2 */}
                      {printStyle === 2 && (
                        <div>
                          <Label className="text-xs">Top Offset (alignment)</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Input
                              type="number"
                              min="0"
                              max="50"
                              step="1"
                              value={topOffset}
                              onChange={(e) => setTopOffset(Math.max(0, parseFloat(e.target.value) || 0))}
                              className="w-16 h-8 text-sm"
                            />
                            <span className="text-xs text-gray-500">mm</span>
                            <div className="flex gap-1">
                              {[0, 5, 10, 15, 20].map((n) => (
                                <Button key={n} type="button" size="sm" variant={topOffset === n ? "default" : "outline"}
                                  className="h-7 px-2 text-[10px]" onClick={() => setTopOffset(n)}>
                                  {n}
                                </Button>
                              ))}
                            </div>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-1">
                            Adjust if labels print between stickers. Default: 15mm.
                          </p>
                        </div>
                      )}

                      <Button
                        type="button"
                        onClick={() => handlePrint(selectedVariant.barcode, varName, regPrice, salPrice, varColor, varSize, varMaterial)}
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
