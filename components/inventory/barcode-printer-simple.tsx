"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Printer, Plus, Trash2, Download, FileCode, Info } from "lucide-react"
import { toast } from "sonner"
import { printBarcodes } from "@/lib/barcode-print-service"
import { 
  printThermalLabels, 
  downloadZPL, 
  copyZPLToClipboard,
  getZebraSetupInstructions 
} from "@/lib/zebra-zpl-service"

interface BarcodeItem {
  id: string
  code: string
  productName: string
}

interface BarcodePrinterProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productCode: string
  productName: string
}

interface PrintSettings {
  paperSize: "zebra-25x50" | "thermal-4x6" | "a4" | "a5" | "a6" | "custom"
  columns: number
  marginTop: number
  marginLeft: number
  marginRight: number
  barcodeScale: number // 1 = 50×25mm, 1.5 = 75×37.5mm, 2 = 100×50mm
  barcodeRotation: number // 0° (normal) or 90° (rotated)
}

export function SimpleBarcodePrinter({
  open,
  onOpenChange,
  productCode,
  productName,
}: BarcodePrinterProps) {
  const [barcodes, setBarcodes] = useState<BarcodeItem[]>([
    {
      id: "1",
      code: productCode,
      productName: productName,
    },
  ])

  const [settings, setSettings] = useState<PrintSettings>({
    paperSize: "zebra-25x50",
    columns: 2,
    marginTop: 0,
    marginLeft: 0,
    marginRight: 0,
    barcodeScale: 1,
    barcodeRotation: 0,
  })

  // Paper size presets
  const PAPER_SIZES = {
    "zebra-25x50": { name: "🖨️ Zebra ZD230 - 25×50mm (2-col)", width: 100, height: 25 },
    "thermal-4x6": { name: "Thermal 4×6 inch", width: 101.6, height: 152.4 },
    a4: { name: "A4 (210×297mm)", width: 210, height: 297 },
    a5: { name: "A5 (148×210mm)", width: 148, height: 210 },
    a6: { name: "A6 (105×148mm)", width: 105, height: 148 },
    custom: { name: "Custom", width: 100, height: 150 },
  }

  const paperSize = PAPER_SIZES[settings.paperSize]

  // Barcode dimensions - FIXED
  const BARCODE_WIDTH = 50 // mm - FIXED
  const BARCODE_HEIGHT = 25 // mm - FIXED

  // Calculate layout
  const calculateLayout = () => {
    const availableWidth = paperSize.width - settings.marginLeft - settings.marginRight
    const availableHeight = paperSize.height - settings.marginTop - 10 // 10mm bottom margin

    // Apply scale to barcode dimensions
    const scaledBarcodeWidth = BARCODE_WIDTH * settings.barcodeScale
    const scaledBarcodeHeight = BARCODE_HEIGHT * settings.barcodeScale

    const cols = settings.columns
    const barcodeWidthWithGap = scaledBarcodeWidth + 2 // 2mm gap
    const rowHeight = scaledBarcodeHeight + 2 // 2mm gap

    const rows = Math.floor(availableHeight / rowHeight)
    const barcodesPerPage = cols * rows
    const totalPages = Math.ceil(barcodes.length / barcodesPerPage)

    return {
      availableWidth,
      availableHeight,
      cols,
      rows,
      barcodesPerPage,
      totalPages,
      barcodeWidthWithGap,
      rowHeight,
      scaledBarcodeWidth,
      scaledBarcodeHeight,
    }
  }

  const layout = calculateLayout()

  const addBarcode = () => {
    setBarcodes([
      ...barcodes,
      {
        id: Date.now().toString(),
        code: "",
        productName: "",
      },
    ])
  }

  const updateBarcode = (id: string, field: keyof BarcodeItem, value: string) => {
    setBarcodes(
      barcodes.map((b) => (b.id === id ? { ...b, [field]: value } : b))
    )
  }

  const removeBarcode = (id: string) => {
    setBarcodes(barcodes.filter((b) => b.id !== id))
  }

  const updateSetting = (field: keyof PrintSettings, value: any) => {
    setSettings({ ...settings, [field]: value })
  }

  // Check if using Zebra printer preset
  const isZebraPrinter = settings.paperSize === "zebra-25x50"

  const handlePrint = async () => {
    if (barcodes.length === 0) {
      toast.error("Add at least one barcode")
      return
    }

    try {
      // Use optimized thermal print for Zebra
      if (isZebraPrinter) {
        await printThermalLabels({
          barcodes,
          labelWidthMM: 50,
          labelHeightMM: 25,
          columns: 2,
        })
        toast.success(
          `Printing ${barcodes.length} thermal labels (${Math.ceil(barcodes.length / 2)} rows)`
        )
      } else {
        await printBarcodes({
          barcodes,
          columns: settings.columns,
          leftMargin: settings.marginLeft / 10,
          rightMargin: settings.marginRight / 10,
          topMargin: settings.marginTop / 10,
          barcodeScale: settings.barcodeScale,
          barcodeRotation: settings.barcodeRotation,
        })
        toast.success(
          `Printing ${barcodes.length} barcodes (${layout.totalPages} page${layout.totalPages > 1 ? "s" : ""})`
        )
      }
    } catch (error) {
      console.error("Print error:", error)
      toast.error("Failed to print barcodes")
    }
  }

  const handleDownloadZPL = () => {
    if (barcodes.length === 0) {
      toast.error("Add at least one barcode")
      return
    }
    
    downloadZPL({
      barcodes,
      labelWidthMM: 50,
      labelHeightMM: 25,
      columns: 2,
    }, `barcodes_${Date.now()}.zpl`)
    
    toast.success("ZPL file downloaded! Send to printer using Zebra Setup Utilities")
  }

  const handleCopyZPL = async () => {
    if (barcodes.length === 0) {
      toast.error("Add at least one barcode")
      return
    }
    
    await copyZPLToClipboard({
      barcodes,
      labelWidthMM: 50,
      labelHeightMM: 25,
      columns: 2,
    })
    
    toast.success("ZPL commands copied to clipboard!")
  }

  const [showSetupHelp, setShowSetupHelp] = useState(false)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Barcode Printer {isZebraPrinter && "- Zebra ZD230 Mode"}</DialogTitle>
        </DialogHeader>

        <div className="flex gap-6 flex-1 overflow-hidden">
          {/* LEFT: Settings & Barcodes */}
          <div className="w-96 flex flex-col gap-4 overflow-y-auto pr-3 py-2">
            {/* Paper & Layout Settings */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Print Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Paper Size */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Paper Size</Label>
                  <select
                    value={settings.paperSize}
                    onChange={(e) => updateSetting("paperSize", e.target.value)}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  >
                    {Object.entries(PAPER_SIZES).map(([key, size]) => (
                      <option key={key} value={key}>
                        {size.name}
                      </option>
                    ))}
                  </select>
                  <div className="text-xs text-gray-500 mt-1">
                    {paperSize.width}×{paperSize.height}mm
                  </div>
                </div>

                {/* Number of Barcodes */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Number of Barcodes: {barcodes.length}
                  </Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      type="number"
                      min="1"
                      max="1000"
                      value={barcodes.length}
                      onChange={(e) => {
                        const newCount = parseInt(e.target.value) || 1
                        const currentCount = barcodes.length
                        
                        if (newCount > currentCount) {
                          // Add new barcodes
                          const newBarcodes = Array.from({ length: newCount - currentCount }, (_, i) => ({
                            id: `${Date.now()}_${i}`,
                            code: `${parseInt(productCode) + currentCount + i}`,
                            productName: productName,
                          }))
                          setBarcodes([...barcodes, ...newBarcodes])
                        } else if (newCount < currentCount) {
                          // Remove barcodes from the end
                          setBarcodes(barcodes.slice(0, newCount))
                        }
                      }}
                      className="h-9 text-sm flex-1"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const newBarcodes = Array.from({ length: 5 }, (_, i) => ({
                          id: `${Date.now()}_${i}`,
                          code: `${parseInt(productCode) + barcodes.length + i}`,
                          productName: productName,
                        }))
                        setBarcodes([...barcodes, ...newBarcodes])
                      }}
                    >
                      +5
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const newBarcodes = Array.from({ length: 10 }, (_, i) => ({
                          id: `${Date.now()}_${i}`,
                          code: `${parseInt(productCode) + barcodes.length + i}`,
                          productName: productName,
                        }))
                        setBarcodes([...barcodes, ...newBarcodes])
                      }}
                    >
                      +10
                    </Button>
                  </div>
                  {/* Quick Page Options */}
                  <div className="grid grid-cols-3 gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs h-8"
                      onClick={() => {
                        const perPage = layout.barcodesPerPage
                        const newCount = perPage * 1
                        const currentCount = barcodes.length
                        if (newCount > currentCount) {
                          const newBarcodes = Array.from({ length: newCount - currentCount }, (_, i) => ({
                            id: `${Date.now()}_${i}`,
                            code: `${parseInt(productCode) + currentCount + i}`,
                            productName: productName,
                          }))
                          setBarcodes([...barcodes, ...newBarcodes])
                        }
                      }}
                    >
                      1 Page
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs h-8"
                      onClick={() => {
                        const perPage = layout.barcodesPerPage
                        const newCount = perPage * 2
                        const currentCount = barcodes.length
                        if (newCount > currentCount) {
                          const newBarcodes = Array.from({ length: newCount - currentCount }, (_, i) => ({
                            id: `${Date.now()}_${i}`,
                            code: `${parseInt(productCode) + currentCount + i}`,
                            productName: productName,
                          }))
                          setBarcodes([...barcodes, ...newBarcodes])
                        }
                      }}
                    >
                      2 Pages
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs h-8"
                      onClick={() => {
                        const perPage = layout.barcodesPerPage
                        const newCount = perPage * 3
                        const currentCount = barcodes.length
                        if (newCount > currentCount) {
                          const newBarcodes = Array.from({ length: newCount - currentCount }, (_, i) => ({
                            id: `${Date.now()}_${i}`,
                            code: `${parseInt(productCode) + currentCount + i}`,
                            productName: productName,
                          }))
                          setBarcodes([...barcodes, ...newBarcodes])
                        }
                      }}
                    >
                      3 Pages
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs h-8"
                      onClick={() => {
                        const perPage = layout.barcodesPerPage
                        const newCount = perPage * 5
                        const currentCount = barcodes.length
                        if (newCount > currentCount) {
                          const newBarcodes = Array.from({ length: newCount - currentCount }, (_, i) => ({
                            id: `${Date.now()}_${i}`,
                            code: `${parseInt(productCode) + currentCount + i}`,
                            productName: productName,
                          }))
                          setBarcodes([...barcodes, ...newBarcodes])
                        }
                      }}
                    >
                      5 Pages
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs h-8"
                      onClick={() => {
                        const perPage = layout.barcodesPerPage
                        const newCount = perPage * 10
                        const currentCount = barcodes.length
                        if (newCount > currentCount) {
                          const newBarcodes = Array.from({ length: newCount - currentCount }, (_, i) => ({
                            id: `${Date.now()}_${i}`,
                            code: `${parseInt(productCode) + currentCount + i}`,
                            productName: productName,
                          }))
                          setBarcodes([...barcodes, ...newBarcodes])
                        }
                      }}
                    >
                      10 Pages
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs h-8"
                      onClick={() => {
                        const perPage = layout.barcodesPerPage
                        const newCount = perPage * 20
                        const currentCount = barcodes.length
                        if (newCount > currentCount) {
                          const newBarcodes = Array.from({ length: newCount - currentCount }, (_, i) => ({
                            id: `${Date.now()}_${i}`,
                            code: `${parseInt(productCode) + currentCount + i}`,
                            productName: productName,
                          }))
                          setBarcodes([...barcodes, ...newBarcodes])
                        }
                      }}
                    >
                      20 Pages
                    </Button>
                  </div>
                </div>

                {/* Columns */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Columns: {settings.columns}
                  </Label>
                  <input
                    type="range"
                    min="1"
                    max="4"
                    value={settings.columns}
                    onChange={(e) => updateSetting("columns", parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* Barcode Rotation - PROMINENT */}
                <div className="pt-2 border-t border-b pb-3 bg-blue-50 -mx-4 px-4 py-3">
                  <Label className="text-sm font-medium mb-3 block">🔄 Barcode Rotation</Label>
                  <div className="space-y-2">
                    <button
                      onClick={() => updateSetting("barcodeRotation", 0)}
                      className={`w-full p-2 text-sm border rounded-md font-medium transition-all ${
                        settings.barcodeRotation === 0
                          ? "bg-blue-600 text-white border-blue-700 shadow-md"
                          : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                      }`}
                    >
                      📷 Portrait (Normal)
                    </button>
                    <button
                      onClick={() => updateSetting("barcodeRotation", 90)}
                      className={`w-full p-2 text-sm border rounded-md font-medium transition-all ${
                        settings.barcodeRotation === 90
                          ? "bg-blue-600 text-white border-blue-700 shadow-md"
                          : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                      }`}
                    >
                      🔄 Landscape (Rotated 90°)
                    </button>
                  </div>
                </div>

                {/* Margins - Enhanced with Quick Presets */}
                <div className="pt-2 border-t bg-amber-50 -mx-4 px-4 py-3 rounded">
                  <Label className="text-sm font-medium mb-3 block">📐 Margins</Label>
                  
                  {/* Quick Margin Presets */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-8"
                      onClick={() => {
                        updateSetting("marginTop", 0)
                        updateSetting("marginLeft", 0)
                        updateSetting("marginRight", 0)
                      }}
                    >
                      No Margin
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-8"
                      onClick={() => {
                        updateSetting("marginTop", 5)
                        updateSetting("marginLeft", 5)
                        updateSetting("marginRight", 5)
                      }}
                    >
                      Compact
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-8"
                      onClick={() => {
                        updateSetting("marginTop", 10)
                        updateSetting("marginLeft", 10)
                        updateSetting("marginRight", 10)
                      }}
                    >
                      Standard
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-8"
                      onClick={() => {
                        updateSetting("marginTop", 15)
                        updateSetting("marginLeft", 15)
                        updateSetting("marginRight", 15)
                      }}
                    >
                      Wide
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-8"
                      onClick={() => {
                        updateSetting("marginTop", 20)
                        updateSetting("marginLeft", 20)
                        updateSetting("marginRight", 20)
                      }}
                    >
                      Extra Wide
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-8"
                      onClick={() => {
                        updateSetting("marginTop", 8)
                        updateSetting("marginLeft", 12)
                        updateSetting("marginRight", 12)
                      }}
                    >
                      Custom
                    </Button>
                  </div>

                  {/* Individual Margin Sliders */}
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs font-medium">
                        ↑ Top: {settings.marginTop}mm
                      </Label>
                      <input
                        type="range"
                        min="0"
                        max="20"
                        value={settings.marginTop}
                        onChange={(e) => updateSetting("marginTop", parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-medium">
                        ← Left: {settings.marginLeft}mm
                      </Label>
                      <input
                        type="range"
                        min="0"
                        max="20"
                        value={settings.marginLeft}
                        onChange={(e) => updateSetting("marginLeft", parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-medium">
                        → Right: {settings.marginRight}mm
                      </Label>
                      <input
                        type="range"
                        min="0"
                        max="20"
                        value={settings.marginRight}
                        onChange={(e) => updateSetting("marginRight", parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Barcode Scale */}
                <div className="pt-2 border-t">
                  <Label className="text-sm font-medium mb-2 block">
                    Barcode Size: {(settings.barcodeScale * 50).toFixed(0)}×{(settings.barcodeScale * 25).toFixed(0)}mm
                  </Label>
                  <input
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.1"
                    value={settings.barcodeScale}
                    onChange={(e) => updateSetting("barcodeScale", parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-500 mt-2 flex justify-between">
                    <span>0.5x (25×12.5mm)</span>
                    <span>1x (50×25mm)</span>
                    <span>2x (100×50mm)</span>
                    <span>3x (150×75mm)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Barcodes List */}
            <Card className="flex-1 overflow-hidden flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Barcodes ({barcodes.length})</CardTitle>
                  <Button size="sm" onClick={addBarcode}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto space-y-3 pb-4">
                {barcodes.map((barcode, idx) => (
                  <div key={barcode.id} className="border rounded-md p-3 space-y-2 bg-slate-50">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-500">#{idx + 1}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeBarcode(barcode.id)}
                        className="h-6 w-6 p-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    <div>
                      <Label className="text-xs">Code</Label>
                      <Input
                        value={barcode.code}
                        onChange={(e) => updateBarcode(barcode.id, "code", e.target.value)}
                        placeholder="80010001002"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Product Name</Label>
                      <Input
                        value={barcode.productName}
                        onChange={(e) => updateBarcode(barcode.id, "productName", e.target.value)}
                        placeholder="Feather - Peacock Blue"
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* RIGHT: Live Preview */}
          <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            {/* Preview Canvas */}
            <Card className="flex-1 flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
              <CardContent className="p-8 w-full h-full flex items-center justify-center">
                {/* Paper Preview */}
                <div
                  className="border-4 border-gray-800 bg-white shadow-2xl"
                  style={{
                    width: `${Math.min(paperSize.width * 2, 500)}px`,
                    aspectRatio: `${paperSize.width} / ${paperSize.height}`,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Grid of barcodes */}
                  {Array.from({ length: layout.barcodesPerPage }).map((_, idx) => {
                    const col = idx % layout.cols
                    const row = Math.floor(idx / layout.cols)
                    const x = settings.marginLeft + col * (layout.scaledBarcodeWidth + 2)
                    const y = settings.marginTop + row * (layout.scaledBarcodeHeight + 2)

                    const scaleX = (Math.min(paperSize.width * 2, 500) / paperSize.width)
                    const scaledX = x * scaleX
                    const scaledY = y * scaleX
                    const scaledWidth = layout.scaledBarcodeWidth * scaleX
                    const scaledHeight = layout.scaledBarcodeHeight * scaleX

                    // For 90° rotation, swap width and height
                    const displayWidth = settings.barcodeRotation === 90 ? scaledHeight : scaledWidth
                    const displayHeight = settings.barcodeRotation === 90 ? scaledWidth : scaledHeight

                    return (
                      <div
                        key={idx}
                        className="absolute bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-400 flex items-center justify-center text-blue-700 font-bold text-xs rounded-sm overflow-hidden"
                        style={{
                          left: `${scaledX}px`,
                          top: `${scaledY}px`,
                          width: `${displayWidth}px`,
                          height: `${displayHeight}px`,
                          transform: `rotate(${settings.barcodeRotation}deg)`,
                          transformOrigin: "center",
                        }}
                        title={`Position ${idx + 1}`}
                      >
                        {idx + 1}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardContent className="pt-4">
                <div className="grid grid-cols-3 gap-4 text-center text-sm">
                  <div className="p-2 bg-blue-50 rounded">
                    <div className="text-gray-600 font-medium">Layout</div>
                    <div className="text-lg font-bold text-blue-600">
                      {isZebraPrinter ? "2×1" : `${layout.cols}×${layout.rows}`}
                    </div>
                  </div>
                  <div className="p-2 bg-green-50 rounded">
                    <div className="text-gray-600 font-medium">Per Row</div>
                    <div className="text-lg font-bold text-green-600">
                      {isZebraPrinter ? "2" : layout.barcodesPerPage}
                    </div>
                  </div>
                  <div className="p-2 bg-orange-50 rounded">
                    <div className="text-gray-600 font-medium">Total Rows</div>
                    <div className="text-lg font-bold text-orange-600">
                      {isZebraPrinter ? Math.ceil(barcodes.length / 2) : layout.totalPages}
                    </div>
                  </div>
                </div>

                {/* Zebra Printer Info */}
                {isZebraPrinter && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <div className="flex items-start gap-2 text-xs text-amber-800">
                      <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong>Zebra ZD230 Mode:</strong> Each row prints 2 labels (50mm × 25mm each).
                        Total width: 100mm. Make sure your printer is set to continuous media or gap detection.
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Setup Help Modal */}
        {showSetupHelp && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowSetupHelp(false)}>
            <div className="bg-white rounded-lg max-w-2xl max-h-[80vh] overflow-auto p-6 m-4" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-4">Zebra ZD230 Printer Setup</h2>
              <pre className="text-xs whitespace-pre-wrap bg-gray-100 p-4 rounded overflow-auto max-h-96">
                {getZebraSetupInstructions()}
              </pre>
              <Button onClick={() => setShowSetupHelp(false)} className="mt-4 w-full">Close</Button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex flex-wrap gap-2 justify-between pt-4 border-t mt-4">
          <div className="flex gap-2">
            {isZebraPrinter && (
              <>
                <Button variant="outline" size="sm" onClick={() => setShowSetupHelp(true)}>
                  <Info className="w-4 h-4 mr-1" />
                  Setup Guide
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownloadZPL}>
                  <Download className="w-4 h-4 mr-1" />
                  Download ZPL
                </Button>
                <Button variant="outline" size="sm" onClick={handleCopyZPL}>
                  <FileCode className="w-4 h-4 mr-1" />
                  Copy ZPL
                </Button>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
              <Printer className="w-4 h-4 mr-2" />
              {isZebraPrinter 
                ? `Print ${barcodes.length} Labels (${Math.ceil(barcodes.length / 2)} Rows)`
                : `Print ${barcodes.length} Barcodes (${layout.totalPages} Page${layout.totalPages > 1 ? "s" : ""})`
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
