"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Palette, Plus, Edit, Trash2, Barcode, Download, Printer, Layers, Upload, X, ImageIcon, Camera } from "lucide-react"
import { toast } from "sonner"
import { generateBarcode, generateBarcodeLabel, generateQRCode } from "@/lib/barcode-generator"

export interface VariationData {
  id?: string
  variation_name: string
  color: string
  design: string
  material: string
  size: string
  sku: string
  price_adjustment: number | string
  rental_price_adjustment: number | string
  stock_total: number
  stock_available: number
  stock_booked: number
  stock_damaged: number
  image_url: string
  barcode?: string
  qr_code?: string
}

interface ProductVariationManagerProps {
  productId: string | null // null when creating a new product (variations saved after product creation)
  franchiseId: string
  readOnly?: boolean
  productName?: string
  productPrice?: number
  // For new products: manage variations in local state before product is saved
  localVariations?: VariationData[]
  onLocalVariationsChange?: (variations: VariationData[]) => void
}

const emptyVariation: VariationData = {
  variation_name: "",
  color: "",
  design: "",
  material: "",
  size: "",
  sku: "",
  price_adjustment: "",
  rental_price_adjustment: "",
  stock_total: 0,
  stock_available: 0,
  stock_booked: 0,
  stock_damaged: 0,
  image_url: "",
}

export function ProductVariationManager({
  productId,
  franchiseId,
  readOnly = false,
  productName,
  productPrice,
  localVariations,
  onLocalVariationsChange,
}: ProductVariationManagerProps) {
  const [variations, setVariations] = useState<VariationData[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [formData, setFormData] = useState<VariationData>({ ...emptyVariation })
  const [barcodeImages, setBarcodeImages] = useState<Record<string, string>>({})
  const [uploadingImage, setUploadingImage] = useState(false)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isLocalMode = !productId

  useEffect(() => {
    if (productId) {
      fetchVariations()
    }
  }, [productId])

  useEffect(() => {
    if (isLocalMode && localVariations) {
      setVariations(localVariations)
    }
  }, [localVariations, isLocalMode])

  // Generate barcode images for display
  useEffect(() => {
    const generateImages = async () => {
      const images: Record<string, string> = {}
      for (const v of variations) {
        if (v.barcode) {
          try {
            images[v.barcode] = generateBarcode(v.barcode)
          } catch {
            // ignore
          }
        }
      }
      setBarcodeImages(images)
    }
    generateImages()
  }, [variations])

  const fetchVariations = async () => {
    if (!productId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/products/${productId}/variations`)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to fetch variations")
      }
      const { data } = await res.json()
      setVariations(
        (data || []).map((v: any) => ({
          id: v.id,
          variation_name: v.variation_name || "",
          color: v.color || "",
          design: v.design || "",
          material: v.material || "",
          size: v.size || "",
          sku: v.sku || "",
          price_adjustment: v.price_adjustment || 0,
          rental_price_adjustment: v.rental_price_adjustment || 0,
          stock_total: v.stock_total || 0,
          stock_available: v.stock_available || 0,
          stock_booked: v.stock_booked || 0,
          stock_damaged: v.stock_damaged || 0,
          image_url: v.image_url || "",
          barcode: v.barcode || "",
          qr_code: v.qr_code || "",
        }))
      )
    } catch (error) {
      console.error("Error fetching variations:", error)
      toast.error("Failed to load variations")
    } finally {
      setLoading(false)
    }
  }

  const handleOpenAdd = () => {
    setEditingIndex(null)
    setFormData({ ...emptyVariation })
    setDialogOpen(true)
  }

  const handleOpenEdit = (index: number) => {
    setEditingIndex(index)
    setFormData({ ...variations[index] })
    setDialogOpen(true)
  }

  const handleSaveVariation = async () => {
    if (!formData.variation_name.trim()) {
      toast.error("Variation name is required")
      return
    }

    setSaving(true)

    try {
      if (isLocalMode) {
        // Local mode: manage in-memory
        const updated = [...variations]
        if (editingIndex !== null) {
          updated[editingIndex] = { ...formData }
        } else {
          updated.push({ ...formData })
        }
        setVariations(updated)
        onLocalVariationsChange?.(updated)
        toast.success(editingIndex !== null ? "Variation updated" : "Variation added")
      } else {
        // DB mode: save via API
        if (editingIndex !== null && variations[editingIndex].id) {
          // Update existing
          const res = await fetch(`/api/products/${productId}/variations`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              variation_id: variations[editingIndex].id,
              variation_name: formData.variation_name.trim(),
              color: formData.color.trim() || null,
              design: formData.design.trim() || null,
              material: formData.material.trim() || null,
              size: formData.size.trim() || null,
              sku: formData.sku.trim() || null,
              price_adjustment: Number(formData.price_adjustment) || 0,
              rental_price_adjustment: Number(formData.rental_price_adjustment) || 0,
              stock_total: formData.stock_total,
              stock_available: formData.stock_available,
              stock_booked: formData.stock_booked,
              stock_damaged: formData.stock_damaged,
              image_url: formData.image_url || null,
            }),
          })
          if (!res.ok) {
            const err = await res.json()
            throw new Error(err.error || "Failed to update variation")
          }
          toast.success("Variation updated")
        } else {
          // Create new
          const res = await fetch(`/api/products/${productId}/variations`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              variation_name: formData.variation_name.trim(),
              color: formData.color.trim() || null,
              design: formData.design.trim() || null,
              material: formData.material.trim() || null,
              size: formData.size.trim() || null,
              sku: formData.sku.trim() || null,
              price_adjustment: Number(formData.price_adjustment) || 0,
              rental_price_adjustment: Number(formData.rental_price_adjustment) || 0,
              stock_total: formData.stock_total,
              stock_available: formData.stock_available,
              stock_booked: formData.stock_booked,
              stock_damaged: formData.stock_damaged,
              image_url: formData.image_url || null,
            }),
          })
          if (!res.ok) {
            const err = await res.json()
            throw new Error(err.error || "Failed to create variation")
          }
          toast.success("Variation added with unique barcode")
        }
        await fetchVariations()
      }
      setDialogOpen(false)
    } catch (error: any) {
      console.error("Error saving variation:", error)
      toast.error(`Failed to save variation: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (index: number) => {
    const variation = variations[index]

    if (isLocalMode) {
      const updated = variations.filter((_, i) => i !== index)
      setVariations(updated)
      onLocalVariationsChange?.(updated)
      toast.success("Variation removed")
      return
    }

    if (!variation.id) return

    try {
      const res = await fetch(`/api/products/${productId}/variations?variation_id=${variation.id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to delete variation")
      }
      toast.success("Variation deleted")
      await fetchVariations()
    } catch (error: any) {
      console.error("Error deleting variation:", error)
      toast.error(`Failed to delete: ${error.message}`)
    }
  }

  const getVariationMRP = (v: VariationData): number | undefined => {
    if (productPrice === undefined) return undefined
    const adj = typeof v.price_adjustment === 'number' ? v.price_adjustment : parseFloat(String(v.price_adjustment)) || 0
    return productPrice + adj
  }

  const handlePrintBarcode = (barcode: string, name: string, variation?: VariationData) => {
    const labelName = productName ? `${productName} | ${name}` : name
    const mrp = variation ? getVariationMRP(variation) : productPrice
    const labelImage = generateBarcodeLabel({ barcodeText: barcode, variationName: labelName, mrp })
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Barcode - ${name}</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 20px; margin: 0; }
              img { max-width: 100%; height: auto; }
              @media print { body { margin: 0; padding: 10px; } }
            </style>
          </head>
          <body>
            <img src="${labelImage}" alt="Barcode Label" />
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
      printWindow.close()
    }
  }

  const handleDownloadBarcode = (barcode: string, name: string, variation?: VariationData) => {
    const labelName = productName ? `${productName} | ${name}` : name
    const mrp = variation ? getVariationMRP(variation) : productPrice
    const labelImage = generateBarcodeLabel({ barcodeText: barcode, variationName: labelName, mrp })
    const link = document.createElement("a")
    link.href = labelImage
    link.download = `barcode-${name.replace(/[^a-zA-Z0-9]/g, "_")}-${barcode}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB")
      return
    }
    setUploadingImage(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("folder", "variations")
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload failed")
      setFormData((prev) => ({ ...prev, image_url: data.url }))
      toast.success("Image uploaded")
    } catch (error: any) {
      console.error("Image upload error:", error)
      toast.error(`Upload failed: ${error.message}`)
    } finally {
      setUploadingImage(false)
    }
  }

  const handleFormChange = (field: keyof VariationData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Layers className="h-5 w-5" />
          <span>Product Variations</span>
          {variations.length > 0 && (
            <Badge variant="secondary" className="ml-2">{variations.length}</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Add variations like color, design, or material. Each variation gets a unique barcode.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!readOnly && (
          <Button type="button" onClick={handleOpenAdd} variant="outline" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Variation
          </Button>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2 text-sm text-muted-foreground">Loading variations...</span>
          </div>
        )}

        {!loading && variations.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <Palette className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No variations added yet.</p>
            <p className="text-xs mt-1">Add variations like "Red Color", "Silk Design", etc.</p>
          </div>
        )}

        {variations.length > 0 && (
          <>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Variation</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Design</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                  <TableHead className="text-center">Available</TableHead>
                  <TableHead className="text-center">Booked</TableHead>
                  <TableHead className="text-center">Damaged</TableHead>
                  <TableHead>Barcode</TableHead>
                  {!readOnly && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {variations.map((v, index) => (
                  <TableRow key={v.id || index}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {v.image_url ? (
                          <img
                            src={v.image_url}
                            alt={v.variation_name}
                            className="w-8 h-8 object-cover rounded border flex-shrink-0"
                          />
                        ) : v.color ? (
                          <div
                            className="w-8 h-8 rounded border border-gray-300 flex-shrink-0"
                            style={{ backgroundColor: v.color.toLowerCase() }}
                            title={v.color}
                          />
                        ) : null}
                        <div>
                          <p className="font-medium text-sm">{v.variation_name}</p>
                          {v.material && <p className="text-xs text-muted-foreground">{v.material}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{v.color || "—"}</TableCell>
                    <TableCell className="text-sm">{v.design || "—"}</TableCell>
                    <TableCell className="text-sm">{v.size || "—"}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={v.stock_total > 0 ? "default" : "secondary"}>
                        {v.stock_total}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm font-medium text-green-600">{v.stock_available}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm font-medium text-blue-600">{v.stock_booked}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm font-medium text-red-600">{v.stock_damaged}</span>
                    </TableCell>
                    <TableCell>
                      {v.barcode ? (
                        <div className="flex items-center gap-1">
                          {barcodeImages[v.barcode] && (
                            <img
                              src={barcodeImages[v.barcode]}
                              alt="Barcode"
                              className="h-8 w-auto max-w-[80px]"
                            />
                          )}
                          <span className="text-xs font-mono text-muted-foreground">{v.barcode}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          {isLocalMode ? "Generated on save" : "—"}
                        </span>
                      )}
                    </TableCell>
                    {!readOnly && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {v.barcode && (
                            <>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePrintBarcode(v.barcode!, v.variation_name, v)}
                                title="Print barcode"
                              >
                                <Printer className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownloadBarcode(v.barcode!, v.variation_name, v)}
                                title="Download barcode"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(index)}
                            title="Edit"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(index)}
                            title="Delete"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Variation Quantity Summary */}
          <div className="grid grid-cols-4 gap-3 pt-2">
            <div className="rounded-lg border p-3 text-center">
              <p className="text-xs text-muted-foreground">Total Stock</p>
              <p className="text-lg font-bold">
                {variations.reduce((sum, v) => sum + (v.stock_total || 0), 0)}
              </p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <p className="text-xs text-muted-foreground">Available</p>
              <p className="text-lg font-bold text-green-600">
                {variations.reduce((sum, v) => sum + (v.stock_available || 0), 0)}
              </p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <p className="text-xs text-muted-foreground">Booked</p>
              <p className="text-lg font-bold text-blue-600">
                {variations.reduce((sum, v) => sum + (v.stock_booked || 0), 0)}
              </p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <p className="text-xs text-muted-foreground">Damaged</p>
              <p className="text-lg font-bold text-red-600">
                {variations.reduce((sum, v) => sum + (v.stock_damaged || 0), 0)}
              </p>
            </div>
          </div>
          </>
        )}

        {/* Add/Edit Variation Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                {editingIndex !== null ? "Edit Variation" : "Add Variation"}
              </DialogTitle>
              <DialogDescription>
                {editingIndex !== null
                  ? "Update the variation details."
                  : "Add a new variation with unique attributes. A barcode will be auto-generated."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="var-name">Variation Name *</Label>
                <Input
                  id="var-name"
                  value={formData.variation_name}
                  onChange={(e) => handleFormChange("variation_name", e.target.value)}
                  placeholder="e.g. Red Silk Dupatta"
                  maxLength={255}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="var-color">Color</Label>
                  <Input
                    id="var-color"
                    value={formData.color}
                    onChange={(e) => handleFormChange("color", e.target.value)}
                    placeholder="e.g. Red, White, Gold"
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="var-design">Design</Label>
                  <Input
                    id="var-design"
                    value={formData.design}
                    onChange={(e) => handleFormChange("design", e.target.value)}
                    placeholder="e.g. Silk, Embroidered"
                    maxLength={100}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="var-material">Material</Label>
                  <Input
                    id="var-material"
                    value={formData.material}
                    onChange={(e) => handleFormChange("material", e.target.value)}
                    placeholder="e.g. Cotton, Silk"
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="var-size">Size</Label>
                  <Input
                    id="var-size"
                    value={formData.size}
                    onChange={(e) => handleFormChange("size", e.target.value)}
                    placeholder="e.g. Free Size, Large"
                    maxLength={50}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="var-price-adj">Price Adjustment (₹)</Label>
                  <Input
                    id="var-price-adj"
                    type="number"
                    value={formData.price_adjustment}
                    onChange={(e) =>
                      handleFormChange("price_adjustment", e.target.value === "" ? "" : Number(e.target.value))
                    }
                    placeholder="0"
                    step="0.01"
                  />
                  <p className="text-xs text-muted-foreground">Added to base product price</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="var-rental-adj">Rental Price Adj. (₹)</Label>
                  <Input
                    id="var-rental-adj"
                    type="number"
                    value={formData.rental_price_adjustment}
                    onChange={(e) =>
                      handleFormChange("rental_price_adjustment", e.target.value === "" ? "" : Number(e.target.value))
                    }
                    placeholder="0"
                    step="0.01"
                  />
                  <p className="text-xs text-muted-foreground">Added to base rental price</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="var-stock-total">Total Stock</Label>
                  <Input
                    id="var-stock-total"
                    type="number"
                    value={formData.stock_total}
                    onChange={(e) => {
                      const total = Math.max(0, Number(e.target.value) || 0)
                      const booked = formData.stock_booked
                      const damaged = formData.stock_damaged
                      const available = Math.max(0, total - booked - damaged)
                      setFormData((prev) => ({ ...prev, stock_total: total, stock_available: available }))
                    }}
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="var-stock-avail">Available</Label>
                  <Input
                    id="var-stock-avail"
                    type="number"
                    value={formData.stock_available}
                    className="bg-muted/50"
                    readOnly
                    tabIndex={-1}
                  />
                  <p className="text-xs text-muted-foreground">Auto-calculated</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="var-stock-booked">Booked</Label>
                  <Input
                    id="var-stock-booked"
                    type="number"
                    value={formData.stock_booked}
                    onChange={(e) => {
                      const booked = Math.max(0, Number(e.target.value) || 0)
                      const available = Math.max(0, formData.stock_total - booked - formData.stock_damaged)
                      setFormData((prev) => ({ ...prev, stock_booked: booked, stock_available: available }))
                    }}
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="var-stock-damaged">Damaged</Label>
                  <Input
                    id="var-stock-damaged"
                    type="number"
                    value={formData.stock_damaged}
                    onChange={(e) => {
                      const damaged = Math.max(0, Number(e.target.value) || 0)
                      const available = Math.max(0, formData.stock_total - formData.stock_booked - damaged)
                      setFormData((prev) => ({ ...prev, stock_damaged: damaged, stock_available: available }))
                    }}
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>

              {/* Variation Image */}
              <div className="space-y-2">
                <Label>Variation Image</Label>
                {formData.image_url ? (
                  <div className="relative inline-block">
                    <img
                      src={formData.image_url}
                      alt="Variation"
                      className="h-24 w-24 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, image_url: "" }))}
                      className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-0.5 hover:bg-destructive/80"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {uploadingImage ? (
                      <div className="flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-4">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                        <span className="text-sm text-muted-foreground">Uploading...</span>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1"
                          onClick={() => cameraInputRef.current?.click()}
                          disabled={uploadingImage}
                        >
                          <Camera className="w-4 h-4 mr-2" />
                          Take Photo
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingImage}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload
                        </Button>
                      </div>
                    )}
                    {/* Hidden file inputs */}
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                )}
              </div>

              {editingIndex !== null && formData.barcode && (
                <div className="border rounded-lg p-3 bg-muted/50">
                  <Label className="text-sm font-medium">Generated Barcode</Label>
                  <div className="flex items-center gap-3 mt-2">
                    <img
                      src={generateBarcode(formData.barcode)}
                      alt="Variation Barcode"
                      className="h-12 w-auto"
                    />
                    <span className="font-mono text-sm">{formData.barcode}</span>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSaveVariation} disabled={saving}>
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Barcode className="w-4 h-4 mr-2" />
                    {editingIndex !== null ? "Update" : "Add & Generate Barcode"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
