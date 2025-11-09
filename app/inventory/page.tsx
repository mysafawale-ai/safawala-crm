"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Package,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
  CheckCircle,
  Filter,
  Barcode,
  ImageIcon,
  Info,
  RefreshCw,
  TrendingUp,
} from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ProductViewDialog } from "@/components/inventory/product-view-dialog"
import { BulkBarcodeGenerator } from "@/components/inventory/bulk-barcode-generator"
import { InventoryImportExportDialog } from "@/components/inventory/import-export-dialog"
// import { StockMovementDialog } from "@/components/inventory/stock-movement-dialog"
import { supabase } from "@/lib/supabase"

interface User {
  id: string
  email: string
  role: string
  franchise_id: string
}
import { toast } from "sonner"
import Link from "next/link"
import { useConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { TableSkeleton, StatCardSkeleton, PageLoader } from "@/components/ui/skeleton-loader"

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
  image_url?: string // Added image_url field
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [filterDialogOpen, setFilterDialogOpen] = useState(false)
  const [importExportOpen, setImportExportOpen] = useState(false)
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>('all')
  const [categories, setCategories] = useState<Array<{id: string, name: string}>>([])  
  const [subcategories, setSubcategories] = useState<Array<{id: string, name: string, parent_id: string}>>([])
  const [sortField, setSortField] = useState<'name' | 'stock' | 'price' | 'rental' | 'created_at'>('created_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [sortOption, setSortOption] = useState<'name_asc' | 'name_desc' | 'price_low_high' | 'price_high_low' | 'newest' | 'oldest'>('newest')
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [barcodeDialogOpen, setBarcodeDialogOpen] = useState(false)

  const [selectedProductForBarcode, setSelectedProductForBarcode] = useState<Product | null>(null)
  const [user, setUser] = useState<User | null>(null)
  // const [stockMovementDialogOpen, setStockMovementDialogOpen] = useState(false)
  // const [selectedProductForStock, setSelectedProductForStock] = useState<Product | null>(null)

  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog()

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
      setCurrentPage(1) // Reset to first page on search
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])


  useEffect(() => {
    fetchProductsForUser()
    fetchCategories()
  }, [])

  const fetchProductsForUser = async () => {
    try {
      setLoading(true)
      // Get current user from API
      const userRes = await fetch("/api/auth/user")
      if (!userRes.ok) throw new Error("Failed to fetch user")
      const currentUser: User = await userRes.json()
      setUser(currentUser)
      
      let query = supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
      // Only filter by franchise for non-super-admins
      if (currentUser.role !== "super_admin" && currentUser.franchise_id) {
        query = query.eq("franchise_id", currentUser.franchise_id)
      }
      const { data, error } = await query
      if (error) throw error
      // Use barcode directly from products table
      setProducts((data || []) as Product[])
    } catch (error) {
      console.error("Error fetching products:", error)
      toast.error("Failed to load products")
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const { data: cats, error: catError } = await supabase
        .from('product_categories')
        .select('id, name, parent_id')
        .eq('is_active', true)
        .order('name')
      
      if (catError) throw catError
      
      // Separate main categories and subcategories
      const mainCats = cats?.filter((c: { id: string; name: string; parent_id: string | null }) => !c.parent_id) || []
      const subCats = cats?.filter((c: { id: string; name: string; parent_id: string | null }) => c.parent_id) || []
      
      setCategories(mainCats)
      setSubcategories(subCats)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product)
    setViewDialogOpen(true)
  }

  // const handleStockMovement = (product: Product) => {
  //   setSelectedProductForStock(product)
  //   setStockMovementDialogOpen(true)
  // }

  const handleDeleteProduct = async (productId: string, productName: string) => {
    console.log("[v0] Delete button clicked for product:", { productId, productName })

    showConfirmation({
      title: "Delete Product",
      description: `Are you sure you want to delete "${productName}"? This will affect all related bookings and cannot be undone.`,
      confirmText: "Delete Product",
      cancelText: "Cancel",
      variant: "destructive",
      onConfirm: async () => {
        try {
          // Check if product is used in any active bookings
          const { data: bookingItems, error: checkError } = await supabase
            .from("booking_items")
            .select("id, booking_id")
            .eq("product_id", productId)
            .limit(1)

          if (checkError) throw checkError

          if (bookingItems && bookingItems.length > 0) {
            toast.error("Cannot delete product: It is used in existing bookings")
            return
          }

          const { error } = await supabase.from("products").update({ is_active: false }).eq("id", productId)

          if (error) throw error

          toast.success("Product deleted successfully")
          fetchProductsForUser()
        } catch (error) {
          console.error("[v0] Error deleting product:", error)
          toast.error("Failed to delete product. Please try again.")
        }
      },
    })
  }

  const handleGenerateBarcodes = (product: Product) => {
    setSelectedProductForBarcode(product)
    setBarcodeDialogOpen(true)
  }

  const handleRefresh = async () => {
    setRefreshing(true)
  await fetchProductsForUser()
    setRefreshing(false)
    toast.success("Inventory refreshed successfully")
  }

  const getStockStatus = (product: Product) => {
    if (product.stock_available <= 0) {
      return { label: "Out of Stock", variant: "destructive" as const, icon: AlertTriangle }
    } else if (product.stock_available <= product.reorder_level) {
      return { label: "Low Stock", variant: "warning" as const, icon: AlertTriangle }
    } else {
      return { label: "In Stock", variant: "success" as const, icon: CheckCircle }
    }
  }

  const filteredProducts = useMemo(() => {
    let filtered = products.filter((product) => {
      // Search filter - includes barcode_number
      const matchesSearch =
        product.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        (product.barcode && product.barcode.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
        product.brand?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())

      if (!matchesSearch) return false

      // Stock status filter
      if (stockFilter !== 'all') {
        if (stockFilter === 'in_stock' && product.stock_available <= product.reorder_level) return false
        if (stockFilter === 'low_stock' && (product.stock_available > product.reorder_level || product.stock_available === 0)) return false
        if (stockFilter === 'out_of_stock' && product.stock_available > 0) return false
      }

      // Category filter
      if (categoryFilter !== 'all' && product.category_id !== categoryFilter) {
        return false
      }

      // Subcategory filter
      if (subcategoryFilter !== 'all' && product.subcategory_id !== subcategoryFilter) {
        return false
      }

      return true
    })

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal, bVal
      switch (sortField) {
        case 'name':
          aVal = a.name.toLowerCase()
          bVal = b.name.toLowerCase()
          return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
        case 'stock':
          aVal = a.stock_available
          bVal = b.stock_available
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
        case 'price':
          aVal = a.price
          bVal = b.price
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
        case 'rental':
          aVal = a.rental_price
          bVal = b.rental_price
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
        case 'created_at':
          aVal = new Date(a.created_at).getTime()
          bVal = new Date(b.created_at).getTime()
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
        default:
          return 0
      }
    })

    return filtered
  }, [products, debouncedSearchTerm, stockFilter, categoryFilter, subcategoryFilter, sortField, sortDirection])

  // Handle sort option change
  const handleSortChange = (value: string) => {
    setSortOption(value as any)
    switch (value) {
      case 'name_asc':
        setSortField('name')
        setSortDirection('asc')
        break
      case 'name_desc':
        setSortField('name')
        setSortDirection('desc')
        break
      case 'price_low_high':
        setSortField('rental')
        setSortDirection('asc')
        break
      case 'price_high_low':
        setSortField('rental')
        setSortDirection('desc')
        break
      case 'newest':
        setSortField('created_at')
        setSortDirection('desc')
        break
      case 'oldest':
        setSortField('created_at')
        setSortDirection('asc')
        break
    }
  }

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredProducts, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
              <p className="text-muted-foreground">Manage your product inventory</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" disabled>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Link href="/inventory/categories">
                <Button variant="outline" className="flex items-center bg-transparent">
                  <Filter className="w-4 h-4 mr-2" />
                  Manage Categories
                </Button>
              </Link>
              <Link href="/inventory/add">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </Link>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    disabled
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <TableSkeleton rows={10} />
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <TooltipProvider>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
              <p className="text-muted-foreground">Manage your product inventory</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setImportExportOpen(true)}
                title="Import/Export products with images"
              >
                <Package className="w-4 h-4 mr-2" />
                Import/Export
              </Button>
              <Link href="/inventory/categories">
                <Button variant="outline" className="flex items-center bg-transparent">
                  <Filter className="w-4 h-4 mr-2" />
                  Manage Categories
                </Button>
              </Link>
              <Link href="/inventory/add">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center space-x-1">
                  <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Total number of active products in your inventory</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{products.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center space-x-1">
                  <CardTitle className="text-sm font-medium">In Stock</CardTitle>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Products with stock levels above the reorder threshold</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {products.filter((p) => p.stock_available > p.reorder_level).length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center space-x-1">
                  <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Products at or below the reorder level - consider restocking soon</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {products.filter((p) => p.stock_available <= p.reorder_level && p.stock_available > 0).length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center space-x-1">
                  <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Products with zero available stock - immediate restocking required</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{products.filter((p) => p.stock_available <= 0).length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <CardTitle>Products</CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Complete list of all products with stock levels, pricing, and management options</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <CardDescription>A list of all products in your inventory</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                {/* Search Bar - Reduced width */}
                <div className="relative w-80">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>

                {/* Stock Status Filter */}
                <Select value={stockFilter} onValueChange={(value: any) => { setStockFilter(value); setCurrentPage(1) }}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Stock Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    <SelectItem value="in_stock">In Stock Only</SelectItem>
                    <SelectItem value="low_stock">Low Stock Only</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock Only</SelectItem>
                  </SelectContent>
                </Select>

                {/* Category Filter */}
                <Select value={categoryFilter} onValueChange={(value) => { setCategoryFilter(value); setSubcategoryFilter('all'); setCurrentPage(1) }}>
                  <SelectTrigger className="w-52">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Subcategory Filter - Only shown when category is selected */}
                {categoryFilter !== 'all' && subcategories.filter(sc => sc.parent_id === categoryFilter).length > 0 && (
                  <Select value={subcategoryFilter} onValueChange={(value) => { setSubcategoryFilter(value); setCurrentPage(1) }}>
                    <SelectTrigger className="w-52">
                      <SelectValue placeholder="All Subcategories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subcategories</SelectItem>
                      {subcategories.filter(sc => sc.parent_id === categoryFilter).map(subcat => (
                        <SelectItem key={subcat.id} value={subcat.id}>{subcat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Sort By Dropdown */}
                <Select value={sortOption} onValueChange={handleSortChange}>
                  <SelectTrigger className="w-52">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name_asc">Name: A to Z</SelectItem>
                    <SelectItem value="name_desc">Name: Z to A</SelectItem>
                    <SelectItem value="price_low_high">Price: Low to High</SelectItem>
                    <SelectItem value="price_high_low">Price: High to Low</SelectItem>
                    <SelectItem value="newest">Newly Added First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                  </SelectContent>
                </Select>

                {/* Clear Filters Button - Only shown when filters are active */}
                {(stockFilter !== 'all' || categoryFilter !== 'all' || subcategoryFilter !== 'all') && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => { 
                      setStockFilter('all'); 
                      setCategoryFilter('all'); 
                      setSubcategoryFilter('all'); 
                      setCurrentPage(1);
                    }}
                    className="h-10 px-3"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>

              {/* Active Filters Display */}
              {(stockFilter !== 'all' || categoryFilter !== 'all' || subcategoryFilter !== 'all') && (
                <div className="flex items-center gap-2 flex-wrap mb-4">
                  <span className="text-xs text-muted-foreground">Active filters:</span>
                  {stockFilter !== 'all' && (
                    <Badge variant="secondary" className="text-xs">
                      {stockFilter === 'in_stock' ? 'In Stock' : stockFilter === 'low_stock' ? 'Low Stock' : 'Out of Stock'}
                      <button
                        onClick={() => setStockFilter('all')}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {categoryFilter !== 'all' && (
                    <Badge variant="secondary" className="text-xs">
                      {categories.find(c => c.id === categoryFilter)?.name}
                      <button
                        onClick={() => {setCategoryFilter('all'); setSubcategoryFilter('all')}}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {subcategoryFilter !== 'all' && (
                    <Badge variant="secondary" className="text-xs">
                      {subcategories.find(s => s.id === subcategoryFilter)?.name}
                      <button
                        onClick={() => setSubcategoryFilter('all')}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => {
                      setStockFilter('all')
                      setCategoryFilter('all')
                      setSubcategoryFilter('all')
                      setCurrentPage(1)
                    }}
                  >
                    Clear all
                  </Button>
                </div>
              )}

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Image</TableHead>
                      <TableHead 
                        className="cursor-pointer select-none hover:bg-muted/50"
                        onClick={() => {
                          if (sortField === 'name') {
                            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                          } else {
                            setSortField('name')
                            setSortDirection('asc')
                          }
                        }}
                      >
                        <div className="flex items-center gap-1">
                          Product
                          {sortField === 'name' && (
                            <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center space-x-1">
                          <Barcode className="w-4 h-4" />
                          <span>11-Digit Barcode</span>
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center space-x-1">
                          <span>Stock Status</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="w-3 h-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                Current stock availability: In Stock (above reorder level), Low Stock (at/below reorder
                                level), Out of Stock (zero available)
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer select-none hover:bg-muted/50"
                        onClick={() => {
                          if (sortField === 'stock') {
                            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                          } else {
                            setSortField('stock')
                            setSortDirection('desc')
                          }
                        }}
                      >
                        <div className="flex items-center gap-1">
                          <span>Available</span>
                          {sortField === 'stock' && (
                            <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                          )}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="w-3 h-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Click to sort by stock quantity. Number of items currently available for booking or sale</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer select-none hover:bg-muted/50"
                        onClick={() => {
                          if (sortField === 'rental') {
                            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                          } else {
                            setSortField('rental')
                            setSortDirection('asc')
                          }
                        }}
                      >
                        <div className="flex items-center gap-1">
                          Rental Price
                          {sortField === 'rental' && (
                            <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer select-none hover:bg-muted/50"
                        onClick={() => {
                          if (sortField === 'price') {
                            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                          } else {
                            setSortField('price')
                            setSortDirection('asc')
                          }
                        }}
                      >
                        <div className="flex items-center gap-1">
                          Sale Price
                          {sortField === 'price' && (
                            <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12">
                          <div className="flex flex-col items-center space-y-3">
                            {debouncedSearchTerm || stockFilter !== 'all' || categoryFilter !== 'all' || subcategoryFilter !== 'all' ? (
                              <>
                                <Search className="h-12 w-12 text-muted-foreground/50" />
                                <div className="space-y-1">
                                  <p className="text-base font-medium">No products found</p>
                                  <p className="text-sm text-muted-foreground">
                                    {debouncedSearchTerm ? `No results for "${debouncedSearchTerm}"` : 'No products match your current filters'}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  {debouncedSearchTerm && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setSearchTerm('')}
                                    >
                                      Clear search
                                    </Button>
                                  )}
                                  {(stockFilter !== 'all' || categoryFilter !== 'all' || subcategoryFilter !== 'all') && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setStockFilter('all')
                                        setCategoryFilter('all')
                                        setSubcategoryFilter('all')
                                      }}
                                    >
                                      Clear filters
                                    </Button>
                                  )}
                                </div>
                              </>
                            ) : (
                              <>
                                <Package className="h-12 w-12 text-muted-foreground/50" />
                                <div className="space-y-1">
                                  <p className="text-base font-medium">No products yet</p>
                                  <p className="text-sm text-muted-foreground">
                                    Get started by adding your first product to inventory
                                  </p>
                                </div>
                                <Link href="/inventory/add">
                                  <Button size="sm">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Product
                                  </Button>
                                </Link>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedProducts.map((product) => {
                        const stockStatus = getStockStatus(product)
                        const StockIcon = stockStatus.icon

                        return (
                          <TableRow key={product.id}>
                            <TableCell>
                              <div className="w-12 h-12 rounded-md border overflow-hidden bg-muted flex items-center justify-center">
                                {product.image_url ? (
                                  <img
                                    src={product.image_url || "/placeholder.svg"}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement
                                      target.style.display = "none"
                                      target.parentElement!.innerHTML =
                                        '<div class="w-full h-full flex items-center justify-center"><svg class="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>'
                                    }}
                                  />
                                ) : (
                                  <ImageIcon className="w-4 h-4 text-muted-foreground" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{product.name}</div>
                                {product.brand && <div className="text-sm text-muted-foreground">{product.brand}</div>}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {product.barcode ? (
                                  <>
                                    <Barcode className="w-4 h-4 text-blue-600" />
                                    <code className="text-sm font-mono font-bold text-blue-700">
                                      {product.barcode}
                                    </code>
                                  </>
                                ) : (
                                  <span className="text-sm text-muted-foreground">-</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={stockStatus.variant} className="flex items-center space-x-1 w-fit">
                                <StockIcon className="h-3 w-3" />
                                <span>{stockStatus.label}</span>
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">{product.stock_available}</span>
                              <span className="text-muted-foreground">/{product.stock_total}</span>
                            </TableCell>
                            <TableCell>₹{product.rental_price.toLocaleString()}</TableCell>
                            <TableCell>₹{product.price.toLocaleString()}</TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleViewProduct(product)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                  
                                  <Link href={`/inventory/edit/${product.id}`}>
                                    <DropdownMenuItem>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                  </Link>
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteProduct(product.id, product.name)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Pagination Controls */}
          {filteredProducts.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                    {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} products
                  </div>
                  <div className="flex items-center space-x-2">
                    <Select
                      value={itemsPerPage.toString()}
                      onValueChange={(value) => {
                        setItemsPerPage(Number(value))
                        setCurrentPage(1)
                      }}
                    >
                      <SelectTrigger className="w-[130px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 / page</SelectItem>
                        <SelectItem value="25">25 / page</SelectItem>
                        <SelectItem value="50">50 / page</SelectItem>
                        <SelectItem value="100">100 / page</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm font-medium">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Product View Dialog */}
          <ProductViewDialog product={selectedProduct} open={viewDialogOpen} onOpenChange={setViewDialogOpen} />

          {/* Stock Movement Dialog temporarily removed */}

          {/* Bulk Barcode Generator Dialog */}
          {selectedProductForBarcode && (
            <BulkBarcodeGenerator
              product={{
                ...selectedProductForBarcode,
                category: selectedProductForBarcode.category_id || "unknown"
              }}
              open={barcodeDialogOpen}
              onOpenChange={setBarcodeDialogOpen}
              onItemsGenerated={fetchProductsForUser}
            />
          )}

          {/* Import/Export Dialog */}
          <InventoryImportExportDialog 
            open={importExportOpen}
            onOpenChange={setImportExportOpen}
            onImportSuccess={fetchProductsForUser}
          />
        </div>
      </TooltipProvider>
      <ConfirmationDialog />
    </DashboardLayout>
  )
}
