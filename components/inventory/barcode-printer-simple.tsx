"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Printer, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { printBarcodes } from "@/lib/barcode-print-service"

interface BarcodeItem {
  id: string
  code: string
  productName: string
  scale: number // Individual scale per barcode
}

interface BarcodePrinterProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productCode: string
  productName: string
}

interface PrintSettings {
  paperSize: string
  columns: number
  marginTop: number
  marginBottom: number
  marginLeft: number
  marginRight: number
  barcodeRotation: number // 0° (normal) or 90° (rotated)
}

// 18+ Paper Sizes
const PAPER_SIZES: Record<string, { name: string; width: number; height: number }> = {
  // Standard A-Series
  "a0": { name: "A0 (841×1189mm)", width: 841, height: 1189 },
  "a1": { name: "A1 (594×841mm)", width: 594, height: 841 },
  "a2": { name: "A2 (420×594mm)", width: 420, height: 594 },
  "a3": { name: "A3 (297×420mm)", width: 297, height: 420 },
  "a4": { name: "A4 (210×297mm)", width: 210, height: 297 },
  "a5": { name: "A5 (148×210mm)", width: 148, height: 210 },
  "a6": { name: "A6 (105×148mm)", width: 105, height: 148 },
  "a7": { name: "A7 (74×105mm)", width: 74, height: 105 },
  "a8": { name: "A8 (52×74mm)", width: 52, height: 74 },

  // B-Series
  "b4": { name: "B4 (250×353mm)", width: 250, height: 353 },
  "b5": { name: "B5 (176×250mm)", width: 176, height: 250 },
  "b6": { name: "B6 (125×176mm)", width: 125, height: 176 },

  // Thermal Printers
  "thermal-4x6": { name: "Thermal 4×6 in (101.6×152.4mm)", width: 101.6, height: 152.4 },
  "thermal-3x5": { name: "Thermal 3×5 in (76.2×127mm)", width: 76.2, height: 127 },
  "thermal-4x8": { name: "Thermal 4×8 in (101.6×203.2mm)", width: 101.6, height: 203.2 },

  // Envelopes
  "envelope-dl": { name: "Envelope DL (110×220mm)", width: 110, height: 220 },
  "envelope-c5": { name: "Envelope C5 (162×229mm)", width: 162, height: 229 },

  // Custom
  "custom": { name: "Custom Size", width: 100, height: 150 },
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
      scale: 1,
    },
  ])

  const [settings, setSettings] = useState<PrintSettings>({
    paperSize: "a4",
    columns: 2,
    marginTop: 10,
    marginBottom: 10,
    marginLeft: 10,
    marginRight: 10,
    barcodeRotation: 0,
  })

  const paperSize = PAPER_SIZES[settings.paperSize]

  // Barcode dimensions - FIXED
  const BARCODE_WIDTH = 50 // mm
  const BARCODE_HEIGHT = 25 // mm

  // Calculate layout
  const calculateLayout = () => {
    const availableWidth = paperSize.width - settings.marginLeft - settings.marginRight
    const availableHeight = paperSize.height - settings.marginTop - settings.marginBottom

    // Use average scale for layout calculation (or could use max)
    const avgScale = barcodes.length > 0 ? barcodes.reduce((sum, b) => sum + b.scale, 0) / barcodes.length : 1

    const scaledBarcodeWidth = BARCODE_WIDTH * avgScale
    const scaledBarcodeHeight = BARCODE_HEIGHT * avgScale

    const cols = settings.columns
    const barcodeWidthWithGap = scaledBarcodeWidth + 2
    const rowHeight = scaledBarcodeHeight + 2

    const rows = Math.floor(availableHeight / rowHeight)
    const barcodesPerPage = cols * rows
    const totalPages = Math.ceil(barcodes.length / barcodesPerPage)

    return {
      cols,
      rows,
      barcodesPerPage,
      totalPages,
    }
  }

  const layout = calculateLayout()

  const addBarcode = () => {
    const newId = `${Date.now()}`
    const nextCode = parseInt(barcodes[barcodes.length - 1]?.code || productCode) + 1
    setBarcodes([
      ...barcodes,
      {
        id: newId,
        code: `${nextCode}`,
        productName: productName,
        scale: 1,
      },
    ])
  }

  const updateBarcode = (id: string, field: keyof BarcodeItem, value: string | number) => {
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

  const handlePrint = async () => {
    if (barcodes.length === 0) {
      toast.error("Add at least one barcode")
      return
    }

    try {
      // Create barcode list with individual scales
      const printBarcodeList = barcodes.map(b => ({
        code: b.code,
        productName: b.productName,
        scale: b.scale,
      }))

      await printBarcodes({
        barcodes: printBarcodeList,
        columns: settings.columns,
        leftMargin: settings.marginLeft / 10,
        rightMargin: settings.marginRight / 10,
        topMargin: settings.marginTop / 10,
        barcodeScale: 1, // Base scale (individual scales handled above)
        barcodeRotation: settings.barcodeRotation,
      })

      toast.success(
        `Printing ${barcodes.length} barcodes (${layout.totalPages} page${layout.totalPages > 1 ? "s" : ""})`
      )
    } catch (error) {
      console.error("Print error:", error)
      toast.error("Failed to print barcodes")
    }
  }

  const updateBarcodeCount = (newCount: number) => {
    const currentCount = barcodes.length

    if (newCount > currentCount) {
      const newBarcodes = Array.from({ length: newCount - currentCount }, (_, i) => ({
        id: `${Date.now()}_${i}`,
        code: `${parseInt(barcodes[currentCount - 1]?.code || productCode) + i + 1}`,
        productName: productName,
        scale: 1,
      }))
      setBarcodes([...barcodes, ...newBarcodes])
    } else if (newCount < currentCount) {
      setBarcodes(barcodes.slice(0, newCount))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Barcode Printer - Simple View</DialogTitle>
        </DialogHeader>

        <div className="flex gap-6 flex-1 overflow-hidden">
          {/* LEFT: Controls */}
          <div className="w-96 flex flex-col gap-3 overflow-y-auto pr-2">
            {/* Main Controls Card */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">📋 Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Paper Size */}
                <div>
                  <Label className="text-sm font-semibold">📄 Paper Size</Label>
                  <select
                    value={settings.paperSize}
                    onChange={(e) => updateSetting("paperSize", e.target.value)}
                    className="w-full px-3 py-2 border rounded-md text-sm mt-1"
                  >
                    {Object.entries(PAPER_SIZES).map(([key, size]) => (
                      <option key={key} value={key}>
                        {size.name}
                      </option>
                    ))}
                  </select>
                  <div className="text-xs text-gray-600 mt-1">
                    {paperSize.width}×{paperSize.height}mm
                  </div>
                </div>

                {/* Number of Barcodes */}
                <div>
                  <Label className="text-sm font-semibold">🔢 Number of Barcodes</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="number"
                      min="1"
                      max="1000"
                      value={barcodes.length}
                      onChange={(e) => updateBarcodeCount(parseInt(e.target.value) || 1)}
                      className="h-9 text-sm flex-1"
                    />
                    <Button size="sm" onClick={() => updateBarcodeCount(barcodes.length + 5)}>
                      +5
                    </Button>
                    <Button size="sm" onClick={() => updateBarcodeCount(barcodes.length + 10)}>
                      +10
                    </Button>
                  </div>
                </div>

                {/* Columns */}
                <div>
                  <Label className="text-sm font-semibold">📊 Columns: {settings.columns}</Label>
                  <input
                    type="range"
                    min="1"
                    max="6"
                    value={settings.columns}
                    onChange={(e) => updateSetting("columns", parseInt(e.target.value))}
                    className="w-full mt-1"
                  />
                </div>

                {/* Rotation */}
                <div>
                  <Label className="text-sm font-semibold mb-2 block">🔄 Rotation</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => updateSetting("barcodeRotation", 0)}
                      className={`p-2 text-sm border rounded-md font-medium transition-all ${
                        settings.barcodeRotation === 0
                          ? "bg-blue-600 text-white border-blue-700"
                          : "bg-white text-gray-700 border-gray-300"
                      }`}
                    >
                      Portrait (0°)
                    </button>
                    <button
                      onClick={() => updateSetting("barcodeRotation", 90)}
                      className={`p-2 text-sm border rounded-md font-medium transition-all ${
                        settings.barcodeRotation === 90
                          ? "bg-blue-600 text-white border-blue-700"
                          : "bg-white text-gray-700 border-gray-300"
                      }`}
                    >
                      Landscape (90°)
                    </button>
                  </div>
                </div>

                {/* 4-Sided Margins */}
                <div className="border-t pt-3">
                  <Label className="text-sm font-semibold mb-3 block">📐 Margins (4 Sides)</Label>
                  
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs">↑ Top: {settings.marginTop}mm</Label>
                      <input
                        type="range"
                        min="0"
                        max="30"
                        value={settings.marginTop}
                        onChange={(e) => updateSetting("marginTop", parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <Label className="text-xs">↓ Bottom: {settings.marginBottom}mm</Label>
                      <input
                        type="range"
                        min="0"
                        max="30"
                        value={settings.marginBottom}
                        onChange={(e) => updateSetting("marginBottom", parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <Label className="text-xs">← Left: {settings.marginLeft}mm</Label>
                      <input
                        type="range"
                        min="0"
                        max="30"
                        value={settings.marginLeft}
                        onChange={(e) => updateSetting("marginLeft", parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <Label className="text-xs">→ Right: {settings.marginRight}mm</Label>
                      <input
                        type="range"
                        min="0"
                        max="30"
                        value={settings.marginRight}
                        onChange={(e) => updateSetting("marginRight", parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Layout Stats */}
            <Card className="bg-green-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Layout Stats</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Columns:</span>
                  <span className="font-bold">{layout.cols}</span>
                </div>
                <div className="flex justify-between">
                  <span>Rows:</span>
                  <span className="font-bold">{layout.rows}</span>
                </div>
                <div className="flex justify-between">
                  <span>Per Page:</span>
                  <span className="font-bold text-green-600">{layout.barcodesPerPage}</span>
                </div>
                <div className="flex justify-between border-t pt-1">
                  <span>Total Pages:</span>
                  <span className="font-bold text-blue-600">{layout.totalPages}</span>
                </div>
              </CardContent>
            </Card>

            {/* Print Button */}
            <Button onClick={handlePrint} size="lg" className="w-full bg-green-600 hover:bg-green-700 text-white">
              <Printer className="w-5 h-5 mr-2" />
              Print ({barcodes.length})
            </Button>
          </div>

          {/* RIGHT: Barcodes List with Individual Scale */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <Card className="flex-1 overflow-hidden flex flex-col">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Barcodes ({barcodes.length})</CardTitle>
                  <Button size="sm" onClick={addBarcode} className="bg-blue-600">
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto space-y-2 pb-4">
                {barcodes.map((barcode, idx) => (
                  <div key={barcode.id} className="border rounded-lg p-3 bg-white hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-gray-600">#{idx + 1}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeBarcode(barcode.id)}
                        className="h-6 w-6 p-0 hover:bg-red-100"
                      >
                        <Trash2 className="w-3 h-3 text-red-600" />
                      </Button>
                    </div>

                    <Input
                      value={barcode.code}
                      onChange={(e) => updateBarcode(barcode.id, "code", e.target.value)}
                      placeholder="Barcode Code"
                      className="h-8 text-xs mb-2"
                    />

                    <Input
                      value={barcode.productName}
                      onChange={(e) => updateBarcode(barcode.id, "productName", e.target.value)}
                      placeholder="Product Name"
                      className="h-8 text-xs mb-2"
                    />

                    {/* Individual Barcode Scale */}
                    <div className="bg-purple-50 p-2 rounded">
                      <Label className="text-xs font-semibold">
                        🎯 Scale: {(barcode.scale * 50).toFixed(0)}×{(barcode.scale * 25).toFixed(0)}mm
                      </Label>
                      <input
                        type="range"
                        min="0.5"
                        max="3"
                        step="0.1"
                        value={barcode.scale}
                        onChange={(e) => updateBarcode(barcode.id, "scale", parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <div className="text-xs text-gray-600 mt-1 flex justify-between">
                        <span>0.5x</span>
                        <span>1x</span>
                        <span>2x</span>
                        <span>3x</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
