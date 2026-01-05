"use client"

import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Printer, Plus, Trash2, Download, Usb, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { generateZPL, downloadZPL } from "@/lib/zebra-zpl-service"

interface BarcodeItem {
  id: string
  code: string
  productName: string
}

interface ZebraDirectThermalPrinterProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productCode: string
  productName: string
}

type PrinterStatus = "checking" | "connected" | "not-found" | "error"

export function ZebraDirectThermalPrinter({
  open,
  onOpenChange,
  productCode,
  productName,
}: ZebraDirectThermalPrinterProps) {
  const [barcodes, setBarcodes] = useState<BarcodeItem[]>([
    { id: "1", code: productCode, productName: productName },
  ])
  const [printerStatus, setPrinterStatus] = useState<PrinterStatus>("checking")
  const [printerName, setPrinterName] = useState<string>("")
  const [isPrinting, setIsPrinting] = useState(false)
  const [quantity, setQuantity] = useState(1)

  // Check for Zebra Browser Print
  const checkPrinterConnection = useCallback(async () => {
    setPrinterStatus("checking")
    
    if (typeof window === "undefined") {
      setPrinterStatus("not-found")
      return
    }

    const BrowserPrint = (window as any).BrowserPrint
    
    if (!BrowserPrint) {
      setPrinterStatus("not-found")
      return
    }

    try {
      BrowserPrint.getDefaultDevice("printer", (device: any) => {
        if (device) {
          setPrinterStatus("connected")
          setPrinterName(device.name || "Zebra Printer")
        } else {
          setPrinterStatus("not-found")
        }
      }, () => {
        setPrinterStatus("error")
      })
    } catch (error) {
      console.error("Printer check error:", error)
      setPrinterStatus("error")
    }
  }, [])

  useEffect(() => {
    if (open) {
      checkPrinterConnection()
    }
  }, [open, checkPrinterConnection])

  // Update barcodes when quantity changes
  useEffect(() => {
    if (quantity > 0 && quantity <= 500) {
      const newBarcodes = Array.from({ length: quantity }, (_, i) => ({
        id: `${Date.now()}_${i}`,
        code: productCode,
        productName: productName,
      }))
      setBarcodes(newBarcodes)
    }
  }, [quantity, productCode, productName])

  const printDirectToZebra = async () => {
    if (barcodes.length === 0) {
      toast.error("Add at least one barcode")
      return
    }

    setIsPrinting(true)
    const zpl = generateZPL({
      barcodes,
      labelWidthMM: 50,
      labelHeightMM: 25,
      columns: 2,
    })

    const BrowserPrint = (window as any).BrowserPrint

    if (BrowserPrint) {
      try {
        BrowserPrint.getDefaultDevice("printer", (device: any) => {
          if (device) {
            device.send(zpl, () => {
              toast.success(`✅ Sent ${barcodes.length} labels to ${device.name || "Zebra Printer"}`)
              setIsPrinting(false)
            }, (error: any) => {
              console.error("Print error:", error)
              toast.error("Failed to send to printer. Downloading ZPL file instead.")
              downloadZPLFile()
              setIsPrinting(false)
            })
          } else {
            toast.error("Printer not found. Downloading ZPL file instead.")
            downloadZPLFile()
            setIsPrinting(false)
          }
        }, () => {
          toast.error("Printer connection error. Downloading ZPL file instead.")
          downloadZPLFile()
          setIsPrinting(false)
        })
      } catch (error) {
        console.error("Print error:", error)
        toast.error("Print failed. Downloading ZPL file instead.")
        downloadZPLFile()
        setIsPrinting(false)
      }
    } else {
      // No Browser Print - download ZPL file
      toast.info("Zebra Browser Print not installed. Downloading ZPL file...")
      downloadZPLFile()
      setIsPrinting(false)
    }
  }

  const downloadZPLFile = () => {
    downloadZPL({
      barcodes,
      labelWidthMM: 50,
      labelHeightMM: 25,
      columns: 2,
    }, `barcodes_${productCode}_${Date.now()}.zpl`)
    toast.success("ZPL file downloaded! Send to printer via USB or Zebra Setup Utilities")
  }

  const printViaRawUSB = async () => {
    // Try to use Web USB API for direct raw printing
    const nav = navigator as any
    if (!nav.usb) {
      toast.error("Web USB not supported. Use ZPL file download instead.")
      downloadZPLFile()
      return
    }

    setIsPrinting(true)
    try {
      const device = await nav.usb.requestDevice({
        filters: [
          { vendorId: 0x0a5f }, // Zebra vendor ID
        ]
      })

      await device.open()
      await device.selectConfiguration(1)
      await device.claimInterface(0)

      const zpl = generateZPL({
        barcodes,
        labelWidthMM: 50,
        labelHeightMM: 25,
        columns: 2,
      })

      const encoder = new TextEncoder()
      const data = encoder.encode(zpl)
      
      await device.transferOut(1, data)
      
      toast.success(`✅ Printed ${barcodes.length} labels via USB`)
      await device.close()
    } catch (error: any) {
      console.error("USB Print error:", error)
      if (error.name === "NotFoundError") {
        toast.error("No Zebra printer found via USB")
      } else {
        toast.error("USB print failed: " + error.message)
      }
      downloadZPLFile()
    } finally {
      setIsPrinting(false)
    }
  }

  const getPrinterStatusDisplay = () => {
    switch (printerStatus) {
      case "checking":
        return (
          <div className="flex items-center gap-2 text-amber-600">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Checking printer...</span>
          </div>
        )
      case "connected":
        return (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="w-4 h-4" />
            <span>Connected: {printerName}</span>
          </div>
        )
      case "not-found":
        return (
          <div className="flex items-center gap-2 text-amber-600">
            <AlertCircle className="w-4 h-4" />
            <span>Zebra Browser Print not detected</span>
          </div>
        )
      case "error":
        return (
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-4 h-4" />
            <span>Connection error</span>
          </div>
        )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="w-5 h-5" />
            Zebra ZD230 Direct Thermal Print
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Printer Status */}
          <Card className="border-2">
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span>🖨️ Printer Status</span>
                <Button variant="ghost" size="sm" onClick={checkPrinterConnection}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              {getPrinterStatusDisplay()}
              {printerStatus === "not-found" && (
                <p className="text-xs text-gray-500 mt-2">
                  Install <a href="https://www.zebra.com/us/en/support-downloads/software/printer-software/browser-print.html" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Zebra Browser Print</a> for direct printing, or use ZPL file download.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Label Configuration */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium">📦 Label Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Barcode & Product Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium">Barcode</Label>
                  <Input
                    value={productCode}
                    disabled
                    className="h-9 text-sm bg-gray-50"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium">Product Name</Label>
                  <Input
                    value={productName}
                    disabled
                    className="h-9 text-sm bg-gray-50"
                  />
                </div>
              </div>

              {/* Quantity */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Number of Labels: {quantity}
                </Label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    min="1"
                    max="500"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Math.min(500, parseInt(e.target.value) || 1)))}
                    className="h-9 text-sm w-24"
                  />
                  <div className="flex gap-1">
                    {[1, 5, 10, 20, 50, 100].map((n) => (
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
                </div>
              </div>

              {/* Label Specs */}
              <div className="bg-gray-50 p-3 rounded-lg text-xs space-y-1">
                <div className="font-medium text-gray-700">Label Specifications:</div>
                <div className="grid grid-cols-2 gap-x-4 text-gray-600">
                  <div>• Label Size: 50mm × 25mm</div>
                  <div>• Layout: 2 columns per row</div>
                  <div>• Total Width: 100mm</div>
                  <div>• Rows to Print: {Math.ceil(quantity / 2)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Print Preview */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium">👁️ Preview (1 Row = 2 Labels)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-300 rounded p-4 bg-white">
                <div className="flex gap-2">
                  {/* Left Label */}
                  <div className="flex-1 border border-gray-400 p-2 text-center bg-gray-50">
                    <div className="text-xs font-mono bg-black text-white px-2 py-1 inline-block mb-1">
                      |||||||||||||||
                    </div>
                    <div className="text-xs font-mono font-bold">{productCode}</div>
                    <div className="text-[10px] text-gray-600 truncate">{productName}</div>
                  </div>
                  {/* Right Label */}
                  <div className="flex-1 border border-gray-400 p-2 text-center bg-gray-50">
                    <div className="text-xs font-mono bg-black text-white px-2 py-1 inline-block mb-1">
                      |||||||||||||||
                    </div>
                    <div className="text-xs font-mono font-bold">{productCode}</div>
                    <div className="text-[10px] text-gray-600 truncate">{productName}</div>
                  </div>
                </div>
                <div className="text-center text-xs text-gray-400 mt-2">
                  ← 100mm total width (50mm × 2) →
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-4 border-t">
          {/* Primary Actions */}
          <div className="flex gap-2">
            <Button
              onClick={printDirectToZebra}
              disabled={isPrinting || barcodes.length === 0}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isPrinting ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Printer className="w-4 h-4 mr-2" />
              )}
              {isPrinting ? "Sending..." : `Print ${quantity} Labels (${Math.ceil(quantity / 2)} Rows)`}
            </Button>
          </div>

          {/* Secondary Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={printViaRawUSB}
              disabled={isPrinting}
              className="flex-1"
            >
              <Usb className="w-4 h-4 mr-2" />
              USB Direct Print
            </Button>
            <Button
              variant="outline"
              onClick={downloadZPLFile}
              disabled={isPrinting || barcodes.length === 0}
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              Download ZPL File
            </Button>
          </div>

          {/* Cancel */}
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
