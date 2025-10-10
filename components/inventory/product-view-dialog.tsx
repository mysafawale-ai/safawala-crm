"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Package,
  Barcode,
  Printer,
  Download,
  Archive,
  AlertTriangle,
  CheckCircle,
  FileText,
  ImageIcon,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { generateBarcode } from "@/lib/barcode-generator"
// Fixed import path for ProductItemService
import { ProductItemService } from "@/lib/services/product-item-service"

interface Product {
  id: string
  product_code: string
  name: string
  description?: string
  brand?: string
  size?: string
  color?: string
  material?: string
  price: number
  rental_price: number
  cost_price: number
  security_deposit: number
  stock_total: number
  stock_available: number
  stock_booked: number
  stock_damaged: number
  stock_in_laundry: number
  reorder_level: number
  usage_count: number
  damage_count: number
  barcode?: string
  qr_code?: string
  is_active: boolean
  created_at: string
  updated_at: string
  category_id?: string
  subcategory_id?: string
  image_url?: string // Added image_url field
}

interface ProductViewDialogProps {
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProductViewDialog({ product, open, onOpenChange }: ProductViewDialogProps) {
  const [printing, setPrinting] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [downloadingPDF, setDownloadingPDF] = useState(false)
  const [generatedBarcode, setGeneratedBarcode] = useState<string>("")
  const [itemBarcodes, setItemBarcodes] = useState<
    Array<{
      id: string
      item_code: string
      barcode: string
      status: string
    }>
  >([])
  const [loadingItems, setLoadingItems] = useState(false)
  const [showAllBarcodes, setShowAllBarcodes] = useState(false)

  useEffect(() => {
    if (open && product) {
      loadItemBarcodes()
    }
  }, [open, product])

  if (!product) return null

  const handlePrintBarcode = async () => {
    setPrinting(true)
    try {
      const barcodeToUse =
        generatedBarcode ||
        (product.barcode?.startsWith("data:image")
          ? product.barcode
          : generateBarcode(product.barcode || product.product_code))

      const printWindow = window.open("", "_blank")
      if (printWindow) {
        printWindow.document.write(`
        <html>
          <head>
            <title>Print Barcode - ${product.name}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                text-align: center; 
                padding: 20px;
                margin: 0;
              }
              .barcode-container {
                border: 1px solid #ccc;
                padding: 20px;
                margin: 20px auto;
                width: fit-content;
                background: white;
              }
              .product-info {
                margin-bottom: 15px;
              }
              .product-name {
                font-size: 16px;
                font-weight: bold;
                margin-bottom: 5px;
              }
              .product-code {
                font-family: monospace;
                font-size: 14px;
                color: #666;
              }
              img {
                max-width: 100%;
                height: auto;
              }
              @media print {
                body { margin: 0; padding: 10px; }
                .barcode-container { border: none; margin: 0; }
              }
            </style>
          </head>
          <body>
            <div class="barcode-container">
              <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-code">${product.product_code}</div>
              </div>
              <img src="${barcodeToUse}" alt="Barcode for ${product.name}" />
            </div>
          </body>
        </html>
      `)
        printWindow.document.close()
        printWindow.print()
        printWindow.close()
      }
      toast({
        title: "Success",
        description: "Barcode sent to printer",
      })
    } catch (error) {
      console.error("Error printing barcode:", error)
      toast({
        title: "Error",
        description: "Failed to print barcode",
        variant: "destructive",
      })
    } finally {
      setPrinting(false)
    }
  }

  const handleDownloadBarcode = async () => {
    setDownloading(true)
    try {
      const barcodeDataURL =
        generatedBarcode ||
        (product.barcode?.startsWith("data:image")
          ? product.barcode
          : generateBarcode(product.barcode || product.product_code))

      const link = document.createElement("a")
      link.href = barcodeDataURL
      link.download = `barcode-${product.name.replace(/[^a-zA-Z0-9]/g, "_")}-${product.product_code}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Success",
        description: `Barcode downloaded: ${product.name} (${product.product_code})`,
      })
    } catch (error) {
      console.error("Error downloading barcode:", error)
      toast({
        title: "Error",
        description: "Failed to download barcode",
        variant: "destructive",
      })
    } finally {
      setDownloading(false)
    }
  }

  const handleGenerateBarcode = async () => {
    try {
      const barcodeDataURL = generateBarcode(product.product_code)
      setGeneratedBarcode(barcodeDataURL)

      const { error } = await supabase.from("products").update({ barcode: product.product_code }).eq("id", product.id)

      if (error) {
        console.error("Error saving barcode:", error)
        toast({
          title: "Error",
          description: "Failed to save barcode to database",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: "Barcode generated and saved successfully!",
        })
      }
    } catch (error) {
      console.error("Error generating barcode:", error)
      toast({
        title: "Error",
        description: "Failed to generate barcode",
        variant: "destructive",
      })
    }
  }

  // Fixed barcode generation to use correct generateBarcode function
  const loadItemBarcodes = async () => {
    setLoadingItems(true)
    try {
      const items = await ProductItemService.getProductItems(product.id)
      const itemsWithBarcodes = await Promise.all(
        items.map(async (item) => {
          try {
            const barcodeDataUrl = generateBarcode(item.item_code)
            return {
              ...item,
              barcode: barcodeDataUrl,
            }
          } catch (error) {
            console.error(`Error generating barcode for ${item.item_code}:`, error)
            return {
              ...item,
              barcode: "", // Will fallback to placeholder
            }
          }
        }),
      )
      setItemBarcodes(itemsWithBarcodes)
    } catch (error) {
      console.error("Error loading item barcodes:", error)
      toast({
        title: "Error",
        description: "Failed to load item barcodes",
        variant: "destructive",
      })
    } finally {
      setLoadingItems(false)
    }
  }

  const downloadBarcodesAsPDF = async () => {
    setDownloadingPDF(true)
    try {
      // Dynamic import of jsPDF to avoid SSR issues
      const { jsPDF } = await import("jspdf")

      if (itemBarcodes.length === 0) {
        toast({
          title: "No Barcodes",
          description: "No item barcodes available to download",
          variant: "destructive",
        })
        return
      }

      const pdf = new jsPDF("p", "mm", "a4")
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()

      // Configuration
      const margin = 10
      const barcodeWidth = 60
      const barcodeHeight = 20
      const textHeight = 8
      const itemHeight = barcodeHeight + textHeight + 5
      const itemsPerRow = Math.floor((pageWidth - 2 * margin) / (barcodeWidth + 5))
      const itemsPerPage = Math.floor((pageHeight - 2 * margin - 20) / itemHeight) * itemsPerRow

      // Add title
      pdf.setFontSize(16)
      pdf.setFont("helvetica", "bold")
      pdf.text(`${product.name} - Item Barcodes`, margin, margin + 10)

      pdf.setFontSize(10)
      pdf.setFont("helvetica", "normal")
      pdf.text(`Product Code: ${product.product_code}`, margin, margin + 18)
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, margin, margin + 25)

      let currentPage = 1
      let yPosition = margin + 35

      for (let i = 0; i < itemBarcodes.length; i++) {
        const item = itemBarcodes[i]
        const row = Math.floor((i % itemsPerPage) / itemsPerRow)
        const col = (i % itemsPerPage) % itemsPerRow

        // Check if we need a new page
        if (i > 0 && i % itemsPerPage === 0) {
          pdf.addPage()
          currentPage++
          yPosition = margin + 10
        }

        const xPosition = margin + col * (barcodeWidth + 5)
        const currentYPosition = yPosition + row * itemHeight

        // Add barcode image if available
        if (item.barcode && item.barcode.startsWith("data:image")) {
          try {
            pdf.addImage(item.barcode, "PNG", xPosition, currentYPosition, barcodeWidth, barcodeHeight)
          } catch (error) {
            console.error(`Error adding barcode image for ${item.item_code}:`, error)
            // Draw a placeholder rectangle if image fails
            pdf.rect(xPosition, currentYPosition, barcodeWidth, barcodeHeight)
            pdf.text("Barcode Error", xPosition + 5, currentYPosition + 10)
          }
        } else {
          // Draw placeholder rectangle
          pdf.rect(xPosition, currentYPosition, barcodeWidth, barcodeHeight)
          pdf.text("No Barcode", xPosition + 5, currentYPosition + 10)
        }

        // Add serial code below barcode
        pdf.setFontSize(8)
        pdf.setFont("helvetica", "normal")
        const textX = xPosition + barcodeWidth / 2
        pdf.text(item.item_code, textX, currentYPosition + barcodeHeight + 5, { align: "center" })

        // Add status
        pdf.setFontSize(6)
        pdf.text(item.status.toUpperCase(), textX, currentYPosition + barcodeHeight + 10, { align: "center" })
      }

      // Add page numbers
      const totalPages = Math.ceil(itemBarcodes.length / itemsPerPage)
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i)
        pdf.setFontSize(8)
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 20, pageHeight - 5)
      }

      // Save the PDF
      const fileName = `${product.name.replace(/[^a-zA-Z0-9]/g, "_")}_barcodes_${new Date().toISOString().split("T")[0]}.pdf`
      pdf.save(fileName)

      toast({
        title: "Success",
        description: `PDF downloaded: ${itemBarcodes.length} barcodes`,
      })
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDownloadingPDF(false)
    }
  }

  const getStockStatus = () => {
    if (product.stock_available <= 0) {
      return { label: "Out of Stock", color: "destructive", icon: AlertTriangle }
    } else if (product.stock_available <= product.reorder_level) {
      return { label: "Low Stock", color: "warning", icon: AlertTriangle }
    } else {
      return { label: "In Stock", color: "success", icon: CheckCircle }
    }
  }

  const stockStatus = getStockStatus()
  const StockIcon = stockStatus.icon

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>{product.name}</span>
          </DialogTitle>
          <DialogDescription>
            Product Code: {product.product_code} • Created: {new Date(product.created_at).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Basic Information */}
          <div className="lg:col-span-2 space-y-6">
            {product.image_url && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <ImageIcon className="h-4 w-4" />
                    <span>Product Image</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center">
                    <img
                      src={product.image_url || "/placeholder.svg"}
                      alt={product.name}
                      className="max-w-full h-auto max-h-64 rounded-lg border object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = "none"
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Product Name</label>
                    <p className="font-medium">{product.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Product Code</label>
                    <p className="font-mono">{product.product_code}</p>
                  </div>
                  {product.brand && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Brand</label>
                      <p>{product.brand}</p>
                    </div>
                  )}
                  {product.size && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Size</label>
                      <p>{product.size}</p>
                    </div>
                  )}
                </div>
                {product.description && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Description</label>
                    <p className="text-sm">{product.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stock Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Archive className="h-4 w-4" />
                  <span>Stock Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Stock Status</span>
                    <Badge variant={stockStatus.color as any} className="flex items-center space-x-1">
                      <StockIcon className="h-3 w-3" />
                      <span>{stockStatus.label}</span>
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Total Stock</label>
                      <p className="text-lg font-semibold">{product.stock_total}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Available</label>
                      <p className="text-lg font-semibold text-green-600">{product.stock_available}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Booked</label>
                      <p className="text-lg font-semibold text-blue-600">{product.stock_booked}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Damaged</label>
                      <p className="text-lg font-semibold text-red-600">{product.stock_damaged}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Barcode & QR Code */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Barcode className="h-4 w-4" />
                  <span>Barcode & QR Code</span>
                </CardTitle>
                <CardDescription>Auto-generated product identifiers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(product.barcode && product.barcode.startsWith("data:image")) || generatedBarcode ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Barcode</label>
                      <div className="border rounded-lg p-4 bg-white mt-2 flex items-center justify-center min-h-[100px]">
                        <img
                          src={
                            generatedBarcode ||
                            (product.barcode?.startsWith("data:image")
                              ? product.barcode
                              : generateBarcode(product.barcode || product.product_code)) ||
                            "/placeholder.svg"
                          }
                          alt="Product Barcode"
                          className="w-full h-auto max-w-[300px]"
                        />
                      </div>
                      <p className="text-center font-mono text-sm mt-2">{product.product_code}</p>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handlePrintBarcode}
                        disabled={printing}
                        className="flex-1 bg-transparent"
                      >
                        <Printer className="h-4 w-4 mr-1" />
                        {printing ? "Printing..." : "Print"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleDownloadBarcode}
                        disabled={downloading}
                        className="flex-1 bg-transparent"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        {downloading ? "Downloading..." : "Download"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Barcode className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-4">No barcode available</p>
                    <Button size="sm" onClick={handleGenerateBarcode}>
                      <Barcode className="h-4 w-4 mr-2" />
                      Generate Barcode
                    </Button>
                  </div>
                )}

                {/* Individual Item Barcodes */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-muted-foreground">
                      Individual Item Barcodes ({itemBarcodes.length} items)
                    </label>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowAllBarcodes(!showAllBarcodes)}
                        disabled={loadingItems}
                      >
                        {loadingItems ? "Loading..." : showAllBarcodes ? "Hide" : "Show All"}
                      </Button>
                      {itemBarcodes.length > 0 && (
                        <Button size="sm" variant="outline" onClick={downloadBarcodesAsPDF} disabled={downloadingPDF}>
                          <FileText className="h-3 w-3 mr-1" />
                          {downloadingPDF ? "Generating..." : "PDF"}
                        </Button>
                      )}
                    </div>
                  </div>

                  {showAllBarcodes && (
                    <div className="space-y-3">
                      {itemBarcodes.length > 0 ? (
                        <div className="max-h-60 overflow-y-auto space-y-2">
                          {itemBarcodes.map((item) => (
                            <div key={item.id} className="flex items-center space-x-3 p-2 border rounded">
                              <img
                                src={item.barcode || "/placeholder.svg"}
                                alt={`Barcode for ${item.item_code}`}
                                className="w-20 h-8 object-contain"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-mono truncate">{item.item_code}</p>
                                <p className="text-xs text-muted-foreground">{item.status}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No individual item barcodes found. Generate bulk barcodes first.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
