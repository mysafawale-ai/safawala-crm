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
    ? `<img src="${logoSrc}" class="logo-img" style="max-width:22mm;max-height:4mm;object-fit:contain;" />`
    : `<span style="font-size:6pt;font-weight:950;color:#000;letter-spacing:0.5px;">SAFAWALA</span>`

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
  * { margin: 0; padding: 0; box-sizing: border-box; font-family: Arial, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html, body { width: 100mm; margin: 0; padding: 0; background: #fff; }
  .row { width: 100mm; height: 14.8mm; display: flex; flex-direction: row; page-break-after: always; page-break-inside: avoid; overflow: hidden; }
  .row:last-child { page-break-after: avoid; }
  .s1 { width: 34.9mm; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0.5mm 1mm; gap: 0.2mm; }
  .prow { font-size: 5pt; font-weight: bold; color: #000; text-align: center; white-space: nowrap; line-height: 1.2; }
  .mrp { position: relative; display: inline-block; color: #000; font-weight: 500; margin-right: 0.5mm; }
  .mrp::before, .mrp::after { content: ""; position: absolute; left: -5%; top: 50%; width: 110%; height: 1.2px; background: #000; }
  .mrp::before { transform: rotate(12deg); } .mrp::after { transform: rotate(-12deg); }
  .sale { font-size: 8.5pt; font-weight: bold; color: #000; margin-right: 0.5mm; }
  .save { font-size: 4pt; font-weight: bold; color: #000; }
  .bc { width: 32mm; height: 5.2mm; display: block; image-rendering: pixelated; image-rendering: crisp-edges; }
  .code { font-family: 'Courier New', monospace; font-size: 4.8pt; font-weight: bold; color: #000; text-align: center; letter-spacing: 0.2px; }
  .web { font-size: 4.2pt; font-weight: normal; color: #000; text-align: center; }
  .sep { width: 0.2mm; background: #000; align-self: stretch; margin: 1mm 0; }
  .s2 { width: 34.9mm; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0.5mm 1mm; gap: 0.3mm; }
  .logo { display: flex; align-items: center; justify-content: center; }
  .logo-img { filter: brightness(0); image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges; }
  .hr { width: 80%; height: 0.2mm; background: #000; }
  .pname { font-size: 5.5pt; font-weight: bold; color: #000; text-align: center; line-height: 1.1; max-width: 33mm; word-break: break-word; overflow: hidden; max-height: 3.5mm; }
  .feats { display: flex; flex-direction: column; gap: 0.3mm; align-items: flex-start; width: 100%; }
  .feat { display: flex; gap: 1mm; align-items: center; }
  .fk { font-size: 4pt; color: #000; text-transform: uppercase; min-width: 9mm; font-weight: normal; }
  .fv { font-size: 4.2pt; font-weight: bold; color: #000; }
  .s3 { width: 30mm; height: 100%; }
  @media print { * { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style></head><body>${labelsHTML}</body></html>`

  const win = window.open("", "_blank")
  if (!win) { toast.error("Please allow popups for printing"); return }
  win.document.write(html)
  win.document.close()
  setTimeout(() => { win.focus(); win.print() }, 200)
}

// ── Download Barcode as PNG at 600 DPI ─────────────────────────────────────────
export async function doDownloadStylePNG(
  barcode: string,
  label: string,
  style: 1 | 2,
  regularPrice?: number,
  salePrice?: number,
  color?: string,
  size?: string,
  material?: string,
) {
  const JsBarcode = (await import("jsbarcode")).default
  const canvas = document.createElement("canvas")

  if (style === 1) {
    // 50mm x 25mm label size (at 600 DPI: 1182px x 590px)
    canvas.width = 1182
    canvas.height = 590
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Fill background
    ctx.fillStyle = "#FFFFFF"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Border (thin light outline matching Style 1 preview)
    ctx.strokeStyle = "#DDDDDD"
    ctx.lineWidth = 8
    ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8)

    ctx.fillStyle = "#000000"
    ctx.textAlign = "center"

    // Product Title
    ctx.font = "bold 44px Arial"
    const words = label.split(" ")
    let line1 = ""
    let line2 = ""
    for (const word of words) {
      if (ctx.measureText(line1 + " " + word).width < 1080 && line2 === "") {
        line1 += (line1 ? " " : "") + word
      } else {
        line2 += (line2 ? " " : "") + word
      }
    }
    ctx.fillText(line1.substring(0, 24), canvas.width / 2, 80)
    if (line2) {
      ctx.fillText(line2.substring(0, 24), canvas.width / 2, 130)
    }

    // Meta Attributes
    const meta1 = [color, size].filter(Boolean).join(" | ")
    ctx.font = "36px Arial"
    ctx.fillStyle = "#000000"
    let metaY = line2 ? 180 : 130
    if (meta1) {
      ctx.fillText(meta1, canvas.width / 2, metaY)
      metaY += 50
    }
    if (material) {
      ctx.fillText(material, canvas.width / 2, metaY)
      metaY += 50
    }

    // Pricing Layout
    const pricingY = metaY + 20
    const savings = regularPrice && salePrice && regularPrice > salePrice ? regularPrice - salePrice : 0
    ctx.textAlign = "left"
    let textX = 80

    if (regularPrice || salePrice) {
      if (regularPrice) {
        ctx.font = "36px Arial"
        ctx.fillStyle = "#000000"
        ctx.fillText(`MRP: ₹${regularPrice}`, textX, pricingY)
        const textWidth = ctx.measureText(`MRP: ₹${regularPrice}`).width
        
        // Strikethrough line
        ctx.strokeStyle = "#000000"
        ctx.lineWidth = 4
        ctx.beginPath()
        ctx.moveTo(textX - 4, pricingY - 12)
        ctx.lineTo(textX + textWidth + 4, pricingY - 12)
        ctx.stroke()
        textX += textWidth + 30
      }
      if (salePrice) {
        ctx.font = "bold 48px Arial"
        ctx.fillStyle = "#000000"
        ctx.fillText(`₹${salePrice}`, textX, pricingY)
        const textWidth = ctx.measureText(`₹${salePrice}`).width
        textX += textWidth + 30
      }
      if (savings > 0) {
        ctx.font = "bold 32px Arial"
        ctx.fillStyle = "#000000"
        ctx.fillText(`Save ₹${savings}`, textX, pricingY - 4)
      }
    }

    // Draw Barcode image
    const barcodeCanvas = document.createElement("canvas")
    JsBarcode(barcodeCanvas, barcode, {
      format: "CODE128",
      width: 8,
      height: 160,
      displayValue: false,
      margin: 0,
      background: "#FFFFFF",
      lineColor: "#000000"
    })
    ctx.drawImage(barcodeCanvas, 80, 320, 1022, 130)

    // Code String
    ctx.textAlign = "center"
    ctx.font = "bold 40px Courier New"
    ctx.fillStyle = "#000000"
    ctx.fillText(barcode, canvas.width / 2, 490)

    // Website Link
    ctx.font = "32px Arial"
    ctx.fillText("www.safawala.com", canvas.width / 2, 550)

  } else {
    // Style 2: 100mm x 15mm label size (at 600 DPI: 2362px x 354px)
    canvas.width = 2362
    canvas.height = 354
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Fill background
    ctx.fillStyle = "#FFFFFF"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // --- SECTION 1: x = 0 to 826 (35% width) ---
    const sec1Width = 826
    ctx.textAlign = "center"
    const savings = regularPrice && salePrice && regularPrice > salePrice ? regularPrice - salePrice : 0
    const pricingY = 64

    // Pricing Row
    if (regularPrice || salePrice) {
      let textX = 50
      if (regularPrice) {
        ctx.font = "36px Arial"
        ctx.fillStyle = "#000000"
        ctx.fillText(`MRP: ₹${regularPrice}`, textX + 90, pricingY)
        const textWidth = ctx.measureText(`MRP: ₹${regularPrice}`).width
        
        ctx.strokeStyle = "#000000"
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(textX + 90 - textWidth/2 - 4, pricingY - 12)
        ctx.lineTo(textX + 90 + textWidth/2 + 4, pricingY - 12)
        ctx.stroke()
        textX += textWidth + 30
      }
      if (salePrice) {
        ctx.font = "bold 48px Arial"
        ctx.fillStyle = "#000000"
        ctx.fillText(`₹${salePrice}`, textX + 90, pricingY)
        const textWidth = ctx.measureText(`₹${salePrice}`).width
        textX += textWidth + 30
      }
      if (savings > 0) {
        ctx.font = "bold 30px Arial"
        ctx.fillStyle = "#000000"
        ctx.fillText(`Save ₹${savings}`, textX + 90, pricingY - 4)
      }
    }

    // Barcode rendering
    const barcodeCanvas = document.createElement("canvas")
    JsBarcode(barcodeCanvas, barcode, {
      format: "CODE128",
      width: 8,
      height: 160,
      displayValue: false,
      margin: 0,
      background: "#FFFFFF",
      lineColor: "#000000"
    })
    ctx.drawImage(barcodeCanvas, 40, 96, 746, 120)

    // Code
    ctx.font = "bold 36px Courier New"
    ctx.fillStyle = "#000000"
    ctx.fillText(barcode, sec1Width / 2, 260)

    // Web url
    ctx.font = "30px Arial"
    ctx.fillText("www.safawala.com", sec1Width / 2, 310)

    // --- DIVIDER: x = 826 to 830 ---
    ctx.strokeStyle = "#000000"
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(828, 20)
    ctx.lineTo(828, 334)
    ctx.stroke()

    // --- SECTION 2: x = 830 to 1654 (35% width) ---
    const sec2Width = 824
    const sec2Start = 830
    const sec2Center = sec2Start + (sec2Width / 2)

    // Logo image rendering with high resolution and smooth anti-aliased filter
    let logoDrawn = false
    try {
      const logoImg = new Image()
      logoImg.crossOrigin = "anonymous"
      await new Promise<void>((resolve) => {
        logoImg.onload = () => {
          const maxLogoW = 600
          const maxLogoH = 110
          const scale = Math.min(maxLogoW / logoImg.naturalWidth, maxLogoH / logoImg.naturalHeight)
          const w = logoImg.naturalWidth * scale
          const h = logoImg.naturalHeight * scale
          // Draw at Y = 24
          ctx.drawImage(logoImg, sec2Center - (w / 2), 24, w, h)
 
          // Colorize logo pixels to solid black with smooth anti-aliasing
          const imgData = ctx.getImageData(sec2Center - (w / 2), 24, w, h)
          for (let k = 0; k < imgData.data.length; k += 4) {
            const r = imgData.data[k]
            const g = imgData.data[k+1]
            const b = imgData.data[k+2]
            const a = imgData.data[k+3]
            const brightness = 0.299 * r + 0.587 * g + 0.114 * b
            
            if (brightness < 240) {
              const factor = (255 - brightness) / 255
              imgData.data[k] = 0
              imgData.data[k+1] = 0
              imgData.data[k+2] = 0
              imgData.data[k+3] = Math.round(a * factor)
            } else {
              imgData.data[k] = 255
              imgData.data[k+1] = 255
              imgData.data[k+2] = 255
              imgData.data[k+3] = 0 // Transparent
            }
          }
          ctx.putImageData(imgData, sec2Center - (w / 2), 24)
          logoDrawn = true
          resolve()
        }
        logoImg.onerror = () => resolve()
        logoImg.src = "/safawalalogo.png"
      })
    } catch { /* ignored */ }
 
    if (!logoDrawn) {
      ctx.font = "bold 48px Arial"
      ctx.fillStyle = "#000000"
      ctx.fillText("SAFAWALA", sec2Center, 70)
    }
 
    // Horizontal divider line - shifted below high-res logo
    ctx.strokeStyle = "#000000"
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(sec2Start + 80, 150)
    ctx.lineTo(sec2Start + sec2Width - 80, 150)
    ctx.stroke()
 
    // Product Title - positioned cleanly
    ctx.font = "bold 40px Arial"
    ctx.fillStyle = "#000000"
    ctx.textAlign = "center"
    ctx.fillText(label.substring(0, 30), sec2Center, 196)
 
    // Features Details (left aligned) - properly spaced
    ctx.font = "32px Arial"
    ctx.textAlign = "left"
    let featY = 244
    if (material) {
      ctx.fillText(`MATERIAL: ${material}`, sec2Start + 60, featY)
      featY += 40
    }
    if (size) {
      ctx.fillText(`SIZE: ${size}`, sec2Start + 60, featY)
      featY += 40
    }
    if (color) {
      ctx.fillText(`COLOUR: ${color}`, sec2Start + 30, featY)
      featY += 22
    }

    // --- SECTION 3: x = 827 to 1181 (30% width) blank ---
    // Blank tag tail is left unprinted.
  }

  // Trigger download flow
  const link = document.createElement("a")
  link.download = `barcode-${barcode}-${style === 1 ? "style1" : "style2"}.png`
  link.href = canvas.toDataURL("image/png")
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
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
  const [darkness, setDarkness] = useState(15)   // default to sharp 15
  const [speed, setSpeed] = useState(2)         // default to sharpest 2 in/sec
  const [zebraDevice, setZebraDevice] = useState<any | null>(null)
  const [zebraDevices, setZebraDevices] = useState<any[]>([])
  const [zebraStatus, setZebraStatus] = useState<"loading" | "connected" | "disconnected">("loading")
  const [showSetup, setShowSetup] = useState(false)

  const checkZebra = async () => {
    setZebraStatus("loading")
    try {
      const { getLocalDefaultPrinter, getLocalAvailablePrinters } = await import("@/lib/zebra-zpl-service")
      const dev = await getLocalDefaultPrinter()
      const list = await getLocalAvailablePrinters()
      
      setZebraDevices(list)
      if (dev) {
        setZebraDevice(dev)
        setZebraStatus("connected")
      } else if (list.length > 0) {
        setZebraDevice(list[0])
        setZebraStatus("connected")
      } else {
        setZebraDevice(null)
        setZebraStatus("disconnected")
      }
    } catch {
      setZebraDevice(null)
      setZebraDevices([])
      setZebraStatus("disconnected")
    }
  }

  useEffect(() => {
    if (open && product?.id) {
      loadVariants()
      setSelectedVariantId(null)
      setQuantity(1)
      setActiveTab("main")
      checkZebra()
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

  const handleDownloadPNG = async (
    barcode: string | undefined,
    label: string,
    regularPrice?: number,
    salePrice?: number,
    color?: string,
    size?: string,
    material?: string,
  ) => {
    if (!barcode) { toast.error(`No barcode for ${label}`); return }
    setPrinting(true)
    try {
      await doDownloadStylePNG(barcode, label, printStyle, regularPrice, salePrice, color, size, material)
      toast.success("Downloaded barcode PNG successfully")
    } catch (e) {
      console.error(e)
      toast.error("Failed to download barcode image")
    } finally {
      setPrinting(false)
    }
  }

  const handleZPLPrint = async (
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
      const { printZPLDirect } = await import("@/lib/zebra-zpl-service")
      const items = Array.from({ length: quantity }).map(() => ({
        code: barcode,
        productName: label,
        price: salePrice,
        regular_price: regularPrice,
        color,
        size,
        material
      }))

      const ok = await printZPLDirect({
        barcodes: items,
        style: printStyle,
        topOffset: printStyle === 2 ? topOffset : 0,
        printDensity: darkness,
        printSpeed: speed
      }, zebraDevice)

      if (ok) {
        toast.success(`Printed ${quantity} labels directly to ${zebraDevice?.name || "Zebra printer"}`)
      } else {
        toast.warning("Direct print was not possible. ZPL file downloaded instead.")
      }
    } catch (err) {
      console.error(err)
      toast.error("ZPL printing failed")
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

                  {/* Print Quality Settings */}
                  <div className="grid grid-cols-2 gap-2 border rounded-lg p-2.5 bg-gray-50/50">
                    <div>
                      <Label className="text-[10px] font-semibold text-gray-600 block mb-1">Print Darkness (Density)</Label>
                      <select
                        value={darkness}
                        onChange={(e) => setDarkness(parseInt(e.target.value))}
                        className="text-xs p-1.5 border rounded bg-white w-full cursor-pointer focus:outline-none focus:ring-1 focus:ring-green-500 font-medium"
                      >
                        <option value="10">10 (Light - sharper)</option>
                        <option value="15">15 (Medium - recommended)</option>
                        <option value="20">20 (Dark)</option>
                        <option value="25">25 (Very Dark - causes bleed)</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-[10px] font-semibold text-gray-600 block mb-1">Print Speed</Label>
                      <select
                        value={speed}
                        onChange={(e) => setSpeed(parseInt(e.target.value))}
                        className="text-xs p-1.5 border rounded bg-white w-full cursor-pointer focus:outline-none focus:ring-1 focus:ring-green-500 font-medium"
                      >
                        <option value="2">2 in/s (Sharpest)</option>
                        <option value="3">3 in/s (Medium)</option>
                        <option value="4">4 in/s (Fast)</option>
                      </select>
                    </div>
                  </div>

                  {/* Zebra Connection Indicator */}
                  <div className="border rounded-lg p-3 bg-gray-50 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          zebraStatus === "connected" ? "bg-green-500 animate-pulse" :
                          zebraStatus === "loading" ? "bg-blue-500 animate-pulse" : "bg-amber-500"
                        }`} />
                        <span className="text-xs font-semibold">
                          Zebra Printer: {zebraStatus === "connected" ? zebraDevice?.name || "Connected" : 
                                         zebraStatus === "loading" ? "Scanning..." : "Disconnected"}
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={checkZebra}>
                        <RefreshCw className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {zebraStatus === "connected" && zebraDevices.length > 0 && (
                      <div className="flex flex-col gap-1 mt-1 border-t pt-2 border-gray-200">
                        <Label className="text-[10px] text-gray-500 font-semibold">Select Printer Device:</Label>
                        <select
                          value={zebraDevice?.uid || ""}
                          onChange={(e) => {
                            const selected = zebraDevices.find(d => d.uid === e.target.value)
                            if (selected) setZebraDevice(selected)
                          }}
                          className="text-xs p-1.5 border rounded bg-white w-full cursor-pointer focus:outline-none focus:ring-1 focus:ring-green-500 font-medium text-gray-800"
                        >
                          {zebraDevices.map((d) => (
                            <option key={d.uid} value={d.uid}>
                              {d.name} ({d.connection})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {zebraStatus === "disconnected" && (
                      <div className="text-[11px] text-gray-500">
                        Zebra Browser Print service not detected. You can use Browser HTML print or{" "}
                        <button onClick={() => setShowSetup(!showSetup)} className="text-green-700 underline font-medium">
                          view setup steps
                        </button>.
                      </div>
                    )}

                    {showSetup && (
                      <div className="text-[10px] text-amber-900 bg-amber-50 border border-amber-200 p-2.5 rounded mt-1 space-y-1">
                        <p className="font-bold">Setup Instructions:</p>
                        <p>1. Open and start the <b>Zebra Browser Print</b> desktop app on this PC.</p>
                        <p>2. Open <a href="https://localhost:9101/available" target="_blank" rel="noreferrer" className="text-green-700 underline font-semibold">https://localhost:9101/available</a> in a new tab.</p>
                        <p>3. Click <b>Advanced</b> -&gt; <b>Proceed to localhost</b> to accept the HTTPS certificate.</p>
                        <p>4. Refresh this popup to connect.</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {zebraStatus === "connected" ? (
                      <>
                        <Button
                          onClick={() => handleZPLPrint(product.barcode, product.name, product.regular_price, product.price, product.color, product.size, product.material)}
                          disabled={printing}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold"
                        >
                          <Printer className="w-4 h-4 mr-2" />
                          {printing ? "Printing..." : "Print ZPL Direct"}
                        </Button>
                        <Button
                          onClick={() => handlePrint(product.barcode, product.name, product.regular_price, product.price, product.color, product.size, product.material)}
                          disabled={printing}
                          variant="outline"
                          className="border-green-600 text-green-700 hover:bg-green-50"
                        >
                          Browser HTML Print
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          onClick={() => handlePrint(product.barcode, product.name, product.regular_price, product.price, product.color, product.size, product.material)}
                          disabled={printing}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold"
                        >
                          <Printer className="w-4 h-4 mr-2" />
                          {printing ? "Printing..." : "Print Labels (HTML)"}
                        </Button>
                        <Button
                          type="button"
                          onClick={() => {
                            const { downloadZPL } = require("@/lib/zebra-zpl-service")
                            downloadZPL({
                              barcodes: [{
                                code: product.barcode || "",
                                productName: product.name,
                                price: product.price,
                                regular_price: product.regular_price,
                                color: product.color,
                                size: product.size,
                                material: product.material
                              }],
                              style: printStyle,
                              topOffset: printStyle === 2 ? topOffset : 0
                            })
                          }}
                          variant="outline"
                          className="border-green-600 text-green-700 hover:bg-green-50"
                        >
                          Download ZPL
                        </Button>
                      </>
                    )}
                    <Button
                      type="button"
                      onClick={() => handleDownloadPNG(product.barcode, product.name, product.regular_price, product.price, product.color, product.size, product.material)}
                      variant="outline"
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Download PNG
                    </Button>
                  </div>
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

                      {/* Print Quality Settings */}
                      <div className="grid grid-cols-2 gap-2 border rounded-lg p-2.5 bg-gray-50/50">
                        <div>
                          <Label className="text-[10px] font-semibold text-gray-600 block mb-1">Print Darkness (Density)</Label>
                          <select
                            value={darkness}
                            onChange={(e) => setDarkness(parseInt(e.target.value))}
                            className="text-xs p-1.5 border rounded bg-white w-full cursor-pointer focus:outline-none focus:ring-1 focus:ring-green-500 font-medium"
                          >
                            <option value="10">10 (Light - sharper)</option>
                            <option value="15">15 (Medium - recommended)</option>
                            <option value="20">20 (Dark)</option>
                            <option value="25">25 (Very Dark - causes bleed)</option>
                          </select>
                        </div>
                        <div>
                          <Label className="text-[10px] font-semibold text-gray-600 block mb-1">Print Speed</Label>
                          <select
                            value={speed}
                            onChange={(e) => setSpeed(parseInt(e.target.value))}
                            className="text-xs p-1.5 border rounded bg-white w-full cursor-pointer focus:outline-none focus:ring-1 focus:ring-green-500 font-medium"
                          >
                            <option value="2">2 in/s (Sharpest)</option>
                            <option value="3">3 in/s (Medium)</option>
                            <option value="4">4 in/s (Fast)</option>
                          </select>
                        </div>
                      </div>

                      {/* Zebra Connection Indicator */}
                      <div className="border rounded-lg p-3 bg-gray-50 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${
                              zebraStatus === "connected" ? "bg-green-500 animate-pulse" :
                              zebraStatus === "loading" ? "bg-blue-500 animate-pulse" : "bg-amber-500"
                            }`} />
                            <span className="text-xs font-semibold">
                              Zebra Printer: {zebraStatus === "connected" ? zebraDevice?.name || "Connected" : 
                                             zebraStatus === "loading" ? "Scanning..." : "Disconnected"}
                            </span>
                          </div>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={checkZebra}>
                            <RefreshCw className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        {zebraStatus === "connected" && zebraDevices.length > 0 && (
                          <div className="flex flex-col gap-1 mt-1 border-t pt-2 border-gray-200">
                            <Label className="text-[10px] text-gray-500 font-semibold">Select Printer Device:</Label>
                            <select
                              value={zebraDevice?.uid || ""}
                              onChange={(e) => {
                                const selected = zebraDevices.find(d => d.uid === e.target.value)
                                if (selected) setZebraDevice(selected)
                              }}
                              className="text-xs p-1.5 border rounded bg-white w-full cursor-pointer focus:outline-none focus:ring-1 focus:ring-green-500 font-medium text-gray-800"
                            >
                              {zebraDevices.map((d) => (
                                <option key={d.uid} value={d.uid}>
                                  {d.name} ({d.connection})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {zebraStatus === "disconnected" && (
                          <div className="text-[11px] text-gray-500">
                            Zebra Browser Print service not detected. You can use Browser HTML print or{" "}
                            <button onClick={() => setShowSetup(!showSetup)} className="text-green-700 underline font-medium">
                              view setup steps
                            </button>.
                          </div>
                        )}

                        {showSetup && (
                          <div className="text-[10px] text-amber-900 bg-amber-50 border border-amber-200 p-2.5 rounded mt-1 space-y-1">
                            <p className="font-bold">Setup Instructions:</p>
                            <p>1. Open and start the <b>Zebra Browser Print</b> desktop app on this PC.</p>
                            <p>2. Open <a href="https://localhost:9101/available" target="_blank" rel="noreferrer" className="text-green-700 underline font-semibold">https://localhost:9101/available</a> in a new tab.</p>
                            <p>3. Click <b>Advanced</b> -&gt; <b>Proceed to localhost</b> to accept the HTTPS certificate.</p>
                            <p>4. Refresh this popup to connect.</p>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {zebraStatus === "connected" ? (
                          <>
                            <Button
                              type="button"
                              onClick={() => handleZPLPrint(selectedVariant.barcode, varName, regPrice, salPrice, varColor, varSize, varMaterial)}
                              disabled={printing || !selectedVariant.barcode}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold"
                            >
                              <Printer className="w-4 h-4 mr-2" />
                              {printing ? "Printing..." : "Print ZPL Direct"}
                            </Button>
                            <Button
                              type="button"
                              onClick={() => handlePrint(selectedVariant.barcode, varName, regPrice, salPrice, varColor, varSize, varMaterial)}
                              disabled={printing || !selectedVariant.barcode}
                              variant="outline"
                              className="border-green-600 text-green-700 hover:bg-green-50"
                            >
                              Browser HTML Print
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              type="button"
                              onClick={() => handlePrint(selectedVariant.barcode, varName, regPrice, salPrice, varColor, varSize, varMaterial)}
                              disabled={printing || !selectedVariant.barcode}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold"
                            >
                              <Printer className="w-4 h-4 mr-2" />
                              {printing ? "Printing..." : "Print Labels (HTML)"}
                            </Button>
                            <Button
                              type="button"
                              onClick={() => {
                                const { downloadZPL } = require("@/lib/zebra-zpl-service")
                                downloadZPL({
                                  barcodes: [{
                                    code: selectedVariant.barcode || "",
                                    productName: varName,
                                    price: salPrice,
                                    regular_price: regPrice,
                                    color: varColor,
                                    size: varSize,
                                    material: varMaterial
                                  }],
                                  style: printStyle,
                                  topOffset: printStyle === 2 ? topOffset : 0
                                })
                              }}
                              variant="outline"
                              className="border-green-600 text-green-700 hover:bg-green-50"
                              disabled={!selectedVariant.barcode}
                            >
                              Download ZPL
                            </Button>
                          </>
                        )}
                        <Button
                          type="button"
                          onClick={() => handleDownloadPNG(selectedVariant.barcode, varName, regPrice, salPrice, varColor, varSize, varMaterial)}
                          variant="outline"
                          className="border-gray-300 text-gray-700 hover:bg-gray-50"
                          disabled={!selectedVariant.barcode}
                        >
                          Download PNG
                        </Button>
                      </div>
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
