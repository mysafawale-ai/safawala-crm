"use client"

import { useState, useEffect, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Package, Plus, Search, RefreshCw, AlertTriangle, CheckCircle, BarChart3 } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ProductCard } from "@/components/inventory/product-card"
import { ProductEditorModal } from "@/components/inventory/product-editor-modal"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { useConfirmationDialog } from "@/components/ui/confirmation-dialog"
import Link from "next/link"

interface User {
  id: string
  email: string
  role: string
  franchise_id: string
}

interface Product {
  id: string
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
  barcode?: string
  image_url?: string
  is_active: boolean
  _variation_count?: number
}

export default function InventoryDashboard() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [stockFilter, setStockFilter] = useState<"all" | "in_stock" | "low_stock" | "out_of_stock">("all")
  const [user, setUser] = useState<User | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [barcodeDialogOpen, setBarcodeDialogOpen] = useState(false)
  const [selectedProductForBarcode, setSelectedProductForBarcode] = useState<Product | null>(null)

  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog()

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const userRes = await fetch("/api/auth/user")
      if (!userRes.ok) throw new Error("Failed to fetch user")
      const currentUser: User = await userRes.json()
      setUser(currentUser)

      let query = supabase.from("products").select("*").order("created_at", { ascending: false })

      if (currentUser.role !== "super_admin" && currentUser.franchise_id) {
        query = query.eq("franchise_id", currentUser.franchise_id)
      }

      const { data, error } = await query
      if (error) throw error

      const activeData = (data || []).filter((p: any) => p.is_active !== false)

      const normalized: Product[] = activeData.map((p: any) => ({
        product_code: p.product_code || p.id?.slice(0, 8) || "CUST",
        price: typeof p.price === "number" ? p.price : typeof p.sale_price === "number" ? p.sale_price : 0,
        rental_price: typeof p.rental_price === "number" ? p.rental_price : 0,
        cost_price: typeof p.cost_price === "number" ? p.cost_price : 0,
        security_deposit: typeof p.security_deposit === "number" ? p.security_deposit : 0,
        stock_total: typeof p.stock_total === "number" ? p.stock_total : typeof p.stock_available === "number" ? p.stock_available : 0,
        stock_available: typeof p.stock_available === "number" ? p.stock_available : 0,
        stock_booked: typeof p.stock_booked === "number" ? p.stock_booked : 0,
        stock_damaged: typeof p.stock_damaged === "number" ? p.stock_damaged : 0,
        stock_in_laundry: typeof p.stock_in_laundry === "number" ? p.stock_in_laundry : 0,
        reorder_level: typeof p.reorder_level === "number" ? p.reorder_level : 0,
        barcode: p.barcode || p.barcode_number || undefined,
        is_active: p.is_active !== false,
        image_url: p.image_url || undefined,
        description: p.description || "",
        brand: p.brand || "",
        size: p.size || "",
        color: p.color || "",
        material: p.material || "",
        id: p.id,
        name: p.name || "Unnamed Product",
      }))

      // Fetch variation counts
      try {
        const productIds = normalized.map((p) => p.id)
        if (productIds.length > 0) {
          const { data: varCounts } = await supabase
            .from("product_variations")
            .select("product_id")
            .in("product_id", productIds)
            .eq("is_active", true)

          if (varCounts) {
            const countMap: Record<string, number> = {}
            for (const row of varCounts) {
              countMap[row.product_id] = (countMap[row.product_id] || 0) + 1
            }
            for (const p of normalized) {
              ;(p as any)._variation_count = countMap[p.id] || 0
            }
          }
        }
      } catch (varErr) {
        console.debug("Could not fetch variation counts:", varErr)
      }

      setProducts(normalized)
    } catch (error) {
      console.error("Error fetching products:", error)
      toast.error("Failed to load products")
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchProducts()
    setRefreshing(false)
    toast.success("Inventory refreshed")
  }

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product)
    setEditorOpen(true)
  }

  const handleDeleteProduct = (productId: string, productName: string) => {
    showConfirmation({
      title: "Delete Product",
      description: `Are you sure you want to delete "${productName}"? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive",
      onConfirm: async () => {
        try {
          const { error } = await supabase.from("products").update({ is_active: false }).eq("id", productId)
          if (error) throw error
          toast.success("Product deleted")
          fetchProducts()
        } catch (error) {
          console.error("Delete error:", error)
          toast.error("Failed to delete product")
        }
      },
    })
  }

  const handleSaveProduct = async (data: any) => {
    try {
      const { images, variants, ...productData } = data
      let productId = selectedProduct?.id

      if (productId) {
        // Update existing
        await supabase.from("products").update(productData).eq("id", productId)

        // Save images
        if (images && images.length > 0) {
          await supabase.from("product_images").delete().eq("product_id", productId)
          const imagesToInsert = images.map((img: any, idx: number) => ({
            product_id: productId,
            url: img.url,
            is_main: img.is_main,
            order: idx,
          }))
          await supabase.from("product_images").insert(imagesToInsert)
        }

        toast.success("Product updated successfully")
      } else {
        // Create new
        const { data: newProduct, error } = await supabase
          .from("products")
          .insert([{ ...productData, franchise_id: user?.franchise_id }])
          .select()
          .single()

        if (error) throw error

        productId = newProduct.id

        // Save images
        if (images && images.length > 0) {
          const imagesToInsert = images.map((img: any, idx: number) => ({
            product_id: productId,
            url: img.url,
            is_main: img.is_main,
            order: idx,
          }))
          await supabase.from("product_images").insert(imagesToInsert)
        }

        toast.success("Product created successfully")
      }

      // Save variants
      if (variants && variants.length > 0 && productId) {
        for (const variant of variants) {
          // Skip if variant already has an ID (already saved)
          if (variant.id) {
            continue
          }

          const response = await fetch(`/api/products/${productId}/variations`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              variation_name: variant.variation_name,
              color: variant.color,
              design: variant.design,
              material: variant.material,
              size: variant.size,
              sku: variant.sku,
              price_adjustment: variant.price_adjustment || 0,
              rental_price_adjustment: variant.rental_price_adjustment || 0,
              stock_total: variant.stock_total || 0,
              stock_available: variant.stock_available || 0,
              image_url: variant.image_url,
            }),
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(`Failed to save variant: ${error.error}`)
          }
        }
      }

      fetchProducts()
    } catch (error) {
      console.error("Save error:", error)
      toast.error("Failed to save product")
    }
  }

  const filteredProducts = useMemo(() => {
    let filtered = products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        product.brand?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        (product.barcode && product.barcode.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))

      if (!matchesSearch) return false

      if (stockFilter !== "all") {
        if (stockFilter === "in_stock" && product.stock_available <= product.reorder_level) return false
        if (stockFilter === "low_stock" && (product.stock_available > product.reorder_level || product.stock_available === 0))
          return false
        if (stockFilter === "out_of_stock" && product.stock_available > 0) return false
      }

      return true
    })

    return filtered.sort((a, b) => b.stock_available - a.stock_available)
  }, [products, debouncedSearchTerm, stockFilter])

  const stats = {
    total: products.length,
    inStock: products.filter((p) => p.stock_available > p.reorder_level).length,
    lowStock: products.filter((p) => p.stock_available <= p.reorder_level && p.stock_available > 0).length,
    outOfStock: products.filter((p) => p.stock_available <= 0).length,
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-3">
            <Package className="w-12 h-12 text-muted-foreground/50 mx-auto" />
            <p className="text-muted-foreground">Loading inventory...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
            <p className="text-muted-foreground">Manage products, variants, pricing & barcodes</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              onClick={() => {
                setSelectedProduct(null)
                setEditorOpen(true)
              }}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Package className="w-8 h-8 text-muted-foreground/50" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">In Stock</p>
                <p className="text-2xl font-bold text-green-600">{stats.inStock}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600/50" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Low Stock</p>
                <p className="text-2xl font-bold text-amber-600">{stats.lowStock}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-amber-600/50" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600/50" />
            </div>
          </Card>
        </div>

        {/* Search & Filters */}
        <div className="flex gap-3 items-end">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search products, brand, barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Select value={stockFilter} onValueChange={(value: any) => setStockFilter(value)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Stock Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Products</SelectItem>
              <SelectItem value="in_stock">In Stock</SelectItem>
              <SelectItem value="low_stock">Low Stock</SelectItem>
              <SelectItem value="out_of_stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>

          <Link href="/inventory/categories">
            <Button variant="outline" size="sm" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Categories
            </Button>
          </Link>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">
              {debouncedSearchTerm || stockFilter !== "all"
                ? "No products found"
                : "No products yet. Create your first product!"}
            </p>
            <Button
              onClick={() => {
                setSelectedProduct(null)
                setEditorOpen(true)
              }}
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={handleEditProduct}
                onDelete={handleDeleteProduct}
                onGenerateBarcode={(p) => {
                  setSelectedProductForBarcode(p)
                  setBarcodeDialogOpen(true)
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Editor Modal */}
      <ProductEditorModal
        open={editorOpen}
        onOpenChange={setEditorOpen}
        product={selectedProduct}
        onSave={handleSaveProduct}
        franchiseId={user?.franchise_id}
      />

      {/* Confirmation Dialog */}
      <ConfirmationDialog />
    </DashboardLayout>
  )
}
