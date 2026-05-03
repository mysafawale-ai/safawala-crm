/**
 * Zebra ZPL Service — Optimised for ZTC ZD230-203dpi ZPL
 * Label: 50mm × 25mm, 2-column (100mm total width)
 * Resolution: 203 dpi = 8 dots per mm
 */

export interface ZebraBarcodeItem {
  code: string
  productName: string
}

export interface ZebraPrintConfig {
  barcodes: ZebraBarcodeItem[]
  labelWidthMM?: number
  labelHeightMM?: number
  columns?: number
  printDensity?: number  // 0–30, default 20 (darker)
  printSpeed?: number    // 2–6 in/sec, default 2 (sharper)
}

const DPM = 8 // dots per mm at 203dpi
const d = (mm: number) => Math.round(mm * DPM)

function singleLabelZPL(item: ZebraBarcodeItem, wMM: number, hMM: number): string {
  const W = d(wMM)
  const H = d(hMM)
  const barcodeW = d(wMM - 6)       // barcode width in dots
  const barcodeH = d(13)             // 13mm tall barcode
  const barcodeX = d(3)              // 3mm from left
  const barcodeY = d(2)              // 2mm from top
  const codeY    = barcodeY + barcodeH + d(1)
  const nameY    = codeY + d(5)

  const name = item.productName.length > 18
    ? item.productName.substring(0, 16) + ".."
    : item.productName

  return `^XA
^PW${W}
^LL${H}
~SD25
^PR2,2,2
^BY5,3,${barcodeH}
^FO${barcodeX},${barcodeY}^BCN,${barcodeH},N,N,N^FD${item.code}^FS
^FO${barcodeX},${codeY}^A0N,40,40^FD${item.code}^FS
^FO${barcodeX},${nameY}^A0N,30,30^FD${name}^FS
^XZ`
}

function twoColumnLabelZPL(
  item1: ZebraBarcodeItem,
  item2: ZebraBarcodeItem | null,
  wMM: number,
  hMM: number
): string {
  const totalW   = d(wMM * 2)
  const H        = d(hMM)
  const halfW    = d(wMM)
  const barcodeW = d(wMM - 8)
  const barcodeH = d(12)
  const barcodeX1 = d(4)
  const barcodeX2 = halfW + d(4)
  const barcodeY  = d(1.5)
  const codeY     = barcodeY + barcodeH + d(1)
  const nameY     = codeY + d(5)

  const fmt = (s: string) => s.length > 16 ? s.substring(0, 14) + ".." : s

  let zpl = `^XA
^PW${totalW}
^LL${H}
~SD25
^PR2,2,2
^BY5,3,${barcodeH}
^FO${barcodeX1},${barcodeY}^BCN,${barcodeH},N,N,N^FD${item1.code}^FS
^FO${barcodeX1},${codeY}^A0N,40,40^FD${item1.code}^FS
^FO${barcodeX1},${nameY}^A0N,28,28^FD${fmt(item1.productName)}^FS`

  if (item2) {
    zpl += `
^FO${barcodeX2},${barcodeY}^BCN,${barcodeH},N,N,N^FD${item2.code}^FS
^FO${barcodeX2},${codeY}^A0N,40,40^FD${item2.code}^FS
^FO${barcodeX2},${nameY}^A0N,28,28^FD${fmt(item2.productName)}^FS`
  }

  zpl += `\n^XZ`
  return zpl
}

export function generateZPL(config: ZebraPrintConfig): string {
  const {
    barcodes,
    labelWidthMM  = 50,
    labelHeightMM = 25,
    columns       = 2,
  } = config

  if (barcodes.length === 0) return ""

  let out = ""
  if (columns === 2) {
    for (let i = 0; i < barcodes.length; i += 2) {
      out += twoColumnLabelZPL(
        barcodes[i],
        i + 1 < barcodes.length ? barcodes[i + 1] : null,
        labelWidthMM,
        labelHeightMM
      ) + "\n"
    }
  } else {
    for (const item of barcodes) {
      out += singleLabelZPL(item, labelWidthMM, labelHeightMM) + "\n"
    }
  }
  return out
}

export function downloadZPL(config: ZebraPrintConfig, filename = "barcodes.zpl"): void {
  const zpl = generateZPL(config)
  const blob = new Blob([zpl], { type: "text/plain" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function printZPLDirect(config: ZebraPrintConfig): Promise<boolean> {
  const zpl = generateZPL(config)
  if (typeof window !== "undefined" && (window as any).BrowserPrint) {
    try {
      const BP = (window as any).BrowserPrint
      return new Promise((resolve, reject) => {
        BP.getDefaultDevice("printer", (device: any) => {
          if (device) {
            device.send(zpl, () => resolve(true), reject)
          } else {
            reject(new Error("No Zebra printer found"))
          }
        }, reject)
      })
    } catch {
      downloadZPL(config)
      return false
    }
  }
  downloadZPL(config)
  return false
}

export async function copyZPLToClipboard(config: ZebraPrintConfig): Promise<void> {
  await navigator.clipboard.writeText(generateZPL(config))
}

// HTML fallback using inline SVG — sharp on any printer
export async function printThermalLabels(config: ZebraPrintConfig): Promise<void> {
  const { barcodes, labelWidthMM = 50, labelHeightMM = 25, columns = 2 } = config
  const JsBarcode = (await import("jsbarcode")).default

  const makeSVG = (code: string): string => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    JsBarcode(svg, code, {
      format: "CODE128",
      width: 3,
      height: 80,
      displayValue: false,
      margin: 0,
      background: "#FFFFFF",
      lineColor: "#000000",
    })
    return svg.outerHTML
  }

  const totalW = labelWidthMM * columns
  const bcW = labelWidthMM - 6
  const bcH = labelHeightMM - 12

  const labelHTML = (item: ZebraBarcodeItem) => {
    const svg = makeSVG(item.code)
    const name = item.productName.length > 20 ? item.productName.substring(0, 18) + ".." : item.productName
    return `
      <div style="width:${labelWidthMM}mm;height:${labelHeightMM}mm;display:flex;flex-direction:column;
                  align-items:center;justify-content:center;padding:1mm;box-sizing:border-box;
                  overflow:hidden;gap:0.4mm;">
        <div style="font-family:Arial Black,Arial,sans-serif;font-size:9pt;font-weight:900;
                    color:#000;text-align:center;line-height:1.1;">${name}</div>
        <div style="width:${bcW}mm;height:${bcH}mm;display:flex;align-items:center;
                    justify-content:center;overflow:hidden;">
          ${svg.replace(/width="[^"]*"/, `width="${bcW}mm"`).replace(/height="[^"]*"/, `height="${bcH}mm"`)}
        </div>
        <div style="font-family:'Courier New',monospace;font-size:7pt;font-weight:bold;color:#000;">
          ${item.code}
        </div>
      </div>`
  }

  let rows = ""
  for (let i = 0; i < barcodes.length; i += columns) {
    rows += `<div style="width:${totalW}mm;height:${labelHeightMM}mm;display:flex;
                          page-break-after:always;page-break-inside:avoid;overflow:hidden;">`
    for (let c = 0; c < columns; c++) {
      const item = barcodes[i + c]
      rows += item
        ? labelHTML(item)
        : `<div style="width:${labelWidthMM}mm;height:${labelHeightMM}mm;"></div>`
    }
    rows += `</div>`
  }

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Zebra Labels</title>
<style>
  @page { size: ${totalW}mm ${labelHeightMM}mm; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    width: ${totalW}mm;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
</style>
</head>
<body>${rows}</body>
</html>`

  const win = window.open("", "_blank")
  if (!win) throw new Error("Could not open print window. Check pop-up blocker.")
  win.document.write(html)
  win.document.close()
  win.onload = () => setTimeout(() => win.print(), 300)
}

export function getZebraSetupInstructions(): string {
  return `Zebra ZD230-203dpi Setup:
- Label Width: 100mm (2 × 50mm columns)
- Label Height: 25mm
- Print Speed: 2 in/sec
- Darkness: 20–25
- Media: Direct Thermal, Gap detection
- Browser print: Paper = 100mm × 25mm, Margins = None, Scale = 100%`
}
