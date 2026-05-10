"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Loader2, DollarSign, Package, Image, Layers, Barcode } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { PricingPanel } from "./pricing-panel"
import { PhotoGallery } from "./photo-gallery"
import { VariantManager, ProductVariant } from "./variant-manager"
import { BarcodeGenerator } from "./barcode-generator-enhanced"
import { printBarcodes } from "@/lib/barcode-print-service"

interface Product {
  id?: string
  name: string
  description: string
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
  reorder_level: number
  category_id?: string
  image_url?: string
  barcode?: string
}

interface ProductImage {
  id?: string
  url: string
  is_main: boolean
  order: number
}

interface ProductEditorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product | null
  onSave: (data: any) => Promise<void>
  franchiseId?: string
}

export function ProductEditorModal({
  open,
  onOpenChange,
  product,
  onSave,
  franchiseId,
}: ProductEditorModalProps) {
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("info")
  const [images, setImages] = useState<ProductImage[]>([])
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [loadingImages, setLoadingImages] = useState(false)

  const [formData, setFormData] = useState<Product>({
    name: "",
    description: "",
    brand: "",
    size: "",
    color: "",
    material: "",
    price: 0,
    rental_price: 0,
    cost_price: 0,
    security_deposit: 0,
    stock_total: 0,
    stock_available: 0,
    reorder_level: 0,
  })

  useEffect(() => {
    if (product) {
      setFormData(product)
      loadImages()
      loadVariants()
    } else {
      resetForm()
    }
  }, [product, open])

  const loadImages = async () => {
    if (!product?.id) return
    try {
      setLoadingImages(true)
      const { data, error } = await supabase
        .from("product_images")
        .select("*")
        .eq("product_id", product.id)
        .order("order", { ascending: true })

      if (error) throw error
      setImages(data?.map((img) => ({
        id: img.id,
        url: img.url,
        is_main: img.is_main,
        order: img.order,
      })) || [])
    } catch (error) {
      console.error("Failed to load images:", error)
    } finally {
      setLoadingImages(false)
    }
  }

  const loadVariants = async () => {
    if (!product?.id) return
    try {
      const { data, error } = await supabase
        .from("product_variations")
        .select("*")
        .eq("product_id", product.id)
        .eq("is_active", true)

      if (error) throw error
      setVariants(data || [])
    } catch (error) {
      console.error("Failed to load variants:", error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      brand: "",
      size: "",
      color: "",
      material: "",
      price: 0,
      rental_price: 0,
      cost_price: 0,
      security_deposit: 0,
      stock_total: 0,
      stock_available: 0,
      reorder_level: 0,
    })
    setImages([])
    setVariants([])
    setActiveTab("info")
  }

  const handleUploadImages = async (files: File[]) => {
    if (!franchiseId) {
      toast.error("Franchise ID required for image upload")
      return { urls: [] }
    }

    try {
      const urls: string[] = []
      for (const file of files) {
        const timestamp = Date.now()
        const path = `products/${franchiseId}/${timestamp}-${file.name}`

        const { data, error } = await supabase.storage
          .from("product-images")
          .upload(path, file, { upsert: false })

        if (error) throw error

        const { data: urlData } = supabase.storage
          .from("product-images")
          .getPublicUrl(path)

        urls.push(urlData.publicUrl)
      }
      return { urls }
    } catch (error) {
      console.error("Image upload failed:", error)
      throw error
    }
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Product name is required")
      return
    }

    setSaving(true)
    try {
      const mainImage = images.find((img) => img.is_main)

      const payload = {
        ...formData,
        image_url: mainImage?.url,
        images,
        variants,
      }

      await onSave(payload)
      toast.success(product ? "Product updated" : "Product created")
      onOpenChange(false)
      resetForm()
    } catch (error) {
      console.error("Save error:", error)
      toast.error("Failed to save product")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {product ? `Edit: ${product.name}` : "Add New Product"}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="info" className="text-xs">
              <Package className="w-3 h-3 mr-1" />
              Info
            </TabsTrigger>
            <TabsTrigger value="photos" className="text-xs">
              <Image className="w-3 h-3 mr-1" />
              Photos
            </TabsTrigger>
            <TabsTrigger value="pricing" className="text-xs">
              <DollarSign className="w-3 h-3 mr-1" />
              Pricing
            </TabsTrigger>
            <TabsTrigger value="variants" className="text-xs">
              <Layers className="w-3 h-3 mr-1" />
              Variants
            </TabsTrigger>
            <TabsTrigger value="barcode" className="text-xs">
              <Barcode className="w-3 h-3 mr-1" />
              Barcode
            </TabsTrigger>
          </TabsList>

          {/* Info Tab */}
          <TabsContent value="info" className="flex-1 overflow-y-auto space-y-4">
            <div className="space-y-3">
              <div>
                <Label htmlFor="product-name" className="text-sm">Product Name *</Label>
                <Input
                  id="product-name"
                  placeholder="e.g., Wedding Lehenga"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="product-desc" className="text-sm">Description</Label>
                <Textarea
                  id="product-desc"
                  placeholder="Product details..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="product-brand" className="text-sm">Brand</Label>
                  <Input
                    id="product-brand"
                    placeholder="e.g., Sabyasachi"
                    value={formData.brand || ""}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="product-size" className="text-sm">Size</Label>
                  <Input
                    id="product-size"
                    placeholder="e.g., Free, S-M-L"
                    value={formData.size || ""}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="product-color" className="text-sm">Color</Label>
                  <Input
                    id="product-color"
                    placeholder="e.g., Red, Navy"
                    value={formData.color || ""}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="product-material" className="text-sm">Material</Label>
                  <Input
                    id="product-material"
                    placeholder="e.g., Silk, Cotton"
                    value={formData.material || ""}
                    onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="product-stock" className="text-sm">Total Stock</Label>
                  <Input
                    id="product-stock"
                    type="number"
                    min="0"
                    value={formData.stock_total}
                    onChange={(e) => setFormData({ ...formData, stock_total: parseInt(e.target.value) || 0 })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="product-available" className="text-sm">Available Stock</Label>
                  <Input
                    id="product-available"
                    type="number"
                    min="0"
                    max={formData.stock_total}
                    value={formData.stock_available}
                    onChange={(e) => setFormData({ ...formData, stock_available: parseInt(e.target.value) || 0 })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="product-reorder" className="text-sm">Reorder Level</Label>
                  <Input
                    id="product-reorder"
                    type="number"
                    min="0"
                    value={formData.reorder_level}
                    onChange={(e) => setFormData({ ...formData, reorder_level: parseInt(e.target.value) || 0 })}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Photos Tab */}
          <TabsContent value="photos" className="flex-1 overflow-y-auto">
            {loadingImages ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <PhotoGallery
                images={images}
                onImagesChange={setImages}
                onUpload={handleUploadImages}
                disabled={!product && !franchiseId}
              />
            )}
          </TabsContent>

          {/* Pricing Tab */}
          <TabsContent value="pricing" className="flex-1 overflow-y-auto">
            <PricingPanel
              data={{
                cost_price: formData.cost_price,
                rental_price: formData.rental_price,
                price: formData.price,
                security_deposit: formData.security_deposit,
              }}
              onChange={(data) => setFormData({ ...formData, ...data })}
            />
          </TabsContent>

          {/* Variants Tab */}
          <TabsContent value="variants" className="flex-1 overflow-y-auto">
            <VariantManager
              variants={variants}
              onVariantsChange={setVariants}
              productName={formData.name}
              onPrintBarcode={async (variant) => {
                if (!variant.barcode) {
                  toast.error("No barcode for this variant")
                  return
                }
                try {
                  const variantName = variant.variation_name || formData.name
                  const price = formData.price + (variant.price_adjustment || 0)
                  await printBarcodes({
                    barcodes: [{
                      code: variant.barcode,
                      productName: variantName,
                      price: price,
                    }],
                    columns: 2,
                  })
                  toast.success("Barcode sent to printer")
                } catch (error) {
                  toast.error("Failed to print barcode")
                  console.error(error)
                }
              }}
            />
          </TabsContent>

          {/* Barcode Tab */}
          <TabsContent value="barcode" className="flex-1 overflow-y-auto space-y-4">
            {product ? (
              <BarcodeGenerator product={{ ...formData, id: product.id || "" }} onBarcodeGenerated={loadVariants} />
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Save the product first, then you can generate barcodes.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>

        {/* Footer Actions */}
        <div className="flex gap-2 justify-end border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {product ? "Update Product" : "Create Product"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
