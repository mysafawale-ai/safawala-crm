"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { X, Plus, Edit2, Trash2, Copy, Image, Barcode, AlertCircle } from "lucide-react"
import { toast } from "sonner"

export interface ProductVariant {
  id?: string
  variation_name: string
  color?: string
  design?: string
  material?: string
  size?: string
  sku?: string
  price_adjustment: number
  rental_price_adjustment: number
  stock_total: number
  stock_available: number
  barcode?: string
  image_url?: string
}

interface VariantManagerProps {
  variants: ProductVariant[]
  onVariantsChange: (variants: ProductVariant[]) => void
  disabled?: boolean
  productName?: string
  onPrintBarcode?: (variant: ProductVariant) => void
}

export function VariantManager({ variants, onVariantsChange, disabled, productName, onPrintBarcode }: VariantManagerProps) {
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState<ProductVariant>({
    variation_name: "",
    color: "",
    design: "",
    material: "",
    size: "",
    sku: "",
    price_adjustment: 0,
    rental_price_adjustment: 0,
    stock_total: 0,
    stock_available: 0,
    image_url: "",
  })

  const openNewForm = () => {
    setFormData({
      variation_name: "",
      color: "",
      design: "",
      material: "",
      size: "",
      sku: "",
      price_adjustment: 0,
      rental_price_adjustment: 0,
      stock_total: 0,
      stock_available: 0,
      image_url: "",
    })
    setEditingIdx(-1) // -1 means new
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const file = files[0]

      // Show preview immediately while uploading
      const reader = new FileReader()
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string
        setFormData({ ...formData, image_url: dataUrl })
      }
      reader.readAsDataURL(file)

      toast.success("Image selected (will be uploaded when you save the product)")
    } catch (error) {
      console.error("Image selection failed:", error)
      toast.error("Failed to select image")
    } finally {
      setUploading(false)
    }
  }

  const removeImage = () => {
    setFormData({ ...formData, image_url: "" })
    toast.success("Image removed")
  }

  const openEditForm = (idx: number) => {
    setFormData({ ...variants[idx] })
    setEditingIdx(idx)
  }

  const saveVariant = () => {
    if (!formData.variation_name.trim()) {
      toast.error("Variant name is required")
      return
    }

    let updated: ProductVariant[]
    if (editingIdx === -1) {
      // New variant
      updated = [...variants, { ...formData }]
    } else {
      // Update existing
      updated = variants.map((v, i) => (i === editingIdx ? formData : v))
    }

    onVariantsChange(updated)
    setEditingIdx(null)
    toast.success(editingIdx === -1 ? "Variant added" : "Variant updated")
  }

  const deleteVariant = (idx: number) => {
    onVariantsChange(variants.filter((_, i) => i !== idx))
    toast.success("Variant deleted")
  }

  const duplicateVariant = (idx: number) => {
    const dup = { ...variants[idx] }
    delete dup.id
    delete dup.barcode
    dup.variation_name = `${dup.variation_name} (Copy)`
    onVariantsChange([...variants, dup])
    toast.success("Variant duplicated")
  }

  const getVariantLabel = (v: ProductVariant) => {
    const parts = [v.variation_name]
    if (v.size) parts.push(v.size)
    if (v.color) parts.push(v.color)
    return parts.join(" • ")
  }

  return (
    <div className="space-y-4">
      {/* Variants List */}
      {variants.length > 0 && (
        <div className="space-y-2">
          {variants.map((variant, idx) => (
            <Card key={idx} className="p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{getVariantLabel(variant)}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {variant.size && <Badge variant="outline" className="text-xs">{variant.size}</Badge>}
                    {variant.color && <Badge variant="outline" className="text-xs">{variant.color}</Badge>}
                    {variant.design && <Badge variant="outline" className="text-xs">{variant.design}</Badge>}
                    {variant.material && <Badge variant="outline" className="text-xs">{variant.material}</Badge>}
                    {variant.sku && <Badge variant="outline" className="text-xs font-mono text-[10px]">{variant.sku}</Badge>}
                  </div>
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    {variant.stock_total > 0 && <span>Stock: {variant.stock_available}/{variant.stock_total}</span>}
                    {variant.price_adjustment !== 0 && (
                      <span>Price: {variant.price_adjustment > 0 ? "+" : ""}₹{variant.price_adjustment.toLocaleString()}</span>
                    )}
                    {variant.image_url && <span className="text-purple-600 flex items-center gap-1"><Image className="w-3 h-3" /> Photo</span>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2"
                    onClick={() => openEditForm(idx)}
                    disabled={disabled}
                    title="Edit"
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  {variant.barcode && onPrintBarcode && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2 text-blue-600"
                      onClick={() => onPrintBarcode(variant)}
                      disabled={disabled}
                      title="Print barcode"
                    >
                      <Barcode className="w-3 h-3" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2"
                    onClick={() => duplicateVariant(idx)}
                    disabled={disabled}
                    title="Duplicate"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2 text-red-600 hover:text-red-700"
                    onClick={() => deleteVariant(idx)}
                    disabled={disabled}
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Button */}
      <Button
        onClick={openNewForm}
        disabled={disabled}
        variant="outline"
        className="w-full"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Variant
      </Button>

      {/* Edit/Create Dialog */}
      <Dialog open={editingIdx !== null} onOpenChange={(open) => !open && setEditingIdx(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingIdx === -1 ? "Add Variant" : "Edit Variant"}
              {productName && <span className="text-sm text-muted-foreground ml-2">({productName})</span>}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="var_name">Variant Name *</Label>
              <Input
                id="var_name"
                placeholder="e.g., Red XL, Summer 2024"
                value={formData.variation_name}
                onChange={(e) => setFormData({ ...formData, variation_name: e.target.value })}
              />
            </div>

            {/* Attributes Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="var_size">Size</Label>
                <Input
                  id="var_size"
                  placeholder="e.g., XL, 42"
                  value={formData.size || ""}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="var_color">Color</Label>
                <Input
                  id="var_color"
                  placeholder="e.g., Red, Navy"
                  value={formData.color || ""}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="var_design">Design</Label>
                <Input
                  id="var_design"
                  placeholder="e.g., Floral, Stripes"
                  value={formData.design || ""}
                  onChange={(e) => setFormData({ ...formData, design: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="var_material">Material</Label>
                <Input
                  id="var_material"
                  placeholder="e.g., Cotton, Silk"
                  value={formData.material || ""}
                  onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="var_sku">SKU</Label>
                <Input
                  id="var_sku"
                  placeholder="e.g., SKU-001"
                  value={formData.sku || ""}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                />
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-2 border-t pt-4">
              <h4 className="font-semibold text-sm">Price Adjustments</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="var_price_adj">Rental Price Adjustment</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                    <Input
                      id="var_price_adj"
                      type="number"
                      step="0.01"
                      value={formData.rental_price_adjustment}
                      onChange={(e) => setFormData({ ...formData, rental_price_adjustment: parseFloat(e.target.value) || 0 })}
                      className="pl-7"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="var_sale_adj">Sale Price Adjustment</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                    <Input
                      id="var_sale_adj"
                      type="number"
                      step="0.01"
                      value={formData.price_adjustment}
                      onChange={(e) => setFormData({ ...formData, price_adjustment: parseFloat(e.target.value) || 0 })}
                      className="pl-7"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Stock */}
            <div className="space-y-2 border-t pt-4">
              <h4 className="font-semibold text-sm">Stock</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="var_stock_total">Total Stock</Label>
                  <Input
                    id="var_stock_total"
                    type="number"
                    min="0"
                    value={formData.stock_total}
                    onChange={(e) => setFormData({ ...formData, stock_total: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="var_stock_avail">Available Stock</Label>
                  <Input
                    id="var_stock_avail"
                    type="number"
                    min="0"
                    max={formData.stock_total}
                    value={formData.stock_available}
                    onChange={(e) => setFormData({ ...formData, stock_available: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>

            {/* Photo */}
            <div className="space-y-2 border-t pt-4">
              <h4 className="font-semibold text-sm">Variant Photo</h4>
              {formData.image_url ? (
                <div className="space-y-2">
                  <div className="border rounded-lg overflow-hidden bg-gray-50 p-2">
                    <img
                      src={formData.image_url}
                      alt="Variant"
                      className="w-full h-40 object-cover rounded"
                    />
                  </div>
                  <Button
                    onClick={removeImage}
                    variant="outline"
                    size="sm"
                    className="w-full text-red-600"
                  >
                    <X className="w-3 h-3 mr-2" />
                    Remove Photo
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 transition">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="hidden"
                    id="var_image"
                  />
                  <label
                    htmlFor="var_image"
                    className="block cursor-pointer"
                  >
                    <Image className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs font-medium text-muted-foreground">
                      {uploading ? "Uploading..." : "Click to upload variant photo"}
                    </p>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end border-t pt-4">
            <Button variant="outline" onClick={() => setEditingIdx(null)}>
              Cancel
            </Button>
            <Button onClick={saveVariant}>
              {editingIdx === -1 ? "Add Variant" : "Update Variant"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
