"use client"

/**
 * ProductSelector - Reusable Product Selection Component
 * 
 * Features:
 * - Search & category/subcategory filtering
 * - Image previews with fallback
 * - Variant display (rental/sale pricing)
 * - Stock indicators with reservation tracking
 * - Quantity controls
 * - Availability checking
 * - Keyboard navigation (Arrow keys, Enter, Escape)
 * - Responsive grid layout
 * - Out of stock handling
 */

import { useState, useMemo, useEffect, useRef, KeyboardEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Package, AlertCircle, Eye, Plus } from "lucide-react"
import { InventoryAvailabilityPopup } from "@/components/bookings/inventory-availability-popup"

export interface Product {
  id: string
  name: string
  category: string
  category_id?: string
  subcategory_id?: string
  rental_price: number
  sale_price: number
  security_deposit: number
  stock_available: number
  image_url?: string
  // Optional barcode fields for search
  barcode?: string | null
  product_code?: string | null
  all_barcode_numbers?: string[]
}

export interface Category {
  id: string
  name: string
}

export interface Subcategory {
  id: string
  name: string
  parent_id: string
}

export interface SelectedItem {
  product_id: string
  quantity: number
}

interface ProductSelectorProps {
  products: Product[]
  categories?: Category[]
  subcategories?: Subcategory[]
  selectedItems?: SelectedItem[]
  bookingType: "rental" | "sale"
  eventDate?: string
  onProductSelect: (product: Product) => void
  onCheckAvailability?: (productId: string, productName: string) => void
  onOpenCustomProductDialog?: () => void
  className?: string
}

export function ProductSelector({
  products,
  categories = [],
  subcategories = [],
  selectedItems = [],
  bookingType,
  eventDate,
  onProductSelect,
  onCheckAvailability,
  onOpenCustomProductDialog,
  className = "",
}: ProductSelectorProps) {
  const [productSearch, setProductSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const gridRef = useRef<HTMLDivElement>(null)
  const productRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  // Log on mount and when props change
  useEffect(() => {
    console.log("[ProductSelector] Rendered with:", {
      productCount: products.length,
      categoryCount: categories.length,
      subcategoryCount: subcategories.length,
      firstProduct: products[0],
      firstCategory: categories[0]
    })
  }, [products, categories, subcategories])

  // Filter products based on search and categories
  const filteredProducts = useMemo(() => {
    let result = products

    // Filter by category
    if (selectedCategory) {
      result = result.filter((p) => p.category_id === selectedCategory)
    }

    // Filter by subcategory
    if (selectedSubcategory) {
      result = result.filter((p) => p.subcategory_id === selectedSubcategory)
    }

    // Filter by search (supports name, category, barcode and known code fields)
    if (productSearch) {
      const term = productSearch.toLowerCase()
      result = result.filter(
        (p) => {
          const matchesNameOrCategory = p.name.toLowerCase().includes(term) || p.category.toLowerCase().includes(term)
          const matchesBarcode = p.barcode ? String(p.barcode).toLowerCase().includes(term) : false
          const matchesProductCode = p.product_code ? String(p.product_code).toLowerCase().includes(term) : false
          const matchesAnyBarcode = Array.isArray(p.all_barcode_numbers)
            ? p.all_barcode_numbers.some((b) => String(b).toLowerCase().includes(term))
            : false
          return matchesNameOrCategory || matchesBarcode || matchesProductCode || matchesAnyBarcode
        }
      )
    }

    return result
  }, [products, productSearch, selectedCategory, selectedSubcategory])

  // Calculate reserved quantities
  const getReservedQuantity = (productId: string): number => {
    return selectedItems.find((i) => i.product_id === productId)?.quantity || 0
  }

  // Get available stock
  const getAvailableStock = (product: Product): number => {
    const reserved = getReservedQuantity(product.id)
    return product.stock_available - reserved
  }

  // Check if product is out of stock
  const isOutOfStock = (product: Product): boolean => {
    return getAvailableStock(product) <= 0
  }

  // Keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (filteredProducts.length === 0) return

    const maxIndex = filteredProducts.length - 1

    switch (e.key) {
      case "ArrowRight":
        e.preventDefault()
        setFocusedIndex((prev) => Math.min(prev + 1, maxIndex))
        break
      case "ArrowLeft":
        e.preventDefault()
        setFocusedIndex((prev) => Math.max(prev - 1, 0))
        break
      case "ArrowDown":
        e.preventDefault()
        // Move down by 4 (grid columns)
        setFocusedIndex((prev) => Math.min(prev + 4, maxIndex))
        break
      case "ArrowUp":
        e.preventDefault()
        // Move up by 4 (grid columns)
        setFocusedIndex((prev) => Math.max(prev - 4, 0))
        break
      case "Enter":
        e.preventDefault()
        if (focusedIndex >= 0 && focusedIndex <= maxIndex) {
          const product = filteredProducts[focusedIndex]
          if (!isOutOfStock(product)) {
            onProductSelect(product)
          }
        }
        break
      case "Escape":
        e.preventDefault()
        setFocusedIndex(-1)
        break
    }
  }

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIndex >= 0 && filteredProducts[focusedIndex]) {
      const productId = filteredProducts[focusedIndex].id
      const element = productRefs.current[productId]
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "nearest" })
      }
    }
  }, [focusedIndex, filteredProducts])

  // Reset focus when filters change
  useEffect(() => {
    setFocusedIndex(-1)
  }, [productSearch, selectedCategory, selectedSubcategory])

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Select Products
            {filteredProducts.length > 0 && (
              <Badge variant="secondary">
                {filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"}
              </Badge>
            )}
          </div>
          {onOpenCustomProductDialog && (
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenCustomProductDialog}
              className="gap-1.5 text-xs"
            >
              <Plus className="h-4 w-4" />
              Quick Custom Product
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Category Filter Buttons */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <Button
              size="sm"
              variant={selectedCategory === null ? "default" : "outline"}
              onClick={() => {
                setSelectedCategory(null)
                setSelectedSubcategory(null)
              }}
              className="h-7 px-3 text-xs font-normal"
            >
              All Categories
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.id}
                size="sm"
                variant={selectedCategory === cat.id ? "default" : "outline"}
                onClick={() => {
                  setSelectedCategory(cat.id)
                  setSelectedSubcategory(null)
                }}
                className="h-7 px-3 text-xs font-normal"
              >
                {cat.name}
              </Button>
            ))}
          </div>
        )}

        {/* Subcategory Filter Buttons - Show only when category is selected */}
        {selectedCategory &&
          subcategories.filter((sc) => sc.parent_id === selectedCategory).length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <Button
                size="sm"
                variant={selectedSubcategory === null ? "default" : "outline"}
                onClick={() => setSelectedSubcategory(null)}
                className="h-7 px-3 text-xs font-normal"
              >
                All Subcategories
              </Button>
              {subcategories
                .filter((sc) => sc.parent_id === selectedCategory)
                .map((subcat) => (
                  <Button
                    key={subcat.id}
                    size="sm"
                    variant={selectedSubcategory === subcat.id ? "default" : "outline"}
                    onClick={() => setSelectedSubcategory(subcat.id)}
                    className="h-7 px-3 text-xs font-normal"
                  >
                    {subcat.name}
                  </Button>
                ))}
            </div>
          )}

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search products by name or category..."
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Products Grid */}
        <div
          ref={gridRef}
          className="max-h-[500px] overflow-y-auto border rounded-lg p-4"
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm text-muted-foreground">No products found</p>
              {(productSearch || selectedCategory || selectedSubcategory) && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setProductSearch("")
                    setSelectedCategory(null)
                    setSelectedSubcategory(null)
                  }}
                  className="mt-3"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product, index) => {
                const unitPrice = bookingType === "rental" 
                  ? product.rental_price 
                  : (product.sale_price || product.rental_price || 0) // Fallback to rental if sale is missing
                const reservedQty = getReservedQuantity(product.id)
                const availableStock = getAvailableStock(product)
                const outOfStock = isOutOfStock(product)
                const isFocused = focusedIndex === index

                return (
                  <div
                    key={product.id}
                    ref={(el) => {
                      productRefs.current[product.id] = el
                    }}
                    className={`border rounded-lg p-4 flex flex-col text-sm transition-all ${
                      isFocused
                        ? "ring-2 ring-primary ring-offset-2 shadow-lg"
                        : "hover:shadow-md"
                    } ${outOfStock ? "opacity-60" : ""}`}
                  >
                    {/* Product Image */}
                    <div className="aspect-square bg-gray-100 rounded mb-3 flex items-center justify-center text-xs text-muted-foreground overflow-hidden">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Package className="h-8 w-8 text-gray-300" />
                          <span>No Image</span>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="font-medium line-clamp-2 mb-1 min-h-[2.5rem]" title={product.name}>
                      {product.name}
                    </div>
                    <div className="text-[11px] text-gray-600 mb-2">{product.category}</div>

                    {/* Pricing & Stock Info */}
                    <div className="text-xs mb-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          {bookingType === "rental" ? "Rental" : "Sale"}:
                        </span>
                        <span className="font-semibold text-base">₹{unitPrice}</span>
                      </div>
                      {bookingType === "rental" && product.security_deposit > 0 && (
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-muted-foreground">Security:</span>
                          <span>₹{product.security_deposit}</span>
                        </div>
                      )}
                      <div
                        className={`flex items-center justify-between ${
                          outOfStock
                            ? "text-red-600 font-semibold"
                            : availableStock <= 5
                            ? "text-orange-600"
                            : "text-gray-600"
                        }`}
                      >
                        <span>Stock:</span>
                        <span>
                          {availableStock}
                          {reservedQty > 0 && (
                            <span className="text-blue-600 ml-1">
                              ({reservedQty} in cart)
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Stock Warning */}
                    {!outOfStock && availableStock <= 5 && (
                      <div className="flex items-center gap-1 text-[10px] text-orange-600 mb-2 p-1.5 bg-orange-50 rounded">
                        <AlertCircle className="h-3 w-3 flex-shrink-0" />
                        <span>Low stock!</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-auto space-y-2">
                      {eventDate && (
                        <InventoryAvailabilityPopup
                          productId={product.id}
                          eventDate={new Date(eventDate)}
                        >
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full h-7 text-[10px]"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Check Availability
                          </Button>
                        </InventoryAvailabilityPopup>
                      )}
                      <Button
                        size="sm"
                        onClick={() => onProductSelect(product)}
                        disabled={outOfStock}
                        className="w-full"
                      >
                        {outOfStock ? "Out of Stock" : "Add to Cart"}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Keyboard Shortcuts Hint */}
        {filteredProducts.length > 0 && (
          <div className="text-[10px] text-muted-foreground text-center">
            💡 Use arrow keys to navigate, Enter to add, Escape to reset focus
          </div>
        )}
      </CardContent>
    </Card>
  )
}
