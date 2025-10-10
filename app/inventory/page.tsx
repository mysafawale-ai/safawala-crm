"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
  const [itemsPerPage] = useState(20)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [barcodeDialogOpen, setBarcodeDialogOpen] = useState(false)
  const [selectedProductForBarcode, setSelectedProductForBarcode] = useState<Product | null>(null)
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
  }, [])

  const fetchProductsForUser = async () => {
    try {
      setLoading(true)
      // Get current user from API
      const userRes = await fetch("/api/auth/user")
      if (!userRes.ok) throw new Error("Failed to fetch user")
      const user: User = await userRes.json()
      let query = supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
      // Only filter by franchise for non-super-admins
      if (user.role !== "super_admin" && user.franchise_id) {
        query = query.eq("franchise_id", user.franchise_id)
      }
      const { data, error } = await query
      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error("Error fetching products:", error)
      toast.error("Failed to load products")
    } finally {
      setLoading(false)
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
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        product.product_code.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        product.brand?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()),
    )
  }, [products, debouncedSearchTerm])

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
              <div className="flex items-center space-x-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Button variant="outline" size="sm" className="flex items-center bg-transparent">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Image</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Code</TableHead>
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
                      <TableHead>
                        <div className="flex items-center space-x-1">
                          <span>Available</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="w-3 h-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Available stock / Total stock (excludes booked, damaged, and in-laundry items)</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TableHead>
                      <TableHead>Rental Price</TableHead>
                      <TableHead>Sale Price</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <div className="flex flex-col items-center space-y-2">
                            <Package className="h-8 w-8 text-muted-foreground" />
                            <p className="text-muted-foreground">
                              {debouncedSearchTerm ? "No products found matching your search." : "No products found."}
                            </p>
                            {!debouncedSearchTerm && (
                              <Link href="/inventory/add">
                                <Button size="sm">
                                  <Plus className="w-4 h-4 mr-2" />
                                  Add Your First Product
                                </Button>
                              </Link>
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
                              <code className="text-sm">{product.product_code}</code>
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
                                  
                                  <DropdownMenuItem onClick={() => handleGenerateBarcodes(product)}>
                                    <Barcode className="mr-2 h-4 w-4" />
                                    Generate Item Barcodes
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
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} products
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm">
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
        </div>
      </TooltipProvider>
      <ConfirmationDialog />
    </DashboardLayout>
  )
}
