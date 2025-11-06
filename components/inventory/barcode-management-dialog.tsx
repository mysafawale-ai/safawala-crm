"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Barcode,
  Package,
  Download,
  Printer,
  Plus,
  Search,
  Trash2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  X,
  Sparkles,
  RefreshCw,
  Filter,
} from "lucide-react"
import { toast } from "sonner"
import {
  ProductBarcode,
  getProductBarcodes,
  getBarcodeStats,
  generateBarcodesForProduct,
  updateBarcodeStatus,
  bulkUpdateBarcodeStatus,
  getNextSequenceNumber,
} from "@/lib/barcode-utils"

interface BarcodeManagementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId: string
  productCode: string
  productName: string
  franchiseId: string
}

export function BarcodeManagementDialog({
  open,
  onOpenChange,
  productId,
  productCode,
  productName,
  franchiseId,
}: BarcodeManagementDialogProps) {
  const [loading, setLoading] = useState(false)
  const [barcodes, setBarcodes] = useState<ProductBarcode[]>([])
  const [filteredBarcodes, setFilteredBarcodes] = useState<ProductBarcode[]>([])
  const [stats, setStats] = useState({ total: 0, available: 0, inUse: 0, damaged: 0, retired: 0, new: 0 })
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [badgeFilter, setBadgeFilter] = useState<string>("all")
  const [selectedBarcodes, setSelectedBarcodes] = useState<string[]>([])
  const [generateQuantity, setGenerateQuantity] = useState("10")
  const [nextSequence, setNextSequence] = useState(1)

  useEffect(() => {
    if (open) {
      fetchBarcodes()
      fetchStats()
      fetchNextSequence()
    }
  }, [open, productId])

  useEffect(() => {
    filterBarcodes()
  }, [barcodes, searchTerm, statusFilter, badgeFilter])

  const fetchBarcodes = async () => {
    setLoading(true)
    const result = await getProductBarcodes(productId)
    if (result.success && result.barcodes) {
      setBarcodes(result.barcodes)
    } else {
      toast.error("Failed to load barcodes")
    }
    setLoading(false)
  }

  const fetchStats = async () => {
    const newStats = await getBarcodeStats(productId)
    setStats(newStats)
  }

  const fetchNextSequence = async () => {
    const next = await getNextSequenceNumber(productId)
    setNextSequence(next)
  }

  const filterBarcodes = () => {
    let filtered = barcodes

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((b) =>
        b.barcode_number.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply status filter (Physical condition)
    if (statusFilter !== "all") {
      filtered = filtered.filter((b) => b.status === statusFilter)
    }

    // Apply badge filter (Usage state)
    if (badgeFilter !== "all") {
      if (badgeFilter === "new") {
        filtered = filtered.filter((b) => b.is_new)
      } else if (badgeFilter === "in_use") {
        filtered = filtered.filter((b) => b.status === "in_use")
      }
    }

    setFilteredBarcodes(filtered)
  }

  const handleGenerateBarcodes = async () => {
    const qty = parseInt(generateQuantity)
    if (isNaN(qty) || qty < 1 || qty > 1000) {
      toast.error("Please enter a valid quantity (1-1000)")
      return
    }

    setLoading(true)
    const result = await generateBarcodesForProduct(productId, productCode, franchiseId, qty, nextSequence)
    
    if (result.success) {
      toast.success(`Generated ${qty} new barcodes successfully`)
      await fetchBarcodes()
      await fetchStats()
      await fetchNextSequence()
      setGenerateQuantity("10")
    } else {
      toast.error(result.error || "Failed to generate barcodes")
    }
    setLoading(false)
  }

  const handleSelectAll = () => {
    if (selectedBarcodes.length === filteredBarcodes.length) {
      setSelectedBarcodes([])
    } else {
      setSelectedBarcodes(filteredBarcodes.map((b) => b.id))
    }
  }

  const handleSelectBarcode = (barcodeId: string) => {
    setSelectedBarcodes((prev) =>
      prev.includes(barcodeId)
        ? prev.filter((id) => id !== barcodeId)
        : [...prev, barcodeId]
    )
  }

  const handleBulkStatusChange = async (status: 'available' | 'damaged' | 'retired' | 'in_use') => {
    if (selectedBarcodes.length === 0) {
      toast.error("Please select at least one barcode")
      return
    }

    setLoading(true)
    const result = await bulkUpdateBarcodeStatus(selectedBarcodes, status)
    
    if (result.success) {
      toast.success(`Updated ${selectedBarcodes.length} barcodes to ${status}`)
      setSelectedBarcodes([])
      await fetchBarcodes()
      await fetchStats()
    } else {
      toast.error(result.error || "Failed to update barcodes")
    }
    setLoading(false)
  }

  const handleDownloadSelected = () => {
    if (selectedBarcodes.length === 0) {
      toast.error("Please select at least one barcode")
      return
    }
    
    const selectedBarcodesData = barcodes.filter((b) => selectedBarcodes.includes(b.id))
    downloadBarcodesAsPDF(selectedBarcodesData)
  }

  const handleDownloadFiltered = () => {
    if (filteredBarcodes.length === 0) {
      toast.error("No barcodes to download")
      return
    }
    
    downloadBarcodesAsPDF(filteredBarcodes)
  }

  const downloadBarcodesAsPDF = async (barcodesToDownload: ProductBarcode[]) => {
    try {
      // Dynamically import jsPDF
      const { default: jsPDF } = await import('jspdf')
      const JsBarcode = (await import('jsbarcode')).default
      
      // Optimized for Zebra ZD230 Thermal Printer (4" width at 203 dpi)
      // 2 columns × 2 rows per page (4 barcodes per label sheet)
      const pageWidthMM = 101.6 // 4 inches = 101.6 mm
      const pageHeightMM = 152.4 // 6 inches = 152.4 mm (standard thermal label height)
      
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [pageWidthMM, pageHeightMM]
      })
      
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 2
      const barcodeWidth = 42 // Each barcode ~1.6" wide
      const barcodeHeight = 20 // Slightly reduced for 6 rows
      const cols = 2 // 2 columns for 4" width
      const rows = 6 // 6 rows = 12 barcodes per label (better spacing)
      const spacingX = (pageWidth - 2 * margin) / cols
      const spacingY = (pageHeight - 2 * margin) / rows
      
      let currentPage = 0
      let currentRow = 0
      let currentCol = 0
      
      for (let i = 0; i < barcodesToDownload.length; i++) {
        const barcode = barcodesToDownload[i]
        
        // Create new page if needed
        if (i > 0 && i % (cols * rows) === 0) {
          doc.addPage()
          currentRow = 0
          currentCol = 0
        }
        
        // Calculate position - CENTER within each cell
        const cellWidth = spacingX
        const x = margin + currentCol * spacingX + (cellWidth - barcodeWidth) / 2
        const y = margin + currentRow * spacingY
        
        // Create high-resolution canvas for barcode
        const canvas = document.createElement('canvas')
        // Set higher resolution for better quality
        const scale = 3 // 3x resolution for crisp barcodes
        canvas.width = 800 * scale
        canvas.height = 200 * scale
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.scale(scale, scale)
        }
        
        try {
          JsBarcode(canvas, barcode.barcode_number, {
            format: 'CODE128',
            width: 4, // Increased from 2 for thicker, clearer bars
            height: 120, // Increased from 50 for better scanning
            displayValue: true,
            fontSize: 28, // Increased from 12 for better readability
            margin: 10,
            fontOptions: 'bold',
            textMargin: 5
          })
          
          // Add barcode image to PDF with higher quality
          const imgData = canvas.toDataURL('image/png', 1.0) // Maximum quality
          doc.addImage(imgData, 'PNG', x, y, barcodeWidth, barcodeHeight, undefined, 'FAST')
          
          // Add product name ABOVE barcode for better paper optimization
          doc.setFontSize(3.6) // Reduced by 0.8x (was 4.5pt, now 3.6pt)
          doc.setFont('helvetica', 'bold')
          doc.text(productName.substring(0, 30), x + barcodeWidth / 2, y - 2, { align: 'center', maxWidth: barcodeWidth + 2 })
          doc.setFont('helvetica', 'normal')
        } catch (err) {
          console.error('Error generating barcode:', err)
        }
        
        // Move to next position
        currentCol++
        if (currentCol >= cols) {
          currentCol = 0
          currentRow++
        }
      }
      
      // Download PDF
      const filename = `${productCode}-barcodes-${new Date().toISOString().split('T')[0]}.pdf`
      doc.save(filename)
      
      toast.success(`Downloaded ${barcodesToDownload.length} barcodes as PDF`)
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Failed to generate PDF. Please try again.')
    }
  }

  const handlePrintCompact2Column = async () => {
    if (filteredBarcodes.length === 0) {
      toast.error("No barcodes to print")
      return
    }

    try {
      const printWindow = window.open("", "_blank")
      if (printWindow) {
        // Generate compact 2-column layout with attached rows
        let barcodeHTML = ""

        for (let i = 0; i < filteredBarcodes.length; i += 2) {
          const barcode1 = filteredBarcodes[i]
          const barcode2 = i + 1 < filteredBarcodes.length ? filteredBarcodes[i + 1] : null
          
          // Generate barcode images
          const JsBarcode = (await import('jsbarcode')).default
          const canvas1 = document.createElement('canvas')
          canvas1.width = 800
          canvas1.height = 200
          JsBarcode(canvas1, barcode1.barcode_number, {
            format: 'CODE128',
            width: 2,
            height: 50,
            displayValue: false,
            margin: 0,
          })
          const barcodeImage1 = canvas1.toDataURL('image/png')

          let barcodeImage2 = null
          if (barcode2) {
            const canvas2 = document.createElement('canvas')
            canvas2.width = 800
            canvas2.height = 200
            JsBarcode(canvas2, barcode2.barcode_number, {
              format: 'CODE128',
              width: 2,
              height: 50,
              displayValue: false,
              margin: 0,
            })
            barcodeImage2 = canvas2.toDataURL('image/png')
          }

          // Row with 2 columns, no gaps, attached together
          barcodeHTML += `
            <div class="barcode-row" style="display: flex; margin: 0; padding: 0; border-bottom: 2px solid #333; height: 140px;">
              <div class="barcode-column" style="flex: 1; border-right: 2px solid #333; padding: 12px 10px; text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                <img src="${barcodeImage1}" alt="Barcode" style="width: 90%; height: auto; max-height: 50%; display: block; margin-bottom: 6px;" />
                <div style="font-family: 'Courier New', monospace; font-size: 10px; font-weight: 700; margin: 0; line-height: 1;">
                  ${barcode1.barcode_number}
                </div>
                <div style="font-family: Arial, sans-serif; font-size: 7px; color: #333; margin-top: 2px; line-height: 1;">
                  ${productName}
                </div>
              </div>
              ${barcode2 ? `
              <div class="barcode-column" style="flex: 1; padding: 12px 10px; text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                <img src="${barcodeImage2}" alt="Barcode" style="width: 90%; height: auto; max-height: 50%; display: block; margin-bottom: 6px;" />
                <div style="font-family: 'Courier New', monospace; font-size: 10px; font-weight: 700; margin: 0; line-height: 1;">
                  ${barcode2.barcode_number}
                </div>
                <div style="font-family: Arial, sans-serif; font-size: 7px; color: #333; margin-top: 2px; line-height: 1;">
                  ${productName}
                </div>
              </div>
              ` : `
              <div class="barcode-column" style="flex: 1; padding: 12px 10px;"></div>
              `}
            </div>
          `
        }

        printWindow.document.write(`
        <html>
          <head>
            <title>Barcodes - 2 Column Print</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              html, body { margin: 0; padding: 0; width: 100%; height: 100%; }
              @page { margin: 0; padding: 0; size: A4; }
              body { font-family: Arial, sans-serif; background: white; margin: 0; padding: 0; }
              .barcode-row { display: flex; margin: 0; padding: 0; border-bottom: 2px solid #333; height: 140px; page-break-inside: avoid; }
              .barcode-column { flex: 1; padding: 12px 10px; text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center; border-right: 2px solid #333; }
              .barcode-column:last-child { border-right: none; }
              @media print { html, body { margin: 0; padding: 0; } body { margin: 0; padding: 0; } .barcode-row { page-break-inside: avoid; } }
            </style>
          </head>
          <body>
            ${barcodeHTML}
          </body>
        </html>
        `)
        printWindow.document.close()
        
        setTimeout(() => {
          printWindow.print()
          printWindow.close()
        }, 500)

        toast.success(`Prepared ${filteredBarcodes.length} barcodes for printing (2-column layout)`)
      }
    } catch (error) {
      console.error("Error printing barcodes:", error)
      toast.error("Failed to prepare barcodes for printing")
    }
  }

  const handlePrint2x5Layout = async () => {
    try {
      const selectedBarcodesData = barcodes.filter((b) => selectedBarcodes.includes(b.id)).slice(0, 10)
      
      if (selectedBarcodesData.length === 0) {
        toast.error("No barcodes selected")
        return
      }

      const JsBarcode = (await import('jsbarcode')).default

      // Generate barcode images
      const barcodeImages: string[] = []
      for (let i = 0; i < selectedBarcodesData.length; i++) {
        const canvas = document.createElement('canvas')
        canvas.width = 800
        canvas.height = 200
        JsBarcode(canvas, selectedBarcodesData[i].barcode_number, {
          format: 'CODE128',
          width: 2,
          height: 50,
          displayValue: false,
          margin: 0,
        })
        barcodeImages[i] = canvas.toDataURL('image/png')
      }

      // Generate HTML with 2 columns × 5 rows layout
      let barcodeHTML = ''

      for (let rowIdx = 0; rowIdx < 5; rowIdx++) {
        barcodeHTML += `
          <div class="barcode-row">
            ${generatePrintRowColumn(0 + rowIdx * 2, barcodeImages, selectedBarcodesData, productName)}
            ${generatePrintRowColumn(1 + rowIdx * 2, barcodeImages, selectedBarcodesData, productName)}
          </div>
        `
      }

      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Barcode Print - 2x5 Layout</title>
              <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                html, body { margin: 0; padding: 0; width: 100%; height: 100%; }
                @page { margin: 0; padding: 0; size: A4; }
                body { font-family: Arial, sans-serif; background: white; margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
                .container { width: 100%; padding: 20px; display: flex; justify-content: center; }
                .barcode-grid { width: fit-content; }
                .barcode-row {
                  display: flex;
                  margin: 0;
                  padding: 0;
                  border-bottom: 1px solid #333;
                  height: 100px;
                  page-break-inside: avoid;
                }
                .barcode-row:last-child {
                  border-bottom: 1px solid #333;
                }
                .barcode-column {
                  flex: 1;
                  width: 200px;
                  padding: 8px 6px;
                  text-align: center;
                  display: flex;
                  flex-direction: column;
                  justify-content: center;
                  align-items: center;
                  border-right: 1px solid #333;
                }
                .barcode-column:last-child {
                  border-right: none;
                }
                .barcode-image {
                  width: 80%;
                  height: auto;
                  max-height: 40%;
                  display: block;
                  margin-bottom: 4px;
                }
                .barcode-code {
                  font-family: 'Courier New', monospace;
                  font-size: 8px;
                  font-weight: 700;
                  margin: 0;
                  line-height: 1;
                }
                .barcode-name {
                  font-family: Arial, sans-serif;
                  font-size: 5px;
                  color: #333;
                  margin-top: 1px;
                  line-height: 1;
                  word-break: break-word;
                  max-width: 100%;
                }
                @media print {
                  html, body { margin: 0; padding: 0; display: block; }
                  body { padding: 20px; }
                  .container { padding: 0; }
                  .barcode-row { page-break-inside: avoid; }
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="barcode-grid">
                  ${barcodeHTML}
                </div>
              </div>
            </body>
          </html>
        `)
        printWindow.document.close()

        setTimeout(() => {
          printWindow.print()
        }, 500)

        toast.success(`Print preview opened for ${selectedBarcodesData.length} barcodes`)
      }
    } catch (error) {
      console.error("Error generating print layout:", error)
      toast.error("Failed to generate print layout")
    }
  }

  const handleDownload2x5PDF = async () => {
    try {
      const selectedBarcodesData = barcodes.filter((b) => selectedBarcodes.includes(b.id)).slice(0, 10)
      
      if (selectedBarcodesData.length === 0) {
        toast.error("No barcodes selected")
        return
      }

      const { default: jsPDF } = await import('jspdf')
      const JsBarcode = (await import('jsbarcode')).default

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'A4'
      })

      const pageWidth = doc.internal.pageSize.getWidth() // 210mm
      const pageHeight = doc.internal.pageSize.getHeight() // 297mm
      const cols = 2
      const rows = 5
      
      // Calculate dimensions for smaller, centered layout
      const barcodeWidth = 50 // Reduced from ~80mm
      const barcodeHeight = 20 // Reduced from ~30mm
      const totalWidth = barcodeWidth * cols // 100mm
      const totalHeight = barcodeHeight * rows // 100mm
      
      // Center on page
      const startX = (pageWidth - totalWidth) / 2
      const startY = (pageHeight - totalHeight) / 2
      const colWidth = barcodeWidth
      const rowHeight = barcodeHeight

      let barcodeIndex = 0

      for (let rowIdx = 0; rowIdx < rows; rowIdx++) {
        for (let colIdx = 0; colIdx < cols; colIdx++) {
          if (barcodeIndex >= selectedBarcodesData.length) break

          const barcode = selectedBarcodesData[barcodeIndex]
          const x = startX + colIdx * colWidth
          const y = startY + rowIdx * rowHeight

          // Generate barcode
          const canvas = document.createElement('canvas')
          const scale = 2
          canvas.width = 400 * scale
          canvas.height = 100 * scale
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.scale(scale, scale)
          }

          JsBarcode(canvas, barcode.barcode_number, {
            format: 'CODE128',
            width: 1.5,
            height: 30,
            displayValue: false,
            margin: 0,
          })

          // Add barcode to PDF
          const imgData = canvas.toDataURL('image/png')
          const imgWidth = colWidth - 2
          const imgHeight = 10

          doc.addImage(
            imgData,
            'PNG',
            x + 1,
            y + 2,
            imgWidth,
            imgHeight,
            undefined,
            'FAST'
          )

          // Add barcode code
          doc.setFontSize(6)
          doc.setFont('courier', 'bold')
          doc.text(barcode.barcode_number, x + colWidth / 2, y + 13, { align: 'center' })

          // Add product name
          doc.setFontSize(4)
          doc.setFont('helvetica', 'normal')
          const maxWidth = colWidth - 2
          doc.text(productName.substring(0, 20), x + colWidth / 2, y + 17, {
            align: 'center',
            maxWidth
          })

          // Add thin borders
          doc.setDrawColor(150, 150, 150)
          doc.setLineWidth(0.2)
          doc.rect(x, y, colWidth, rowHeight)

          barcodeIndex++
        }
      }

      const filename = `${productCode}-barcodes-2x5-${new Date().toISOString().split('T')[0]}.pdf`
      doc.save(filename)

      toast.success('PDF downloaded successfully')
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast.error("Failed to generate PDF")
    }
  }

  const getStatusBadge = (barcode: ProductBarcode) => {
    // Status represents physical condition
    switch (barcode.status) {
      case "available":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" /> Available
        </Badge>
      case "damaged":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <AlertTriangle className="w-3 h-3 mr-1" /> Damaged
        </Badge>
      case "retired":
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
          <XCircle className="w-3 h-3 mr-1" /> Retired
        </Badge>
      case "in_use":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <Package className="w-3 h-3 mr-1" /> In Use
        </Badge>
    }
  }

  const getUsageBadge = (barcode: ProductBarcode) => {
    // Badge represents temporary usage state
    const badges = []
    
    if (barcode.status === "in_use") {
      badges.push(
        <Badge key="in-use" variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <Package className="w-3 h-3 mr-1" /> In Use
        </Badge>
      )
    }
    
    if (barcode.is_new) {
      badges.push(
        <Badge key="new" variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
          <Sparkles className="w-3 h-3 mr-1" /> NEW
        </Badge>
      )
    }
    
    return badges.length > 0 ? <div className="flex gap-1">{badges}</div> : <span className="text-muted-foreground">-</span>
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Barcode className="w-5 h-5" />
            Barcode Management: {productName}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="list">Barcode List</TabsTrigger>
            <TabsTrigger value="print-2x5">Print 2×5</TabsTrigger>
            <TabsTrigger value="generate">Generate More</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 overflow-y-auto flex-1">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Barcodes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Available
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{stats.available}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Package className="w-4 h-4 text-blue-600" />
                    In Use
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{stats.inUse}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    Damaged
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-600">{stats.damaged}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <XCircle className="w-4 h-4 text-gray-600" />
                    Retired
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-600">{stats.retired}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    New
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">{stats.new}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Download barcodes by status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    setStatusFilter("available")
                    setTimeout(() => handleDownloadFiltered(), 100)
                  }}
                  disabled={stats.available === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download All Available ({stats.available})
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    setStatusFilter("new")
                    setTimeout(() => handleDownloadFiltered(), 100)
                  }}
                  disabled={stats.new === 0}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Download New Only ({stats.new})
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    setStatusFilter("all")
                    setTimeout(() => handleDownloadFiltered(), 100)
                  }}
                  disabled={stats.total === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download All Barcodes ({stats.total})
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start bg-blue-50 hover:bg-blue-100 border-blue-200"
                  onClick={() => {
                    setStatusFilter("all")
                    setTimeout(() => handlePrintCompact2Column(), 100)
                  }}
                  disabled={stats.total === 0}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print 2-Column Layout ({stats.total})
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* List Tab */}
          <TabsContent value="list" className="space-y-4 overflow-y-auto flex-1">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search barcodes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={5}>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="available">🟢 Available</SelectItem>
                  <SelectItem value="damaged">🟡 Damaged</SelectItem>
                  <SelectItem value="retired">⚫ Retired</SelectItem>
                </SelectContent>
              </Select>

              <Select value={badgeFilter} onValueChange={setBadgeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Badge" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={5}>
                  <SelectItem value="all">All Badges</SelectItem>
                  <SelectItem value="in_use">🔵 In Use</SelectItem>
                  <SelectItem value="new">✨ New</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => {
                  setStatusFilter("all")
                  setBadgeFilter("all")
                  setSearchTerm("")
                }}
                title="Clear all filters"
              >
                <X className="w-4 h-4" />
              </Button>

              <Button variant="outline" size="icon" onClick={fetchBarcodes} disabled={loading} title="Refresh">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {selectedBarcodes.length > 0 && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {selectedBarcodes.length} barcode(s) selected
                    </span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={handleDownloadSelected}>
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleBulkStatusChange('available')}>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Mark Available
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleBulkStatusChange('in_use')}>
                        <Package className="w-4 h-4 mr-1" />
                        Mark In Use
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleBulkStatusChange('damaged')}>
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        Mark Damaged
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleBulkStatusChange('retired')}>
                        <XCircle className="w-4 h-4 mr-1" />
                        Retire
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedBarcodes.length === filteredBarcodes.length && filteredBarcodes.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Barcode</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Badge</TableHead>
                    <TableHead>Booking Info</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Used</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Loading barcodes...
                      </TableCell>
                    </TableRow>
                  ) : filteredBarcodes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No barcodes found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBarcodes.map((barcode) => (
                      <TableRow key={barcode.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedBarcodes.includes(barcode.id)}
                            onCheckedChange={() => handleSelectBarcode(barcode.id)}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-sm font-semibold">{barcode.barcode_number}</TableCell>
                        <TableCell>{getStatusBadge(barcode)}</TableCell>
                        <TableCell>{getUsageBadge(barcode)}</TableCell>
                        <TableCell className="text-sm">
                          {barcode.status === 'in_use' && barcode.booking_number ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <Package className="h-3 w-3 text-blue-600" />
                                <span className="font-medium text-blue-600">{barcode.booking_number}</span>
                              </div>
                              {barcode.customer_name && (
                                <div className="text-xs text-muted-foreground">
                                  👤 {barcode.customer_name}
                                </div>
                              )}
                              {barcode.event_date && (
                                <div className="text-xs text-muted-foreground">
                                  📅 {new Date(barcode.event_date).toLocaleDateString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric'
                                  })}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(barcode.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {barcode.last_used_at ? new Date(barcode.last_used_at).toLocaleDateString() : 'Never'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Print 2x5 Tab */}
          <TabsContent value="print-2x5" className="space-y-4 overflow-y-auto flex-1">
            <Card>
              <CardHeader>
                <CardTitle>Print 2 Columns × 5 Rows Layout</CardTitle>
                <CardDescription>
                  Select up to 10 barcodes to print in a compact 2×5 layout
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label>Select Barcodes to Print (Max 10)</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                    {filteredBarcodes.slice(0, 20).map((barcode, idx) => (
                      <div key={barcode.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`print-select-${barcode.id}`}
                          checked={selectedBarcodes.includes(barcode.id)}
                          onCheckedChange={() => {
                            if (selectedBarcodes.length >= 10 && !selectedBarcodes.includes(barcode.id)) {
                              toast.error("Maximum 10 barcodes allowed")
                              return
                            }
                            handleSelectBarcode(barcode.id)
                          }}
                        />
                        <Label
                          htmlFor={`print-select-${barcode.id}`}
                          className="text-sm cursor-pointer flex-1"
                        >
                          <span className="font-mono font-bold">{barcode.barcode_number}</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Selected: {selectedBarcodes.length} / 10
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button
                    onClick={async () => {
                      if (selectedBarcodes.length === 0) {
                        toast.error("Please select at least one barcode")
                        return
                      }
                      await handlePrint2x5Layout()
                    }}
                    size="lg"
                    className="w-full"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Open Print Preview
                  </Button>
                  <Button
                    onClick={async () => {
                      if (selectedBarcodes.length === 0) {
                        toast.error("Please select at least one barcode")
                        return
                      }
                      await handleDownload2x5PDF()
                    }}
                    size="lg"
                    variant="outline"
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-semibold text-blue-900">ℹ️ Layout Details:</p>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>2 columns × 5 rows = 10 barcodes per page</li>
                    <li>Barcode font: 10px (0.8x)</li>
                    <li>Product name: 7px (0.6x)</li>
                    <li>No gaps between rows for compact printing</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Generate Tab */}
          <TabsContent value="generate" className="space-y-4 overflow-y-auto flex-1">
            <Card>
              <CardHeader>
                <CardTitle>Generate Additional Barcodes</CardTitle>
                <CardDescription>
                  Create new barcodes for this product. Useful when you receive new stock.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Current Total Barcodes</Label>
                  <div className="text-2xl font-bold">{stats.total}</div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Number of Barcodes to Generate</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max="1000"
                    value={generateQuantity}
                    onChange={(e) => setGenerateQuantity(e.target.value)}
                    placeholder="Enter quantity"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    New barcodes will be numbered from <strong>{productCode}-{nextSequence.toString().padStart(3, '0')}</strong> to{' '}
                    <strong>{productCode}-{(nextSequence + parseInt(generateQuantity || '0') - 1).toString().padStart(3, '0')}</strong>
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleGenerateBarcodes} disabled={loading} className="flex-1">
                    <Plus className="w-4 h-4 mr-2" />
                    {loading ? 'Generating...' : 'Generate Barcodes'}
                  </Button>
                  <Button variant="outline" onClick={() => setGenerateQuantity("10")}>
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

function generatePrintRowColumn(
  index: number,
  barcodeImages: string[],
  barcodes: ProductBarcode[],
  productName?: string
): string {
  if (index >= barcodes.length || !barcodes[index].barcode_number) {
    return `
      <div class="barcode-column" style="flex: 1; padding: 12px 10px; border-right: 2px solid #333;">
      </div>
    `
  }

  return `
    <div class="barcode-column">
      ${
        barcodeImages[index]
          ? `<img src="${barcodeImages[index]}" alt="Barcode" class="barcode-image" />`
          : ''
      }
      <div class="barcode-code">${barcodes[index].barcode_number}</div>
      <div class="barcode-name">${productName || 'Product'}</div>
    </div>
  `
}
