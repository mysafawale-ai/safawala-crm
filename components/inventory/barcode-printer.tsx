"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Printer } from "lucide-react"
import { toast } from "sonner"

interface BarcodePrinterProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productCode: string
  productName: string
  productPrice?: number
  productMaterial?: string
  productSize?: string
  productColor?: string
}

export function BarcodePrinter({
  open,
  onOpenChange,
  productCode,
  productName,
  productPrice,
  productMaterial,
  productSize,
  productColor,
}: BarcodePrinterProps) {
  const [quantity, setQuantity] = useState(10)
  const [isPrinting, setIsPrinting] = useState(false)
  const [style, setStyle] = useState<1 | 2>(1)
  const [topOffset, setTopOffset] = useState(0) // mm offset for first label alignment

  const handlePrint = async () => {
    if (quantity < 1) {
      toast.error("Enter at least 1 label")
      return
    }
    setIsPrinting(true)
    try {
      if (style === 1) {
        await printStyle1()
      } else {
        await printStyle2()
      }
      toast.success(`Printing ${quantity} labels`)
      onOpenChange(false)
    } catch (error) {
      console.error("Print error:", error)
      toast.error("Print failed")
    } finally {
      setIsPrinting(false)
    }
  }

  const makeBarcodeDataURL = async (): Promise<string> => {
    const JsBarcode = (await import("jsbarcode")).default
    const canvas = document.createElement("canvas")
    JsBarcode(canvas, productCode, {
      format: "CODE128",
      width: 3,
      height: 80,
      displayValue: false,
      margin: 4,
      background: "#FFFFFF",
      lineColor: "#000000",
    })
    return canvas.toDataURL("image/png")
  }

  const printStyle1 = async () => {
    const barcodeImg = await makeBarcodeDataURL()
    const rows = Math.ceil(quantity / 2)
    let labelsHTML = ""

    for (let row = 0; row < rows; row++) {
      labelsHTML += `<div class="row">`
      for (let col = 0; col < 2; col++) {
        const idx = row * 2 + col
        if (idx < quantity) {
          labelsHTML += `
            <div class="label">
              <div class="name">${productName}</div>
              <img src="${barcodeImg}" class="barcode" />
              <div class="code">${productCode}</div>
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
<title>Labels</title>
<style>
  @page { size: 100mm 25mm; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; width: 100mm; background: #fff;
         -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .row { width: 100mm; height: 25mm; display: flex;
         page-break-after: always; page-break-inside: avoid; }
  .row:last-child { page-break-after: avoid; }
  .label { width: 50mm; height: 25mm; display: flex; flex-direction: column;
           justify-content: center; align-items: center; padding: 1.5mm; gap: 0.5mm; }
  .label.empty { visibility: hidden; }
  .name { font-size: 8pt; font-weight: bold; color: #000; text-align: center;
          max-width: 48mm; line-height: 1.2; word-break: break-word; }
  .barcode { width: 44mm; height: 11mm; display: block;
             image-rendering: pixelated; image-rendering: crisp-edges; }
  .code { font-family: 'Courier New', monospace; font-size: 7.5pt; font-weight: bold;
          color: #000; text-align: center; letter-spacing: 0.5px; }
</style>
</head>
<body>${labelsHTML}</body>
</html>`

    openPrint(printHTML)
  }

  const printStyle2 = async () => {
    const barcodeImg = await makeBarcodeDataURL()

    // Resolve logo to base64 so it works in the print window
    let logoSrc = ""
    try {
      const res = await fetch("/safawalalogo.png")
      const blob = await res.blob()
      logoSrc = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(blob)
      })
    } catch {
      // logo not available — will show text fallback
    }

    const logoHTML = logoSrc
      ? `<img src="${logoSrc}" class="logo-img" style="max-width:22mm;max-height:4mm;object-fit:contain;display:block;" />`
      : `<div style="font-size:6pt;font-weight:950;color:#000;letter-spacing:0.5px;">SAFAWALA</div>`

    const features = [
      productMaterial ? `<div class="feat-row"><span class="feat-key">Material</span><span class="feat-val">${productMaterial}</span></div>` : "",
      productSize     ? `<div class="feat-row"><span class="feat-key">Size</span><span class="feat-val">${productSize}</span></div>` : "",
      productColor    ? `<div class="feat-row"><span class="feat-key">Colour</span><span class="feat-val">${productColor}</span></div>` : "",
    ].join("")

    let labelsHTML = ""
    for (let i = 0; i < quantity; i++) {
      const isFirst = i === 0
      const labelStyle = isFirst && topOffset > 0 ? `style="padding-top: ${topOffset}mm;"` : ""
      labelsHTML += `
        <div class="label" ${labelStyle}>
          <!-- Section 1: 35mm — Pricing + barcode + code + website -->
          <div class="sec-pricing">
            ${productPrice ? `<div class="price"><span class="currency">₹</span>${productPrice}</div>` : ""}
            <img src="${barcodeImg}" class="barcode-img" />
            <div class="code">${productCode}</div>
            <div class="website">www.safawala.com</div>
          </div>

          <div class="divider"></div>

          <!-- Section 2: 35mm — Logo + product name + features -->
          <div class="sec-info">
            <div class="logo-wrap">${logoHTML}</div>
            <div class="hr"></div>
            <div class="prod-name">${productName}</div>
            ${features ? `<div class="features">${features}</div>` : ""}
          </div>

          <!-- Section 3: 30mm — blank -->
          <div class="sec-blank"></div>
        </div>`
    }

    const printHTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Labels</title>
<style>
  @page { size: 100mm 18mm; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; font-family: Arial, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { width: 100mm; margin: 0; padding: 0; background: #fff; }

  .label {
    width: 100mm; height: 14.8mm;
    display: flex; flex-direction: row;
    page-break-after: always; page-break-inside: avoid;
    overflow: hidden;
    margin-bottom: 3mm;
  }
  .label:last-child { page-break-after: avoid; margin-bottom: 0; }

  /* Section 1 — 35mm */
  .sec-pricing {
    width: 35mm; height: 100%;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 0.5mm 1mm; gap: 0.2mm;
  }
  .price { font-size: 8.5pt; font-weight: 950; color: #000; line-height: 1; }
  .currency { font-size: 5pt; vertical-align: super; font-weight: bold; }
  .barcode-img { width: 32mm; height: 5.2mm; display: block;
                 image-rendering: pixelated; image-rendering: crisp-edges; }
  .code { font-family: 'Courier New', monospace; font-size: 4.8pt; font-weight: 900; color: #000;
          text-align: center; letter-spacing: 0.2px; }
  .website { font-size: 4.2pt; color: #000; text-align: center; font-weight: 900; }

  /* Divider */
  .divider { width: 0.2mm; background: #000; align-self: stretch; margin: 1mm 0; }

  /* Section 2 — 35mm */
  .sec-info {
    width: 35mm; height: 100%;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 0.5mm 1mm; gap: 0.3mm;
  }
  .logo-wrap { display: flex; align-items: center; justify-content: center; height: 4mm; }
  .logo-img { filter: brightness(0); image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges; }
  .hr { width: 80%; height: 0.2mm; background: #000; }
  .prod-name { font-size: 5.5pt; font-weight: 955; color: #000;
               text-align: center; line-height: 1.1; max-width: 33mm; word-break: break-word;
               overflow: hidden; max-height: 3.5mm; }
  .features { display: flex; flex-direction: column; gap: 0.3mm; align-items: flex-start; width: 100%; }
  .feat-row { display: flex; gap: 1mm; align-items: center; }
  .feat-key { font-size: 4pt; color: #000; text-transform: uppercase; min-width: 9mm; font-weight: 800; }
  .feat-val { font-size: 4.2pt; font-weight: 950; color: #000; }

  /* Section 3 — 30mm blank */
  .sec-blank { width: 30mm; height: 100%; }
</style>
</head>
<body>${labelsHTML}</body>
</html>`

    openPrint(printHTML)
  }

  const openPrint = (html: string) => {
    const win = window.open("", "_blank")
    if (!win) {
      toast.error("Please allow popups for printing")
      return
    }
    win.document.write(html)
    win.document.close()
    setTimeout(() => {
      win.focus()
      win.print()
    }, 500)
  }

  const rows = Math.ceil(quantity / 2)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <Printer className="w-4 h-4" />
            Print Labels
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Style selector */}
          <div>
            <Label className="text-xs mb-1 block">Label Style</Label>
            <div className="flex gap-2">
              <button
                onClick={() => setStyle(1)}
                className={`flex-1 rounded border-2 p-2 text-left transition-all ${
                  style === 1 ? "border-green-600 bg-green-50" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="text-xs font-bold mb-1">Style 1 — Simple</div>
                <div className="flex gap-1">
                  {[0, 1].map((i) => (
                    <div key={i} className="flex-1 border border-gray-300 p-1 bg-white flex flex-col items-center gap-0.5">
                      <div className="text-[5px] font-bold truncate w-full text-center text-gray-700">{productName}</div>
                      <div className="bg-black h-2.5 w-full" />
                      <div className="text-[5px] font-mono text-gray-600 truncate w-full text-center">{productCode}</div>
                    </div>
                  ))}
                </div>
                <div className="text-[9px] text-gray-400 text-center mt-1">50mm × 2 per row</div>
              </button>

              <button
                onClick={() => setStyle(2)}
                className={`flex-1 rounded border-2 p-2 text-left transition-all ${
                  style === 2 ? "border-green-600 bg-green-50" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="text-xs font-bold mb-1">Style 2 — Branded</div>
                <div className="border border-gray-300 bg-white flex h-10 overflow-hidden">
                  {/* mini sec 1 */}
                  <div className="flex-1 border-r border-gray-200 flex flex-col items-center justify-center gap-0.5 px-0.5">
                    {productPrice && <div className="text-[6px] font-black">₹{productPrice}</div>}
                    <div className="bg-black h-2 w-full" />
                    <div className="text-[4px] font-mono truncate w-full text-center text-gray-500">{productCode}</div>
                    <div className="text-[4px] text-gray-400">safawala.com</div>
                  </div>
                  {/* mini sec 2 */}
                  <div className="flex-1 flex flex-col items-center justify-center gap-0.5 px-0.5">
                    <div className="text-[5px] font-black text-yellow-600">SAFAWALA</div>
                    <div className="text-[4.5px] font-bold text-center leading-tight text-gray-700 truncate w-full">{productName}</div>
                    {productMaterial && <div className="text-[4px] text-gray-400">Mat: {productMaterial}</div>}
                  </div>
                  {/* mini sec 3 blank */}
                  <div className="w-5 bg-gray-50" />
                </div>
                <div className="text-[9px] text-gray-400 text-center mt-1">100mm × 1 per row</div>
              </button>
            </div>
          </div>

          {/* Quantity */}
          <div>
            <Label className="text-xs mb-1 block">Quantity</Label>
            <div className="flex gap-1 flex-wrap">
              <Input
                type="number"
                min="1"
                max="500"
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
            <p className="text-xs text-gray-500 mt-1">
              {style === 1
                ? `${quantity} labels = ${rows} rows (2 per row) · 100mm × 25mm`
                : `${quantity} labels = ${quantity} rows (1 per row) · 100mm × 18mm`}
            </p>
          </div>

          {/* Top Offset — only for Style 2 */}
          {style === 2 && (
            <div>
              <Label className="text-xs mb-1 block">Top Offset (alignment)</Label>
              <div className="flex items-center gap-2">
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
                    <Button
                      key={n}
                      size="sm"
                      variant={topOffset === n ? "default" : "outline"}
                      className="h-7 px-2 text-[10px]"
                      onClick={() => setTopOffset(n)}
                    >
                      {n}
                    </Button>
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                Adjust if labels print between stickers. Start with 15mm.
              </p>
            </div>
          )}

          <Button
            onClick={handlePrint}
            disabled={isPrinting}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            <Printer className="w-4 h-4 mr-2" />
            {isPrinting ? "Printing..." : `Print ${quantity} Labels`}
          </Button>

          <p className="text-[10px] text-gray-400 text-center">
            {style === 1
              ? "Paper: 100mm × 25mm · Margins: None · Scale: 100%"
              : "Paper: 100mm × 18mm · Margins: None · Scale: 100%"}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
