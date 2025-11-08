"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Printer, Plus, Trash2, Eye, Settings, Copy, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { printBarcodes } from "@/lib/barcode-print-service"

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
  // Paper settings
  paperSize: "a8" | "a7" | "a6" | "a5" | "a4" | "a3" | "custom"
  paperWidth: number // mm
  paperHeight: number // mm
  
  // Barcode settings
  barcodeWidth: number // mm
  barcodeHeight: number // mm
  
  // Layout settings
  columns: number
  marginTop: number // mm
  marginBottom: number // mm
  marginLeft: number // mm
  marginRight: number // mm
  horizontalGap: number // mm
  verticalGap: number // mm
  
  // Scale & quality
  scale: number // 0.5 to 2.0
  barcodeQuality: "low" | "medium" | "high"
}

const DEFAULT_SETTINGS: PrintSettings = {
  paperSize: "a4",
  paperWidth: 210,
  paperHeight: 297,
  barcodeWidth: 50,
  barcodeHeight: 25,
  columns: 2,
  marginTop: 10,
  marginBottom: 10,
  marginLeft: 10,
  marginRight: 10,
  horizontalGap: 0,
  verticalGap: 2,
  scale: 1,
  barcodeQuality: "high",
}

const PRESETS = {
  "a8-2col": {
    name: "A8 - 2 Columns (52×74mm)",
    settings: {
      ...DEFAULT_SETTINGS,
      paperSize: "a8",
      paperWidth: 52,
      paperHeight: 74,
      columns: 2,
      barcodeWidth: 20,
      barcodeHeight: 20,
      marginTop: 2,
      marginBottom: 2,
      marginLeft: 2,
      marginRight: 2,
      horizontalGap: 2,
      verticalGap: 2,
    },
  },
  "a7-2col": {
    name: "A7 - 2 Columns (74×105mm)",
    settings: {
      ...DEFAULT_SETTINGS,
      paperSize: "a7",
      paperWidth: 74,
      paperHeight: 105,
      columns: 2,
      barcodeWidth: 28,
      barcodeHeight: 22,
      marginTop: 3,
      marginBottom: 3,
      marginLeft: 3,
      marginRight: 3,
      horizontalGap: 2,
      verticalGap: 2,
    },
  },
  "a6-2col": {
    name: "A6 - 2 Columns (105×148mm)",
    settings: {
      ...DEFAULT_SETTINGS,
      paperSize: "a6",
      paperWidth: 105,
      paperHeight: 148,
      columns: 2,
      barcodeWidth: 40,
      barcodeHeight: 25,
      marginTop: 5,
      marginBottom: 5,
      marginLeft: 5,
      marginRight: 5,
      horizontalGap: 3,
      verticalGap: 3,
    },
  },
  "a5-2col": {
    name: "A5 - 2 Columns (148×210mm)",
    settings: {
      ...DEFAULT_SETTINGS,
      paperSize: "a5",
      paperWidth: 148,
      paperHeight: 210,
      columns: 2,
      barcodeWidth: 60,
      barcodeHeight: 30,
      marginTop: 5,
      marginBottom: 5,
      marginLeft: 5,
      marginRight: 5,
      horizontalGap: 3,
      verticalGap: 3,
    },
  },
  "a4-2col": {
    name: "A4 - 2 Columns (210×297mm)",
    settings: {
      ...DEFAULT_SETTINGS,
      paperSize: "a4",
      columns: 2,
      barcodeWidth: 90,
      barcodeHeight: 35,
      marginTop: 10,
      marginBottom: 10,
      marginLeft: 10,
      marginRight: 10,
      horizontalGap: 5,
      verticalGap: 5,
    },
  },
  "a3-2col": {
    name: "A3 - 2 Columns (297×420mm)",
    settings: {
      ...DEFAULT_SETTINGS,
      paperSize: "a3",
      columns: 2,
      barcodeWidth: 120,
      barcodeHeight: 45,
      marginTop: 15,
      marginBottom: 15,
      marginLeft: 15,
      marginRight: 15,
      horizontalGap: 7,
      verticalGap: 7,
    },
  },
  "custom-2col": {
    name: "Custom - 2 Columns",
    settings: {
      ...DEFAULT_SETTINGS,
      columns: 2,
      barcodeWidth: 50,
      barcodeHeight: 25,
      marginTop: 10,
      marginBottom: 10,
      marginLeft: 10,
      marginRight: 10,
      horizontalGap: 5,
      verticalGap: 5,
    },
  },
}

export function AdvancedBarcodePrinter({ open, onOpenChange, productCode, productName }: BarcodePrinterProps) {
  const [barcodes, setBarcodes] = useState<BarcodeItem[]>([
    { id: "1", code: productCode, productName: productName },
  ])
  const [settings, setSettings] = useState<PrintSettings>(DEFAULT_SETTINGS)
  const [previewMode, setPreviewMode] = useState<"grid" | "page">("page")
  const [selectedPreset, setSelectedPreset] = useState("2col-50x25")
  const [showLivePreview, setShowLivePreview] = useState(true)

  const addBarcode = () => {
    const newBarcode: BarcodeItem = {
      id: Date.now().toString(),
      code: productCode,
      productName: productName,
    }
    setBarcodes([...barcodes, newBarcode])
  }

  const removeBarcode = (id: string) => {
    setBarcodes(barcodes.filter((b) => b.id !== id))
  }

  const updateBarcode = (id: string, field: "code" | "productName", value: string) => {
    setBarcodes(
      barcodes.map((b) =>
        b.id === id ? { ...b, [field]: value } : b
      )
    )
  }

  const updateSetting = (key: keyof PrintSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const applyPreset = (presetKey: string) => {
    setSelectedPreset(presetKey)
    const preset = PRESETS[presetKey as keyof typeof PRESETS]
    if (preset) {
      setSettings(preset.settings as PrintSettings)
    }
  }

  const calculateLayout = () => {
    const availableWidth = settings.paperWidth - settings.marginLeft - settings.marginRight
    const availableHeight = settings.paperHeight - settings.marginTop - settings.marginBottom

    const scaledBarcodeWidth = settings.barcodeWidth * settings.scale
    const scaledBarcodeHeight = settings.barcodeHeight * settings.scale
    const scaledHGap = settings.horizontalGap * settings.scale
    const scaledVGap = settings.verticalGap * settings.scale

    const columnWidth = scaledBarcodeWidth + scaledHGap
    const rowHeight = scaledBarcodeHeight + scaledVGap

    const cols = Math.floor(availableWidth / columnWidth)
    const rows = Math.floor(availableHeight / rowHeight)
    const barcodesPerPage = cols * rows
    const pagesNeeded = Math.ceil(barcodes.length / barcodesPerPage)

    return {
      cols,
      rows,
      barcodesPerPage,
      pagesNeeded,
      scaledBarcodeWidth,
      scaledBarcodeHeight,
      columnWidth,
      rowHeight,
      availableWidth,
      availableHeight,
    }
  }

  const layout = calculateLayout()

  const handlePrint = async () => {
    if (barcodes.length === 0) {
      toast.error("Add at least one barcode")
      return
    }

    try {
      await printBarcodes({
        barcodes,
        columns: settings.columns,
        leftMargin: settings.marginLeft / 10, // Convert mm to cm
        rightMargin: settings.marginRight / 10,
        topMargin: settings.marginTop / 10,
      })

      toast.success(`Printing ${barcodes.length} barcodes (${layout.pagesNeeded} page${layout.pagesNeeded > 1 ? "s" : ""})`)
    } catch (error) {
      console.error("Print error:", error)
      toast.error("Failed to print barcodes")
    }
  }

  const exportSettings = () => {
    const settingsJson = JSON.stringify(settings, null, 2)
    const blob = new Blob([settingsJson], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `barcode-settings-${Date.now()}.json`
    a.click()
    toast.success("Settings exported")
  }

  const copySettings = () => {
    const settingsJson = JSON.stringify(settings, null, 2)
    navigator.clipboard.writeText(settingsJson)
    toast.success("Settings copied to clipboard")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Advanced Barcode Printer</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={copySettings}>
                <Copy className="w-3 h-3 mr-1" />
                Copy Settings
              </Button>
              <Button size="sm" variant="outline" onClick={exportSettings}>
                Export
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Main Split-Screen Layout */}
        <div className="flex gap-6 flex-1 overflow-hidden h-[80vh]">
          {/* LEFT SIDE - Settings & Controls (Compact) */}
          <div className="w-80 overflow-y-auto pr-2 border-r">
            <Tabs defaultValue="barcodes" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="barcodes" className="text-xs">Barcodes</TabsTrigger>
                <TabsTrigger value="presets" className="text-xs">Presets</TabsTrigger>
                <TabsTrigger value="settings" className="text-xs">Settings</TabsTrigger>
              </TabsList>

              {/* Barcodes Tab */}
              <TabsContent value="barcodes" className="space-y-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm">Barcodes ({barcodes.length})</CardTitle>
                    <CardDescription>Add or edit barcode items to print</CardDescription>
                  </div>
                  <Button size="sm" onClick={addBarcode}>
                    <Plus className="w-3 h-3 mr-1" />
                    Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                {barcodes.map((barcode) => (
                  <div key={barcode.id} className="flex gap-2 items-end pb-2 border-b">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">Barcode Code</Label>
                      <Input
                        value={barcode.code}
                        onChange={(e) => updateBarcode(barcode.id, "code", e.target.value)}
                        placeholder="Barcode code"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">Product Name</Label>
                      <Input
                        value={barcode.productName}
                        onChange={(e) => updateBarcode(barcode.id, "productName", e.target.value)}
                        placeholder="Product name"
                        className="h-8 text-xs"
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeBarcode(barcode.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Presets Tab */}
          <TabsContent value="presets" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Print Presets</CardTitle>
                <CardDescription>Quick templates for common layouts</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(PRESETS).map(([key, preset]) => (
                  <Button
                    key={key}
                    variant={selectedPreset === key ? "default" : "outline"}
                    className="h-auto py-3 px-4 text-left justify-start flex-col items-start"
                    onClick={() => applyPreset(key)}
                  >
                    <div className="font-medium text-sm">{preset.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {preset.settings.columns}col • {preset.settings.barcodeWidth}×{preset.settings.barcodeHeight}mm • {Math.floor((preset.settings.paperWidth - preset.settings.marginLeft - preset.settings.marginRight) / (preset.settings.barcodeWidth * preset.settings.scale + preset.settings.horizontalGap * preset.settings.scale)) * Math.floor((preset.settings.paperHeight - preset.settings.marginTop - preset.settings.marginBottom) / (preset.settings.barcodeHeight * preset.settings.scale + preset.settings.verticalGap * preset.settings.scale))}/page
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Paper Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Paper Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">Paper Size</Label>
                    <select
                      value={settings.paperSize}
                      onChange={(e) => {
                        updateSetting("paperSize", e.target.value)
                        if (e.target.value === "a8") {
                          updateSetting("paperWidth", 52)
                          updateSetting("paperHeight", 74)
                        } else if (e.target.value === "a7") {
                          updateSetting("paperWidth", 74)
                          updateSetting("paperHeight", 105)
                        } else if (e.target.value === "a6") {
                          updateSetting("paperWidth", 105)
                          updateSetting("paperHeight", 148)
                        } else if (e.target.value === "a5") {
                          updateSetting("paperWidth", 148)
                          updateSetting("paperHeight", 210)
                        } else if (e.target.value === "a4") {
                          updateSetting("paperWidth", 210)
                          updateSetting("paperHeight", 297)
                        } else if (e.target.value === "a3") {
                          updateSetting("paperWidth", 297)
                          updateSetting("paperHeight", 420)
                        }
                      }}
                      className="w-full px-2 py-1.5 border rounded text-xs"
                    >
                      <option value="a8">A8 (52×74mm)</option>
                      <option value="a7">A7 (74×105mm)</option>
                      <option value="a6">A6 (105×148mm)</option>
                      <option value="a5">A5 (148×210mm)</option>
                      <option value="a4">A4 (210×297mm)</option>
                      <option value="a3">A3 (297×420mm)</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>

                  {settings.paperSize === "custom" && (
                    <>
                      <div>
                        <Label className="text-xs">Width (mm)</Label>
                        <Input
                          type="number"
                          value={settings.paperWidth}
                          onChange={(e) => updateSetting("paperWidth", Number(e.target.value))}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Height (mm)</Label>
                        <Input
                          type="number"
                          value={settings.paperHeight}
                          onChange={(e) => updateSetting("paperHeight", Number(e.target.value))}
                          className="h-8 text-xs"
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Barcode Dimensions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Barcode Dimensions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">Width (mm)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={settings.barcodeWidth}
                      onChange={(e) => updateSetting("barcodeWidth", Number(e.target.value))}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Height (mm)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={settings.barcodeHeight}
                      onChange={(e) => updateSetting("barcodeHeight", Number(e.target.value))}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Columns</Label>
                    <Input
                      type="number"
                      min="1"
                      max="6"
                      value={settings.columns}
                      onChange={(e) => updateSetting("columns", Number(e.target.value))}
                      className="h-8 text-xs"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Margins */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Margins (mm)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Top</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={settings.marginTop}
                        onChange={(e) => updateSetting("marginTop", Number(e.target.value))}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Bottom</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={settings.marginBottom}
                        onChange={(e) => updateSetting("marginBottom", Number(e.target.value))}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Left</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={settings.marginLeft}
                        onChange={(e) => updateSetting("marginLeft", Number(e.target.value))}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Right</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={settings.marginRight}
                        onChange={(e) => updateSetting("marginRight", Number(e.target.value))}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Gaps & Scale */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Gaps & Scale</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">Horizontal Gap (mm)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={settings.horizontalGap}
                      onChange={(e) => updateSetting("horizontalGap", Number(e.target.value))}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Vertical Gap (mm)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={settings.verticalGap}
                      onChange={(e) => updateSetting("verticalGap", Number(e.target.value))}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Scale: {(settings.scale * 100).toFixed(0)}%</Label>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={settings.scale}
                      onChange={(e) => updateSetting("scale", Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Quality</Label>
                    <select
                      value={settings.barcodeQuality}
                      onChange={(e) => updateSetting("barcodeQuality", e.target.value)}
                      className="w-full px-2 py-1.5 border rounded text-xs"
                    >
                      <option value="low">Low (Fast)</option>
                      <option value="medium">Medium</option>
                      <option value="high">High (Clear)</option>
                    </select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Layout Calculations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Columns</p>
                    <p className="text-lg font-bold">{layout.cols}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Rows</p>
                    <p className="text-lg font-bold">{layout.rows}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Per Page</p>
                    <p className="text-lg font-bold">{layout.barcodesPerPage}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pages Needed</p>
                    <p className="text-lg font-bold">{layout.pagesNeeded}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Page Preview (Scaled)</CardTitle>
                <Button
                  variant={showLivePreview ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowLivePreview(!showLivePreview)}
                  className="h-7 px-2 text-xs gap-1"
                >
                  {showLivePreview ? (
                    <>
                      <Eye className="w-3 h-3" />
                      Live Preview: ON
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3 h-3" />
                      Live Preview: OFF
                    </>
                  )}
                </Button>
              </CardHeader>
              {showLivePreview && (
              <CardContent className="flex justify-center">
                <div
                  className="border-2 border-gray-300 bg-white relative"
                  style={{
                    width: Math.min(layout.availableWidth * 0.3, 300),
                    aspectRatio: `${settings.paperWidth} / ${settings.paperHeight}`,
                  }}
                >
                  {/* Margins visualization */}
                  <div
                    className="absolute border border-red-200 bg-red-50 opacity-50"
                    style={{
                      left: `${(settings.marginLeft / settings.paperWidth) * 100}%`,
                      top: `${(settings.marginTop / settings.paperHeight) * 100}%`,
                      width: `${(layout.availableWidth / settings.paperWidth) * 100}%`,
                      height: `${(layout.availableHeight / settings.paperHeight) * 100}%`,
                    }}
                  />

                  {/* Barcode grid */}
                  {Array.from({ length: Math.min(layout.barcodesPerPage, 6) }).map((_, idx) => {
                    const col = idx % layout.cols
                    const row = Math.floor(idx / layout.cols)
                    const x = settings.marginLeft + col * layout.columnWidth
                    const y = settings.marginTop + row * layout.rowHeight

                    return (
                      <div
                        key={idx}
                        className="absolute border border-blue-300 bg-blue-50 flex items-center justify-center"
                        style={{
                          left: `${(x / settings.paperWidth) * 100}%`,
                          top: `${(y / settings.paperHeight) * 100}%`,
                          width: `${(layout.scaledBarcodeWidth / settings.paperWidth) * 100}%`,
                          height: `${(layout.scaledBarcodeHeight / settings.paperHeight) * 100}%`,
                          fontSize: "8px",
                        }}
                      >
                        {idx + 1}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
              )}
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Settings Summary</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-1 font-mono">
                <p><strong>Paper:</strong> {settings.paperWidth}mm × {settings.paperHeight}mm</p>
                <p><strong>Barcode:</strong> {settings.barcodeWidth}mm × {settings.barcodeHeight}mm (scaled {(settings.scale * 100).toFixed(0)}%)</p>
                <p><strong>Layout:</strong> {layout.cols} columns × {layout.rows} rows</p>
                <p><strong>Barcodes/Page:</strong> {layout.barcodesPerPage}</p>
                <p><strong>Total Pages:</strong> {layout.pagesNeeded}</p>
                <p><strong>Margins:</strong> T:{settings.marginTop}mm R:{settings.marginRight}mm B:{settings.marginBottom}mm L:{settings.marginLeft}mm</p>
                <p><strong>Gaps:</strong> H:{settings.horizontalGap}mm V:{settings.verticalGap}mm</p>
              </CardContent>
            </Card>
          </TabsContent>
            </Tabs>
          </div>

          {/* RIGHT SIDE - Live Preview Panel */}
          <div className="w-96 border-l pl-4 overflow-y-auto bg-slate-50 rounded-lg p-4 flex flex-col">
            {/* RIGHT SIDE - Large Canva-Style Design Canvas */}
            <div className="flex-1 flex flex-col gap-3 overflow-hidden">
              {/* Preview Header */}
              <div className="flex items-center justify-between px-4 py-2 border-b">
                <h3 className="font-bold text-lg">Live Preview</h3>
                <Button
                  variant={showLivePreview ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowLivePreview(!showLivePreview)}
                  className="gap-2"
                >
                  {showLivePreview ? (
                    <>
                      <Eye className="w-4 h-4" />
                      Preview ON
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4" />
                      Preview OFF
                    </>
                  )}
                </Button>
              </div>

              {showLivePreview ? (
                <div className="flex-1 flex flex-col gap-3 overflow-hidden px-4">
                  {/* Large Canvas Area - Canva Style */}
                  <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-50 rounded-lg overflow-hidden border-2 border-slate-200 shadow-inner">
                    <div className="flex items-center justify-center w-full h-full p-4">
                      <div
                        className="border-4 border-slate-800 bg-white shadow-2xl flex items-center justify-center"
                        style={{
                          width: `${Math.max(300, Math.min((settings.paperWidth / 10), 600))}px`,
                          aspectRatio: `${settings.paperWidth} / ${settings.paperHeight}`,
                          position: 'relative',
                          overflow: 'hidden',
                        }}
                      >
                        {/* Margins visualization - Red transparent areas */}
                        <div
                          className="absolute border-2 border-dashed border-red-400 bg-red-50 opacity-30"
                          style={{
                            left: `${(settings.marginLeft / settings.paperWidth) * 100}%`,
                            top: `${(settings.marginTop / settings.paperHeight) * 100}%`,
                            width: `${(layout.availableWidth / settings.paperWidth) * 100}%`,
                            height: `${(layout.availableHeight / settings.paperHeight) * 100}%`,
                          }}
                        />

                        {/* Barcode grid - LARGE VISIBLE */}
                        <div className="absolute w-full h-full">
                          {Array.from({ length: layout.barcodesPerPage }).map((_, idx) => {
                            const col = idx % layout.cols
                            const row = Math.floor(idx / layout.cols)
                            const x = settings.marginLeft + col * layout.columnWidth
                            const y = settings.marginTop + row * layout.rowHeight

                            return (
                              <div
                                key={idx}
                                className="absolute bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-500 flex items-center justify-center text-blue-700 font-bold rounded-sm hover:from-blue-100 hover:to-blue-200 transition-colors"
                                style={{
                                  left: `${(x / settings.paperWidth) * 100}%`,
                                  top: `${(y / settings.paperHeight) * 100}%`,
                                  width: `${(layout.scaledBarcodeWidth / settings.paperWidth) * 100}%`,
                                  height: `${(layout.scaledBarcodeHeight / settings.paperHeight) * 100}%`,
                                  fontSize: Math.max(10, (layout.scaledBarcodeWidth / 10)) + 'px',
                                }}
                                title={`Barcode ${idx + 1}`}
                              >
                                {idx + 1}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Layout Statistics - Bottom Card */}
                  <Card className="bg-slate-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold">Design Layout Stats</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex justify-between p-2 bg-white rounded border border-slate-200">
                          <span className="text-gray-600 font-medium">Paper:</span>
                          <span className="font-mono font-bold">{settings.paperWidth}×{settings.paperHeight}mm</span>
                        </div>
                        <div className="flex justify-between p-2 bg-white rounded border border-slate-200">
                          <span className="text-gray-600 font-medium">Barcode:</span>
                          <span className="font-mono font-bold">{settings.barcodeWidth}×{settings.barcodeHeight}mm</span>
                        </div>
                        <div className="flex justify-between p-2 bg-white rounded border border-slate-200">
                          <span className="text-gray-600 font-medium">Scale:</span>
                          <span className="font-mono font-bold text-purple-600">{(settings.scale * 100).toFixed(0)}%</span>
                        </div>
                        <div className="flex justify-between p-2 bg-white rounded border border-slate-200">
                          <span className="text-gray-600 font-medium">Cols:</span>
                          <span className="font-mono font-bold text-blue-600">{layout.cols}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                        <div className="flex justify-between p-2 bg-blue-50 rounded border border-blue-200">
                          <span className="text-gray-600 font-medium">Rows:</span>
                          <span className="font-mono font-bold text-blue-700">{layout.rows}</span>
                        </div>
                        <div className="flex justify-between p-2 bg-green-50 rounded border border-green-200">
                          <span className="text-gray-600 font-medium">Per Page:</span>
                          <span className="font-mono font-bold text-green-700">{layout.barcodesPerPage}</span>
                        </div>
                        <div className="flex justify-between p-2 bg-orange-50 rounded border border-orange-200 col-span-2">
                          <span className="text-gray-600 font-medium">Total Pages Needed:</span>
                          <span className="font-mono font-bold text-orange-700">{layout.pagesNeeded} pages</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-50 rounded-lg border-2 border-dashed border-slate-300">
                  <p className="text-gray-500 text-lg font-semibold">Live preview is disabled. Click ON to enable.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Print Button */}
        <div className="flex gap-2 justify-end pt-4 border-t mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
            <Printer className="w-4 h-4 mr-2" />
            Print {barcodes.length} Barcodes ({layout.pagesNeeded} Page{layout.pagesNeeded > 1 ? "s" : ""})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
