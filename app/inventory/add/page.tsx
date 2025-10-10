"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Package, Save, Barcode, Camera, Upload, X, ImageIcon, Star, Move } from "lucide-react"
import { UploadProgress, useUploadProgress } from '@/components/ui/upload-progress'
import { uploadMultiple } from '@/lib/upload-with-progress'
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { generateBarcode } from "@/lib/barcode-generator"
import Link from "next/link"

interface Category {
  id: string
  name: string
  description?: string
}

interface ProductImage {
  id: string
  url: string
  isMain: boolean
  order: number
}

interface FormData {
  name: string
  category_id: string
  subcategory_id?: string
  brand: string
  size: string
  color: string
  material: string
  description: string
  price: string | number
  rental_price: string | number
  cost_price: string | number
  security_deposit: string | number
  stock_total: number
  reorder_level: number
  is_active: boolean
  image_url?: string
}

export default function AddProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Category[]>([])
  const [generatedBarcode, setGeneratedBarcode] = useState<string>("")
  const [productCode, setProductCode] = useState<string>("")

  const [productImages, setProductImages] = useState<ProductImage[]>([])
  const [imageUploading, setImageUploading] = useState(false)
  const { progress: imageProgress, isUploading: isImageUploading, track: trackImageUpload } = useUploadProgress()
  const [draggedImageId, setDraggedImageId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState<FormData>({
    name: "",
    category_id: "",
    subcategory_id: "",
    brand: "",
    size: "",
    color: "",
    material: "",
    description: "",
    price: "",
    rental_price: "",
    cost_price: "",
    security_deposit: "",
    stock_total: 1,
    reorder_level: 5,
    is_active: true,
    image_url: "",
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    if (formData.category_id && formData.name) {
      generateProductCode()
    }
  }, [formData.category_id, formData.name, categories])

  useEffect(() => {
    const mainImage = productImages.find((img) => img.isMain)
    setFormData((prev) => ({ ...prev, image_url: mainImage?.url || "" }))
  }, [productImages])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("product_categories")
        .select("id, name, description")
        .eq("is_active", true)
        .is("parent_id", null)
        .order("name")

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error("Error fetching categories:", error)
      toast.error("Failed to load categories")
    }
  }

  const fetchSubcategories = async (parentId: string) => {
    try {
      const { data, error } = await supabase
        .from("product_categories")
        .select("id, name, description")
        .eq("parent_id", parentId)
        .eq("is_active", true)
        .order("name")

      if (error) throw error
      setSubcategories(data || [])
    } catch (error) {
      console.error("Error fetching subcategories:", error)
      setSubcategories([])
    }
  }

  const generateProductCode = async () => {
    try {
      const selectedCategory = categories.find((cat) => cat.id === formData.category_id)
      if (!selectedCategory) return

      const prefix = selectedCategory.name.substring(0, 3).toUpperCase()
      const timestamp = Date.now().toString().slice(-6)
      const code = `${prefix}${timestamp}`
      setProductCode(code)

      const barcodeDataURL = generateBarcode(code)
      setGeneratedBarcode(barcodeDataURL)
    } catch (error) {
      console.error("Error generating barcode:", error)
    }
  }

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    if (field === "category_id" && value) {
      fetchSubcategories(value)
      setFormData((prev) => ({ ...prev, subcategory_id: "" }))
    }
  }

  const validateFormData = () => {
    const errors: string[] = []

    if (!formData.name.trim()) errors.push("Product name is required")
    if (!formData.category_id) errors.push("Category is required")

    if (formData.name.length > 255) errors.push("Product name must be less than 255 characters")
    if (formData.brand.length > 100) errors.push("Brand must be less than 100 characters")
    if (formData.size.length > 50) errors.push("Size must be less than 50 characters")
    if (formData.color.length > 50) errors.push("Color must be less than 50 characters")
    if (formData.material.length > 100) errors.push("Material must be less than 100 characters")
    if (formData.description.length > 1000) errors.push("Description must be less than 1000 characters")

    const price = Number(formData.price) || 0
    const rentalPrice = Number(formData.rental_price) || 0
    const costPrice = Number(formData.cost_price) || 0
    const securityDeposit = Number(formData.security_deposit) || 0

    if (price < 0) errors.push("Price cannot be negative")
    if (rentalPrice < 0) errors.push("Rental price cannot be negative")
    if (costPrice < 0) errors.push("Cost price cannot be negative")
    if (securityDeposit < 0) errors.push("Security deposit cannot be negative")
    if (formData.stock_total < 1) errors.push("Stock total must be at least 1")
    if (formData.reorder_level < 0) errors.push("Reorder level cannot be negative")

    return errors
  }

  const handleImageUpload = async (files: FileList) => {
    if (!files || files.length === 0) return

    const validFiles = Array.from(files).filter((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not a valid image file`)
        return false
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    setImageUploading(true)

    try {
      // Use global track hook by wrapping uploadMultiple into its interface
      const uploadedUrls: string[] = []
      await trackImageUpload(validFiles, (file, onChunk) => {
        // Bridge: uploadWithProgress already aggregated by uploadMultiple; we replicate chunk via uploadMultiple-like custom call
        return new Promise<string>(async (resolve, reject) => {
          try {
            const { uploadWithProgress } = await import('@/lib/upload-with-progress')
            uploadWithProgress(file, { folder: 'inventory' }, (l,t)=> onChunk(l,t))
              .then(r=> resolve(r.url))
              .catch(reject)
          } catch(e){ reject(e as any) }
        }).then(u=>{ uploadedUrls.push(u); return u })
      })

      const newImages: ProductImage[] = uploadedUrls.map((url, index) => ({
        id: `img-${Date.now()}-${index}`,
        url,
        isMain: productImages.length === 0 && index === 0, // First image becomes main if no images exist
        order: productImages.length + index,
      }))

      setProductImages((prev) => [...prev, ...newImages])
  toast.success(`Successfully uploaded ${uploadedUrls.length} image(s)`)
    } catch (error) {
      console.error("Error uploading images:", error)
      toast.error("Failed to upload some images")
    } finally {
      setImageUploading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      handleImageUpload(files)
    }
  }

  const handleCameraCapture = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click()
    }
  }

  const handleDeviceUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const setMainImage = (imageId: string) => {
    setProductImages((prev) =>
      prev.map((img) => ({
        ...img,
        isMain: img.id === imageId,
      })),
    )
  }

  const removeImage = (imageId: string) => {
    setProductImages((prev) => {
      const filtered = prev.filter((img) => img.id !== imageId)
      // If we removed the main image, make the first remaining image main
      if (filtered.length > 0 && !filtered.some((img) => img.isMain)) {
        filtered[0].isMain = true
      }
      return filtered
    })
  }

  const handleDragStart = (e: React.DragEvent, imageId: string) => {
    setDraggedImageId(imageId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (e: React.DragEvent, targetImageId: string) => {
    e.preventDefault()

    if (!draggedImageId || draggedImageId === targetImageId) return

    setProductImages((prev) => {
      const draggedIndex = prev.findIndex((img) => img.id === draggedImageId)
      const targetIndex = prev.findIndex((img) => img.id === targetImageId)

      if (draggedIndex === -1 || targetIndex === -1) return prev

      const newImages = [...prev]
      const [draggedImage] = newImages.splice(draggedIndex, 1)
      newImages.splice(targetIndex, 0, draggedImage)

      // Update order numbers
      return newImages.map((img, index) => ({ ...img, order: index }))
    })

    setDraggedImageId(null)
  }

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    if (files) {
      handleImageUpload(files)
    }
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationErrors = validateFormData()
    if (validationErrors.length > 0) {
      toast.error(validationErrors[0])
      return
    }

    setLoading(true)

    try {
      // Get current user's franchise from session
      const userRes = await fetch("/api/auth/user")
      if (!userRes.ok) throw new Error("Failed to get user info")
      const user = await userRes.json()

      if (!user.franchise_id) {
        throw new Error("No franchise found for your account. Please contact support.")
      }

      const productData = {
        product_code: productCode.substring(0, 50),
        name: formData.name.trim().substring(0, 255),
        category_id: formData.category_id,
        subcategory_id: formData.subcategory_id || null,
        brand: formData.brand.trim().substring(0, 100) || null,
        size: formData.size.trim().substring(0, 50) || null,
        color: formData.color.trim().substring(0, 50) || null,
        material: formData.material.trim().substring(0, 100) || null,
        description: formData.description.trim().substring(0, 1000) || null,
        price: Number(formData.price) || 0,
        rental_price: Number(formData.rental_price) || 0,
        cost_price: Number(formData.cost_price) || 0,
        security_deposit: Number(formData.security_deposit) || 0,
        stock_total: formData.stock_total,
        stock_available: formData.stock_total,
        stock_booked: 0,
        stock_damaged: 0,
        stock_in_laundry: 0,
        reorder_level: formData.reorder_level,
        usage_count: 0,
        damage_count: 0,
        barcode: productCode.substring(0, 100),
        qr_code: null,
        image_url: formData.image_url || null,
        is_active: formData.is_active,
        franchise_id: user.franchise_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase.from("products").insert([productData]).select()

      if (error) throw error

      // Persist gallery images (if any) into product_images table
      try {
        if (productImages.length > 0 && data && data[0] && data[0].id) {
          const productId = data[0].id
          const rows = productImages.map((img) => ({
            product_id: productId,
            url: img.url,
            is_main: !!img.isMain,
            order: img.order || 0,
          }))

          const { error: imgError } = await supabase.from("product_images").insert(rows)
          if (imgError) {
            console.error("Failed to persist product images:", imgError)
            // non-fatal: continue
          }
        }
      } catch (galleryErr) {
        console.error("Error persisting gallery images:", galleryErr)
      }

      toast.success(`Product "${formData.name}" has been added successfully with barcode ${productCode}!`)
      router.push("/inventory")
    } catch (error: any) {
      console.error("Error adding product:", error)
      if (error.message?.includes("foreign key constraint") && error.message?.includes("franchise_id")) {
        toast.error("No valid franchise found. Please create a franchise first.")
      } else if (error.message?.includes("value too long")) {
        toast.error("One or more fields exceed the maximum allowed length. Please check your input.")
      } else {
        toast.error(`Failed to add product: ${error.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/inventory">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Inventory
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Add New Product</h1>
            <p className="text-muted-foreground">Create a new product with auto-generated barcode</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Package className="h-5 w-5" />
                    <span>Basic Information</span>
                  </CardTitle>
                  <CardDescription>Enter the basic details of your product</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Product Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        placeholder="Enter product name"
                        maxLength={255}
                        required
                      />
                      <p className="text-xs text-muted-foreground">{formData.name.length}/255 characters</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select
                        value={formData.category_id}
                        onValueChange={(value) => handleInputChange("category_id", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.category_id && subcategories.length > 0 && (
                      <div className="space-y-2">
                        <Label htmlFor="subcategory">Subcategory</Label>
                        <Select
                          value={formData.subcategory_id || ""}
                          onValueChange={(value) => handleInputChange("subcategory_id", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select subcategory (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            {subcategories.map((subcategory) => (
                              <SelectItem key={subcategory.id} value={subcategory.id}>
                                {subcategory.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="brand">Brand</Label>
                      <Input
                        id="brand"
                        value={formData.brand}
                        onChange={(e) => handleInputChange("brand", e.target.value)}
                        placeholder="Enter brand name"
                        maxLength={100}
                      />
                      <p className="text-xs text-muted-foreground">{formData.brand.length}/100 characters</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="size">Size</Label>
                      <Input
                        id="size"
                        value={formData.size}
                        onChange={(e) => handleInputChange("size", e.target.value)}
                        placeholder="Enter size"
                        maxLength={50}
                      />
                      <p className="text-xs text-muted-foreground">{formData.size.length}/50 characters</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="color">Color</Label>
                      <Input
                        id="color"
                        value={formData.color}
                        onChange={(e) => handleInputChange("color", e.target.value)}
                        placeholder="Enter color"
                        maxLength={50}
                      />
                      <p className="text-xs text-muted-foreground">{formData.color.length}/50 characters</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="material">Material</Label>
                      <Input
                        id="material"
                        value={formData.material}
                        onChange={(e) => handleInputChange("material", e.target.value)}
                        placeholder="Enter material"
                        maxLength={100}
                      />
                      <p className="text-xs text-muted-foreground">{formData.material.length}/100 characters</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      placeholder="Enter product description"
                      rows={3}
                      maxLength={1000}
                    />
                    <p className="text-xs text-muted-foreground">{formData.description.length}/1000 characters</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <ImageIcon className="h-5 w-5" />
                    <span>Product Gallery</span>
                  </CardTitle>
                  <CardDescription>Upload multiple photos and set a main image for your product</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Upload Controls */}
                  {isImageUploading && (
                    <div className="mb-3">
                      <UploadProgress progress={imageProgress} />
                      <p className="text-xs text-muted-foreground mt-1">Uploading images...</p>
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCameraCapture}
                      disabled={imageUploading}
                      className="flex-1 bg-transparent"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Take Photo
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleDeviceUpload}
                      disabled={imageUploading}
                      className="flex-1 bg-transparent"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Images
                    </Button>
                  </div>

                  {imageUploading && (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <span className="ml-2 text-sm text-muted-foreground">Uploading images...</span>
                    </div>
                  )}

                  {/* Image Gallery */}
                  {productImages.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">Drag to reorder images.</p>
                        <Badge variant="outline" className="text-xs">
                          <Star className="w-3 h-3 mr-1" />
                          Main image marked with star
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {productImages
                          .sort((a, b) => a.order - b.order)
                          .map((image) => (
                            <div
                              key={image.id}
                              className="relative group cursor-move border-2 border-dashed border-transparent hover:border-primary/50 rounded-lg transition-colors"
                              draggable
                              onDragStart={(e) => handleDragStart(e, image.id)}
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, image.id)}
                            >
                              <div className="relative">
                                <img
                                  src={image.url || "/placeholder.svg"}
                                  alt="Product image"
                                  className="w-full h-32 object-cover rounded-lg border"
                                />

                                {/* Main Image Badge */}
                                {image.isMain && (
                                  <Badge className="absolute top-2 left-2 bg-yellow-500 hover:bg-yellow-600">
                                    <Star className="w-3 h-3 mr-1" />
                                    Main
                                  </Badge>
                                )}

                                {/* Action Buttons */}
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                  {!image.isMain && (
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="secondary"
                                      onClick={() => setMainImage(image.id)}
                                      className="h-6 w-6 p-0"
                                      title="Set as main image"
                                    >
                                      <Star className="w-3 h-3" />
                                    </Button>
                                  )}
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => removeImage(image.id)}
                                    className="h-6 w-6 p-0"
                                    title="Remove image"
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>

                                {/* Drag Handle */}
                                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Move className="w-4 h-4 text-muted-foreground" />
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ) : (
                    /* Drop Zone */
                    <div
                      className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center transition-colors hover:border-primary/50"
                      onDrop={handleFileDrop}
                      onDragOver={handleDragOver}
                      onDragEnter={handleDragEnter}
                    >
                      <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground mb-1">
                        No photos uploaded yet. Drag & drop images here or use the buttons above.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Supported formats: JPG, PNG, GIF (max 5MB each) • Multiple images supported
                      </p>
                    </div>
                  )}

                  {/* Hidden File Inputs */}
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pricing Information</CardTitle>
                  <CardDescription>Set the pricing details for this product</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rental_price">Rental Price (₹)</Label>
                      <Input
                        id="rental_price"
                        type="number"
                        value={formData.rental_price}
                        onChange={(e) =>
                          handleInputChange(
                            "rental_price",
                            e.target.value === "" ? "" : Number.parseFloat(e.target.value) || "",
                          )
                        }
                        placeholder="0.00"
                        className="placeholder:text-muted-foreground/30"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="price">Sale Price (₹)</Label>
                      <Input
                        id="price"
                        type="number"
                        value={formData.price}
                        onChange={(e) =>
                          handleInputChange(
                            "price",
                            e.target.value === "" ? "" : Number.parseFloat(e.target.value) || "",
                          )
                        }
                        placeholder="0.00"
                        className="placeholder:text-muted-foreground/30"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cost_price">Cost Price (₹)</Label>
                      <Input
                        id="cost_price"
                        type="number"
                        value={formData.cost_price}
                        onChange={(e) =>
                          handleInputChange(
                            "cost_price",
                            e.target.value === "" ? "" : Number.parseFloat(e.target.value) || "",
                          )
                        }
                        placeholder="0.00"
                        className="placeholder:text-muted-foreground/30"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="security_deposit">Security Deposit (₹)</Label>
                      <Input
                        id="security_deposit"
                        type="number"
                        value={formData.security_deposit}
                        onChange={(e) =>
                          handleInputChange(
                            "security_deposit",
                            e.target.value === "" ? "" : Number.parseFloat(e.target.value) || "",
                          )
                        }
                        placeholder="0.00"
                        className="placeholder:text-muted-foreground/30"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Stock Information</CardTitle>
                  <CardDescription>Set the initial stock levels</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="stock_total">Total Stock</Label>
                      <Input
                        id="stock_total"
                        type="number"
                        value={formData.stock_total}
                        onChange={(e) => handleInputChange("stock_total", Number.parseInt(e.target.value) || 1)}
                        placeholder="1"
                        min="1"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reorder_level">Reorder Level</Label>
                      <Input
                        id="reorder_level"
                        type="number"
                        value={formData.reorder_level}
                        onChange={(e) => handleInputChange("reorder_level", Number.parseInt(e.target.value) || 5)}
                        placeholder="5"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 mt-4">
                    <Checkbox
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => handleInputChange("is_active", checked)}
                    />
                    <Label htmlFor="is_active">Product is active</Label>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Barcode className="h-5 w-5" />
                    <span>Auto-Generated Barcode</span>
                  </CardTitle>
                  <CardDescription>Barcode will be generated automatically</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {productCode && (
                    <div className="text-center space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Product Code</Label>
                        <p className="font-mono text-lg font-bold">{productCode}</p>
                      </div>

                      {generatedBarcode && (
                        <div className="border rounded-lg p-4 bg-white">
                          <img
                            src={generatedBarcode || "/placeholder.svg"}
                            alt="Generated Barcode"
                            className="w-full h-auto"
                          />
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground">Product code will be saved as barcode identifier</p>
                    </div>
                  )}

                  {!productCode && (
                    <div className="text-center py-8">
                      <Barcode className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Fill in category and product name to generate barcode
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Link href="/inventory">
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Adding Product...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Add Product
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
