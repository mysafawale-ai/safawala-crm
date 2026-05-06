"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Edit, Trash2, Eye, ImageIcon } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ProductViewDialog } from "@/components/inventory/product-view-dialog"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import Link from "next/link"
import { useConfirmationDialog } from "@/components/ui/confirmation-dialog"

interface User {
  id: string
  email: string
  role: string
  franchise_id: string
}

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
  barcode_number?: string
  qr_code?: string
  is_active: boolean
  created_at: string
  updated_at: string
  category_id?: string
  subcategory_id?: string
  image_url?: string
  is_custom?: boolean
}

type StockFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock'

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [stockFilter, setStockFilter] = useState<StockFilter>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog()
  const ITEMS_PER_PAGE = 30

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(searchTerm); setCurrentPage(1) }, 300)
    return () => clearTimeout(t)
  }, [searchTerm])

  useEffect(() => { fetchProducts() }, [])

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

      const active = (data || []).filter((p: any) => p.is_active !== false)
      const normalized: Product[] = active.map((p: any) => ({
        product_code: p.product_code || p.id?.slice(0, 8) || "CUST",
        price: typeof p.price === 'number' ? p.price : 0,
        rental_price: typeof p.rental_price === 'number' ? p.rental_price : 0,
        cost_price: typeof p.cost_price === 'number' ? p.cost_price : 0,
        security_deposit: typeof p.security_deposit === 'number' ? p.security_deposit : 0,
        stock_total: typeof p.stock_total === 'number' ? p.stock_total : 0,
        stock_available: typeof p.stock_available === 'number' ? p.stock_available : 0,
        stock_booked: typeof p.stock_booked === 'number' ? p.stock_booked : 0,
        stock_damaged: typeof p.stock_damaged === 'number' ? p.stock_damaged : 0,
        stock_in_laundry: typeof p.stock_in_laundry === 'number' ? p.stock_in_laundry : 0,
        reorder_level: typeof p.reorder_level === 'number' ? p.reorder_level : 0,
        usage_count: typeof p.usage_count === 'number' ? p.usage_count : 0,
        damage_count: typeof p.damage_count === 'number' ? p.damage_count : 0,
        barcode: p.barcode || p.barcode_number || undefined,
        barcode_number: p.barcode_number || undefined,
        qr_code: p.qr_code || undefined,
        is_active: p.is_active !== false,
        created_at: p.created_at || new Date().toISOString(),
        updated_at: p.updated_at || p.created_at || new Date().toISOString(),
        category_id: p.category_id || undefined,
        subcategory_id: p.subcategory_id || undefined,
        image_url: p.image_url || undefined,
        description: p.description || '',
        brand: p.brand || '',
        size: p.size || '',
        color: p.color || '',
        material: p.material || '',
        id: p.id,
        name: p.name || 'Unnamed Product',
        is_custom: p.is_custom === true,
      }))

      // Fetch variation counts
      try {
        const ids = normalized.map(p => p.id)
        if (ids.length > 0) {
          const { data: varCounts } = await supabase
            .from("product_variations").select("product_id").in("product_id", ids).eq("is_active", true)
          if (varCounts) {
            const countMap: Record<string, number> = {}
            for (const row of varCounts) countMap[row.product_id] = (countMap[row.product_id] || 0) + 1
            for (const p of normalized) (p as any)._variation_count = countMap[p.id] || 0
          }
        }
      } catch { /* ignore */ }

      setProducts(normalized)
    } catch (error) {
      console.error("Error fetching products:", error)
      toast.error("Failed to load products")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (productId: string, productName: string) => {
    showConfirmation({
      title: "Delete Product",
      description: `Delete "${productName}"? This cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive",
      onConfirm: async () => {
        try {
          const { data: bookingItems } = await supabase
            .from("booking_items").select("id").eq("product_id", productId).limit(1)
          if (bookingItems && bookingItems.length > 0) {
            toast.error("Cannot delete: product is used in existing bookings")
            return
          }
          const { error } = await supabase.from("products").update({ is_active: false }).eq("id", productId)
          if (error) throw error
          toast.success("Product deleted")
          fetchProducts()
        } catch {
          toast.error("Failed to delete product")
        }
      },
    })
  }

  const filtered = useMemo(() => {
    return products.filter(p => {
      const q = debouncedSearch.toLowerCase()
      if (q && !p.name.toLowerCase().includes(q) && !(p.barcode || '').toLowerCase().includes(q) && !(p.brand || '').toLowerCase().includes(q)) return false
      if (stockFilter === 'in_stock' && p.stock_available <= p.reorder_level) return false
      if (stockFilter === 'low_stock' && (p.stock_available > p.reorder_level || p.stock_available === 0)) return false
      if (stockFilter === 'out_of_stock' && p.stock_available > 0) return false
      return true
    })
  }, [products, debouncedSearch, stockFilter])

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filtered.slice(start, start + ITEMS_PER_PAGE)
  }, [filtered, currentPage])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)

  const stockCounts = useMemo(() => ({
    all: products.length,
    in_stock: products.filter(p => p.stock_available > p.reorder_level).length,
    low_stock: products.filter(p => p.stock_available <= p.reorder_level && p.stock_available > 0).length,
    out_of_stock: products.filter(p => p.stock_available <= 0).length,
  }), [products])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-4 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="h-7 w-32 bg-muted rounded" />
            <div className="h-9 w-28 bg-muted rounded" />
          </div>
          <div className="h-10 w-80 bg-muted rounded" />
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-14 bg-muted rounded-lg" />
          ))}
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Inventory</h1>
            <p className="text-sm text-muted-foreground">{products.length} products total</p>
          </div>
          <Link href="/inventory/add">
            <Button size="sm" className="h-9">
              <Plus className="w-4 h-4 mr-1.5" />
              Add Product
            </Button>
          </Link>
        </div>

        {/* Search + Filter */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, barcode, brand..."
              className="pl-9 h-9"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center rounded-lg border bg-muted/30 p-0.5 gap-0.5">
            {([
              { key: 'all', label: 'All' },
              { key: 'in_stock', label: 'In Stock' },
              { key: 'low_stock', label: 'Low' },
              { key: 'out_of_stock', label: 'Out' },
            ] as { key: StockFilter; label: string }[]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { setStockFilter(key); setCurrentPage(1) }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  stockFilter === key
                    ? 'bg-white shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
                <span className={`ml-1.5 text-[10px] ${stockFilter === key ? 'text-muted-foreground' : 'text-muted-foreground/60'}`}>
                  {stockCounts[key]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border overflow-hidden bg-white dark:bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50/80 dark:bg-muted/30">
                <th className="w-12 px-4 py-2.5" />
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5">Product</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5 hidden md:table-cell">Barcode</th>
                <th className="text-center text-xs font-medium text-muted-foreground px-4 py-2.5">Stock</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-2.5">Rental</th>
                <th className="w-24 px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16">
                    <div className="text-muted-foreground">
                      <p className="text-sm font-medium">No products found</p>
                      {debouncedSearch && (
                        <button className="text-xs text-primary mt-1 underline" onClick={() => setSearchTerm('')}>
                          Clear search
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map(product => {
                  const isOut = product.stock_available <= 0
                  const isLow = !isOut && product.stock_available <= product.reorder_level
                  const varCount = (product as any)._variation_count || 0

                  return (
                    <tr
                      key={product.id}
                      className="border-b last:border-0 hover:bg-gray-50/50 dark:hover:bg-muted/20 transition-colors group"
                    >
                      {/* Image */}
                      <td className="px-4 py-3">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-9 h-9 object-cover rounded-lg border"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg border bg-gray-100 dark:bg-muted flex items-center justify-center">
                            <ImageIcon className="w-4 h-4 text-muted-foreground/40" />
                          </div>
                        )}
                      </td>

                      {/* Name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-medium leading-none">{product.name}</p>
                              {product.is_custom && (
                                <Badge variant="outline" className="text-[9px] px-1 py-0 border-amber-300 text-amber-600 bg-amber-50">
                                  Custom
                                </Badge>
                              )}
                              {varCount > 0 && (
                                <Badge variant="outline" className="text-[9px] px-1 py-0 border-violet-200 text-violet-600 bg-violet-50">
                                  {varCount} var
                                </Badge>
                              )}
                            </div>
                            {product.brand && (
                              <p className="text-xs text-muted-foreground mt-0.5">{product.brand}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Barcode */}
                      <td className="px-4 py-3 hidden md:table-cell">
                        <code className="text-xs text-muted-foreground font-mono">
                          {product.barcode || '—'}
                        </code>
                      </td>

                      {/* Stock */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                            isOut ? 'bg-red-500' : isLow ? 'bg-amber-400' : 'bg-green-500'
                          }`} />
                          <span className="text-sm font-medium tabular-nums">{product.stock_available}</span>
                          <span className="text-xs text-muted-foreground">/{product.stock_total}</span>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-medium">₹{product.rental_price.toLocaleString()}</span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            title="View details"
                            onClick={() => { setSelectedProduct(product); setViewDialogOpen(true) }}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Link href={`/inventory/edit/${product.id}`}>
                            <Button variant="ghost" size="icon" className="h-7 w-7" title="Edit">
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-red-600"
                            title="Delete"
                            onClick={() => handleDelete(product.id, product.name)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination — only if needed */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}</span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-8" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                Previous
              </Button>
              <span className="px-2 text-xs">{currentPage} / {totalPages}</span>
              <Button variant="outline" size="sm" className="h-8" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}

      </div>

      <ProductViewDialog product={selectedProduct} open={viewDialogOpen} onOpenChange={setViewDialogOpen} />
      <ConfirmationDialog />
    </DashboardLayout>
  )
}
