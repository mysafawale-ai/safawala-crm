"use client"

import { useState, useEffect, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Package, Plus, Search, RefreshCw, AlertTriangle, CheckCircle,
  BarChart3, IndianRupee, ArrowUpDown, TrendingUp, Boxes
} from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ProductCard } from "@/components/inventory/product-card"
import { ProductEditorModal } from "@/components/inventory/product-editor-modal"
import { BarcodePrintDialog } from "@/components/inventory/barcode-print-dialog"
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
  category_id?: string
  category_name?: string
  price: number
  regular_price?: number
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
  created_at?: string
}

// Animated counter hook
function useAnimatedCount(target: number, duration: number = 600) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (target === 0) { setCount(0); return }
    let start = 0
    const increment = target / (duration / 16)
    const timer = setInterval(() => {
      start += increment
      if (start >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration])
  return count
}

// Skeleton loading card
function SkeletonCard() {
  return (
    <div className="card-heritage rounded-xl overflow-hidden animate-pulse">
      <div className="w-full aspect-square bg-gradient-to-br from-[#f9f2e8] to-[#f6e1c3]/40" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-[#f6e1c3]/60 rounded w-3/4" />
        <div className="h-3 bg-[#f6e1c3]/40 rounded w-1/2" />
        <div className="flex gap-2">
          <div className="h-5 bg-[#f6e1c3]/50 rounded-full w-16" />
          <div className="h-5 bg-[#f6e1c3]/50 rounded-full w-12" />
        </div>
        <div className="border-t border-[#102516]/5 pt-3 space-y-2">
          <div className="flex justify-between">
            <div className="h-3 bg-[#f6e1c3]/40 rounded w-12" />
            <div className="h-3 bg-[#f6e1c3]/60 rounded w-16" />
          </div>
          <div className="flex justify-between">
            <div className="h-3 bg-[#f6e1c3]/40 rounded w-10" />
            <div className="h-3 bg-[#f6e1c3]/60 rounded w-14" />
          </div>
        </div>
      </div>
    </div>
  )
}

// Stat card component
function StatCard({
  title, value, icon: Icon, color, subtext, prefix = ""
}: {
  title: string
  value: number
  icon: React.ElementType
  color: string
  subtext: string
  prefix?: string
}) {
  const animatedValue = useAnimatedCount(value)
  const colorMap: Record<string, { bg: string; icon: string; text: string; glow: string }> = {
    default: {
      bg: "from-[#fcf7f0] to-[#f9f2e8]",
      icon: "text-[#102516] bg-[#102516]/8",
      text: "text-[#102516]",
      glow: "shadow-[0_8px_25px_rgba(16,37,22,0.08)]",
    },
    green: {
      bg: "from-emerald-50/80 to-[#fcf7f0]",
      icon: "text-emerald-700 bg-emerald-100",
      text: "text-emerald-700",
      glow: "shadow-[0_8px_25px_rgba(16,185,129,0.1)]",
    },
    amber: {
      bg: "from-amber-50/80 to-[#fcf7f0]",
      icon: "text-amber-700 bg-amber-100",
      text: "text-amber-700",
      glow: "shadow-[0_8px_25px_rgba(245,158,11,0.1)]",
    },
    red: {
      bg: "from-red-50/80 to-[#fcf7f0]",
      icon: "text-red-700 bg-red-100",
      text: "text-red-700",
      glow: "shadow-[0_8px_25px_rgba(239,68,68,0.1)]",
    },
    royal: {
      bg: "from-[#f6e1c3]/40 to-[#fcf7f0]",
      icon: "text-[#102516] bg-[#f6e1c3]",
      text: "text-[#102516]",
      glow: "shadow-[0_8px_25px_rgba(16,37,22,0.12)]",
    },
  }
  const c = colorMap[color] || colorMap.default

  return (
    <Card
      className={`relative overflow-hidden border border-[#102516]/8 bg-gradient-to-br ${c.bg} ${c.glow}
        hover:translate-y-[-2px] hover:shadow-lg transition-all duration-300 group`}
    >
      {/* Heritage top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#102516]/30 to-transparent" />
      <div className="p-4 flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-[#102516]/60 uppercase tracking-wider" style={{ fontFamily: "var(--font-crimson), serif" }}>
            {title}
          </p>
          <p className={`text-2xl font-bold ${c.text} tracking-tight`}>
            {prefix}{animatedValue.toLocaleString()}
          </p>
          <p className="text-[10px] text-[#102516]/50" style={{ fontFamily: "var(--font-crimson), serif" }}>
            {subtext}
          </p>
        </div>
        <div className={`w-11 h-11 rounded-xl ${c.icon} flex items-center justify-center
          group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </Card>
  )
}

export default function InventoryDashboard() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [stockFilter, setStockFilter] = useState<"all" | "in_stock" | "low_stock" | "out_of_stock">("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [sortBy, setSortBy] = useState<"created_desc" | "stock_desc" | "stock_asc" | "name_asc" | "name_desc" | "price_asc" | "price_desc">("created_desc")
  const [user, setUser] = useState<User | null>(null)

  // Load filters from sessionStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedSearch = sessionStorage.getItem("inventory_searchTerm")
      const savedStock = sessionStorage.getItem("inventory_stockFilter")
      const savedCategory = sessionStorage.getItem("inventory_categoryFilter")
      const savedSort = sessionStorage.getItem("inventory_sortBy")

      if (savedSearch !== null) {
        setSearchTerm(savedSearch)
        setDebouncedSearchTerm(savedSearch)
      }
      if (savedStock !== null) setStockFilter(savedStock as any)
      if (savedCategory !== null) setCategoryFilter(savedCategory)
      if (savedSort !== null) setSortBy(savedSort as any)
    }
  }, [])

  // Clear filters from sessionStorage on client-side navigation away
  useEffect(() => {
    const handleBeforeUnload = () => {
      ;(window as any).isUnloading = true
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      if (!(window as any).isUnloading) {
        sessionStorage.removeItem("inventory_searchTerm")
        sessionStorage.removeItem("inventory_stockFilter")
        sessionStorage.removeItem("inventory_categoryFilter")
        sessionStorage.removeItem("inventory_sortBy")
      }
    }
  }, [])
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

      // Fetch categories from product_categories table
      try {
        let catQuery = supabase
          .from("product_categories")
          .select("id, name")
          .eq("is_active", true)
          .is("parent_id", null) // Only main categories, not subcategories
          .order("name", { ascending: true })

        // Categories are global — no franchise filter needed (products are already franchise-isolated)
        const { data: catData, error: catError } = await catQuery

        if (!catError && catData && catData.length > 0) {
          setCategories(catData)
        } else {
          console.log("No categories found in product_categories table")
          setCategories([])
        }
      } catch (catErr) {
        console.error("Categories fetch error:", catErr)
        setCategories([])
      }

      let query = supabase.from("products").select("*").order("created_at", { ascending: false }).limit(3000)

      if (currentUser.role !== "super_admin" && currentUser.franchise_id) {
        query = query.eq("franchise_id", currentUser.franchise_id)
      }

      const { data, error } = await query
      if (error) throw error

      const activeData = (data || []).filter((p: any) => p.is_active !== false)

      const normalized: Product[] = activeData.map((p: any) => ({
        id: p.id,
        name: p.name || "Unnamed Product",
        description: p.description || "",
        brand: p.brand || "",
        size: p.size || "",
        color: p.color || "",
        material: p.material || "",
        price: typeof p.price === "number" ? p.price : typeof p.sale_price === "number" ? p.sale_price : 0,
        regular_price: typeof p.regular_price === "number" ? p.regular_price : typeof p.price === "number" ? p.price : 0,
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
        image_url: p.image_url || undefined,
        category_id: p.category_id || undefined,
        category_name: p.category_name || undefined,
        is_active: p.is_active !== false,
        product_code: p.product_code || p.id?.slice(0, 8) || "CUST",
        created_at: p.created_at || "",
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

  // Build a category name lookup map for product cards
  const categoryNameMap = useMemo(() => {
    const map: Record<string, string> = {}
    for (const cat of categories) {
      map[cat.id] = cat.name
    }
    return map
  }, [categories])

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
    // Strip frontend-only fields that are not columns in the products table
    const { images, variants, _variation_count, category_name, product_code, ...productData } = data
    let productId = selectedProduct?.id

    if (productId) {
      const { error: updateError } = await supabase.from("products").update(productData).eq("id", productId)
      if (updateError) throw updateError

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
    } else {
      const { data: newProduct, error } = await supabase
        .from("products")
        .insert([{ ...productData, franchise_id: user?.franchise_id }])
        .select()
        .single()

      if (error) throw error

      productId = newProduct.id

      if (images && images.length > 0) {
        const imagesToInsert = images.map((img: any, idx: number) => ({
          product_id: productId,
          url: img.url,
          is_main: img.is_main,
          order: idx,
        }))
        await supabase.from("product_images").insert(imagesToInsert)
      }
    }

    if (variants && variants.length > 0 && productId) {
      for (const variant of variants) {
        if (variant.id) continue

        let imageUrl = variant.image_url

        if (imageUrl && imageUrl.startsWith("data:")) {
          try {
            const base64Data = imageUrl.split(",")[1]
            const buffer = Buffer.from(base64Data, "base64")
            const timestamp = Date.now()
            const variantName = variant.variation_name.replace(/\s+/g, "_").toLowerCase()
            const storagePath = `variants/${user?.franchise_id}/${productId}/${timestamp}-${variantName}.png`

            const { error: uploadError } = await supabase.storage
              .from("product-images")
              .upload(storagePath, buffer, { upsert: false, contentType: "image/png" })

            if (uploadError) throw new Error(`Failed to upload variant image: ${uploadError.message}`)

            const { data: urlData } = supabase.storage
              .from("product-images")
              .getPublicUrl(storagePath)

            imageUrl = urlData.publicUrl
          } catch (imgError) {
            console.warn("Variant image upload failed, saving without image:", imgError)
            imageUrl = null
          }
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
            image_url: imageUrl,
          }),
        })

        if (!response.ok) {
          const errData = await response.json()
          throw new Error(`Variant "${variant.variation_name}": ${errData.error}`)
        }
      }
    }

    fetchProducts()
  }

  const filteredProducts = useMemo(() => {
    let filtered = products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        product.brand?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        (product.barcode && product.barcode.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))

      if (!matchesSearch) return false

      if (categoryFilter !== "all" && product.category_id !== categoryFilter) return false

      if (stockFilter !== "all") {
        if (stockFilter === "in_stock" && product.stock_available <= product.reorder_level) return false
        if (stockFilter === "low_stock" && (product.stock_available > product.reorder_level || product.stock_available === 0))
          return false
        if (stockFilter === "out_of_stock" && product.stock_available > 0) return false
      }

      return true
    })

    // Apply sorting
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "created_desc":
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        case "stock_desc": return b.stock_available - a.stock_available
        case "stock_asc": return a.stock_available - b.stock_available
        case "name_asc": return a.name.localeCompare(b.name)
        case "name_desc": return b.name.localeCompare(a.name)
        case "price_asc": return a.rental_price - b.rental_price
        case "price_desc": return b.rental_price - a.rental_price
        default: return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      }
    })
  }, [products, debouncedSearchTerm, stockFilter, categoryFilter, sortBy])

  const stats = {
    total: products.length,
    inStock: products.filter((p) => p.stock_available > p.reorder_level).length,
    lowStock: products.filter((p) => p.stock_available <= p.reorder_level && p.stock_available > 0).length,
    outOfStock: products.filter((p) => p.stock_available <= 0).length,
    inventoryValue: products.reduce((sum, p) => sum + (p.price * p.stock_available), 0),
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          {/* Skeleton Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-8 w-48 bg-[#f6e1c3]/60 rounded animate-pulse" />
              <div className="h-4 w-72 bg-[#f6e1c3]/40 rounded animate-pulse" />
            </div>
            <div className="flex gap-2">
              <div className="h-9 w-24 bg-[#f6e1c3]/50 rounded-lg animate-pulse" />
              <div className="h-9 w-32 bg-[#102516]/20 rounded-lg animate-pulse" />
            </div>
          </div>

          {/* Skeleton Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="p-4 card-heritage animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-3 w-16 bg-[#f6e1c3]/50 rounded" />
                    <div className="h-7 w-12 bg-[#f6e1c3]/70 rounded" />
                    <div className="h-2 w-20 bg-[#f6e1c3]/30 rounded" />
                  </div>
                  <div className="w-11 h-11 bg-[#f6e1c3]/40 rounded-xl" />
                </div>
              </Card>
            ))}
          </div>

          {/* Skeleton Search Bar */}
          <div className="flex gap-3 items-end flex-wrap">
            <div className="flex-1 min-w-48 max-w-md h-10 bg-[#f6e1c3]/40 rounded-lg animate-pulse" />
            <div className="h-10 w-36 bg-[#f6e1c3]/40 rounded-lg animate-pulse" />
            <div className="h-10 w-36 bg-[#f6e1c3]/40 rounded-lg animate-pulse" />
          </div>

          {/* Skeleton Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Heritage Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-3xl font-bold tracking-tight text-[#102516]"
              style={{ fontFamily: "var(--font-playfair), serif" }}
            >
              Inventory
            </h1>
            <p className="text-[#102516]/60 text-sm" style={{ fontFamily: "var(--font-crimson), serif" }}>
              Manage products, variants, pricing & barcodes
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="gap-2 border-[#102516]/15 text-[#102516] hover:bg-[#f9f2e8] hover:border-[#102516]/30 transition-all duration-300"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              onClick={() => {
                setSelectedProduct(null)
                setEditorOpen(true)
              }}
              className="gap-2 bg-gradient-to-r from-[#102516] to-[#1a3a26] text-[#fefaf6] hover:shadow-lg hover:translate-y-[-1px] transition-all duration-300"
              style={{ fontFamily: "var(--font-cinzel), serif", letterSpacing: "0.5px" }}
            >
              <Plus className="w-4 h-4" />
              Add Product
            </Button>
          </div>
        </div>

        {/* Heritage divider line */}
        <div className="h-[1px] bg-gradient-to-r from-transparent via-[#102516]/20 to-transparent" />

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard
            title="Total Products"
            value={stats.total}
            icon={Boxes}
            color="default"
            subtext="Active in inventory"
          />
          <StatCard
            title="In Stock"
            value={stats.inStock}
            icon={CheckCircle}
            color="green"
            subtext="Above reorder level"
          />
          <StatCard
            title="Low Stock"
            value={stats.lowStock}
            icon={AlertTriangle}
            color="amber"
            subtext="Below reorder level"
          />
          <StatCard
            title="Out of Stock"
            value={stats.outOfStock}
            icon={AlertTriangle}
            color="red"
            subtext="Needs restocking"
          />
          <StatCard
            title="Inventory Value"
            value={stats.inventoryValue}
            icon={IndianRupee}
            color="royal"
            subtext="Total stock value"
            prefix="₹"
          />
        </div>

        {/* Search, Filters & Sort */}
        <div className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-48 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#102516]/40" />
              <Input
                placeholder="Search products, brand, barcode..."
                value={searchTerm}
                onChange={(e) => {
                  const val = e.target.value
                  setSearchTerm(val)
                  sessionStorage.setItem("inventory_searchTerm", val)
                }}
                className="pl-10 border-[#102516]/15 bg-[#fefaf6] focus:border-[#102516]/40 focus:ring-[#102516]/10 transition-all"
              />
            </div>
          </div>

          <Select value={stockFilter} onValueChange={(value: any) => {
            setStockFilter(value)
            sessionStorage.setItem("inventory_stockFilter", value)
          }}>
            <SelectTrigger className="w-40 border-[#102516]/15 bg-[#fefaf6]">
              <SelectValue placeholder="Stock Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Products</SelectItem>
              <SelectItem value="in_stock">In Stock</SelectItem>
              <SelectItem value="low_stock">Low Stock</SelectItem>
              <SelectItem value="out_of_stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={(value: any) => {
            setCategoryFilter(value)
            sessionStorage.setItem("inventory_categoryFilter", value)
          }}>
            <SelectTrigger className="w-40 border-[#102516]/15 bg-[#fefaf6]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value: any) => {
            setSortBy(value)
            sessionStorage.setItem("inventory_sortBy", value)
          }}>
            <SelectTrigger className="w-44 border-[#102516]/15 bg-[#fefaf6]">
              <ArrowUpDown className="w-3.5 h-3.5 mr-1.5 text-[#102516]/50" />
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_desc">Last Added First</SelectItem>
              <SelectItem value="stock_desc">Stock: High → Low</SelectItem>
              <SelectItem value="stock_asc">Stock: Low → High</SelectItem>
              <SelectItem value="name_asc">Name: A → Z</SelectItem>
              <SelectItem value="name_desc">Name: Z → A</SelectItem>
              <SelectItem value="price_asc">Price: Low → High</SelectItem>
              <SelectItem value="price_desc">Price: High → Low</SelectItem>
            </SelectContent>
          </Select>

          <Link href="/inventory/categories">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-[#102516]/15 text-[#102516] hover:bg-[#f9f2e8] hover:border-[#102516]/30"
            >
              <BarChart3 className="w-4 h-4" />
              Categories
            </Button>
          </Link>
        </div>

        {/* Results count */}
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="text-xs bg-[#fcf7f0] border-[#102516]/10 text-[#102516]/70"
            style={{ fontFamily: "var(--font-crimson), serif" }}
          >
            {filteredProducts.length} of {products.length} products
          </Badge>
          {(debouncedSearchTerm || stockFilter !== "all" || categoryFilter !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("")
                setStockFilter("all")
                setCategoryFilter("all")
                sessionStorage.removeItem("inventory_searchTerm")
                sessionStorage.removeItem("inventory_stockFilter")
                sessionStorage.removeItem("inventory_categoryFilter")
              }}
              className="text-xs text-[#102516]/50 hover:text-[#102516] underline transition-colors"
              style={{ fontFamily: "var(--font-crimson), serif" }}
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <Card className="card-heritage p-12 text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-[#102516]/5 flex items-center justify-center">
                <Package className="w-8 h-8 text-[#102516]/30" />
              </div>
              <div>
                <p
                  className="text-[#102516]/70 font-medium"
                  style={{ fontFamily: "var(--font-playfair), serif" }}
                >
                  {debouncedSearchTerm || stockFilter !== "all"
                    ? "No products match your filters"
                    : "Your inventory is empty"}
                </p>
                <p
                  className="text-sm text-[#102516]/40 mt-1"
                  style={{ fontFamily: "var(--font-crimson), serif" }}
                >
                  {debouncedSearchTerm || stockFilter !== "all"
                    ? "Try adjusting your search or filters"
                    : "Add your first product to get started"}
                </p>
              </div>
              <Button
                onClick={() => {
                  setSelectedProduct(null)
                  setEditorOpen(true)
                }}
                size="sm"
                className="bg-gradient-to-r from-[#102516] to-[#1a3a26] text-[#fefaf6] hover:shadow-lg transition-all"
                style={{ fontFamily: "var(--font-cinzel), serif" }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={{
                  ...product,
                  // Resolve category name from the map if not already set
                  category_name: product.category_name || (product.category_id ? categoryNameMap[product.category_id] : undefined),
                }}
                onEdit={(p: any) => handleEditProduct(p)}
                onDelete={handleDeleteProduct}
                onGenerateBarcode={(p: any) => {
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
        product={selectedProduct as any}
        onSave={handleSaveProduct}
        franchiseId={user?.franchise_id}
      />

      {/* Barcode Print Dialog */}
      <BarcodePrintDialog
        open={barcodeDialogOpen}
        onOpenChange={setBarcodeDialogOpen}
        product={selectedProductForBarcode as any}
      />

      {/* Confirmation Dialog */}
      <ConfirmationDialog />
    </DashboardLayout>
  )
}
