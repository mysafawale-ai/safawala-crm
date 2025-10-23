"use client"

/**
 * ItemsSelectionDialog
 * 
 * A powerful reusable dialog for selecting products or packages with:
 * - Real-time availability checking
 * - Category and subcategory filtering
 * - Search functionality
 * - Stock status indicators
 * - Image previews
 * - Quick quantity selection
 * - Barcode scanner integration (optional)
 * 
 * Usage:
 * <ItemsSelectionDialog
 *   open={showDialog}
 *   onOpenChange={setShowDialog}
 *   type="product" // or "package"
 *   items={products} // or packages
 *   categories={categories}
 *   context={{
 *     bookingType: 'rental',
 *     eventDate: '2025-10-23',
 *     onItemSelect: (item) => handleSelect(item)
 *   }}
 *   selectedItems={currentSelection}
 * />
 */

import { useState, useMemo, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Package,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Loader2,
  Plus,
  Eye,
  ShoppingCart,
} from 'lucide-react'
import type {
  Product,
  PackageSet,
  Category,
  Subcategory,
  ProductSelectionContext,
  SelectedItem,
} from '../types/items'
import { useProductFilter, useAvailabilityCheck } from '../hooks/useItems'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface ItemsSelectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: 'product' | 'package'
  items: (Product | PackageSet)[]
  categories?: Category[]
  subcategories?: Subcategory[]
  context: ProductSelectionContext
  selectedItems?: SelectedItem[] // Currently selected items to show quantities
  title?: string
  description?: string
  // Optional barcode integration
  onBarcodeSearch?: (barcode: string) => void
}

export function ItemsSelectionDialog({
  open,
  onOpenChange,
  type,
  items,
  categories = [],
  subcategories = [],
  context,
  selectedItems = [],
  title,
  description,
  onBarcodeSearch,
}: ItemsSelectionDialogProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [availabilityModalItem, setAvailabilityModalItem] = useState<string | null>(null)

  // Filter hook
  const {
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    selectedSubcategory,
    setSelectedSubcategory,
    inStockOnly,
    setInStockOnly,
    filteredItems,
  } = useProductFilter(items)

  // Availability hook
  const {
    loading: availabilityLoading,
    data: availabilityData,
    checkSingleProduct,
  } = useAvailabilityCheck()

  // Calculate selected quantity for an item
  const getSelectedQuantity = (itemId: string) => {
    return selectedItems.find(si =>
      'product_id' in si ? si.product_id === itemId : si.package_id === itemId
    )?.quantity || 0
  }

  // Get availability status for a product
  const getAvailabilityStatus = (productId: string) => {
    const data = availabilityData.find(d => d.product_id === productId)
    if (!data) return null
    return data
  }

  // Handle quantity change
  const updateQuantity = (itemId: string, qty: number) => {
    setQuantities(prev => ({
      ...prev,
      [itemId]: Math.max(0, qty)
    }))
  }

  // Handle item selection
  const handleSelectItem = (item: Product | PackageSet) => {
    const qty = quantities[item.id] || 1
    context.onItemSelect?.(item)
    
    // Reset quantity after selection
    setQuantities(prev => {
      const newState = { ...prev }
      delete newState[item.id]
      return newState
    })
  }

  // Handle availability check
  const handleCheckAvailability = async (productId: string) => {
    if (!context.eventDate) {
      return
    }
    setAvailabilityModalItem(productId)
    await checkSingleProduct(productId, context.eventDate)
  }

  // Render product card
  const renderProductCard = (product: Product, isGrid: boolean = true) => {
    const selectedQty = getSelectedQuantity(product.id)
    const currentQty = quantities[product.id] || 1
    const availableStock = product.stock_available || 0
    const isOutOfStock = availableStock === 0
    const availability = getAvailabilityStatus(product.id)

    const cardContent = (
      <div className={cn(
        "border rounded-lg overflow-hidden hover:shadow-md transition-all",
        isOutOfStock && "opacity-60 bg-gray-50"
      )}>
        {isGrid ? (
          // Grid View
          <div className="p-3 space-y-3">
            {/* Image */}
            <div className="relative">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-32 object-cover rounded"
                />
              ) : (
                <div className="w-full h-32 bg-gray-100 rounded flex items-center justify-center">
                  <Package className="h-12 w-12 text-gray-300" />
                </div>
              )}
              
              {/* Stock Badge */}
              <Badge
                className={cn(
                  "absolute top-2 right-2",
                  availableStock > 10 ? "bg-green-100 text-green-800" :
                  availableStock > 0 ? "bg-yellow-100 text-yellow-800" :
                  "bg-red-100 text-red-800"
                )}
              >
                {availableStock} in stock
              </Badge>
            </div>

            {/* Info */}
            <div className="space-y-1.5">
              <h4 className="font-semibold text-sm line-clamp-2 min-h-[2.5rem]">
                {product.name}
              </h4>
              
              {product.category && (
                <Badge variant="outline" className="text-xs">
                  {product.category}
                </Badge>
              )}
              
              {product.product_code && (
                <p className="text-xs text-gray-500">
                  Code: {product.product_code}
                </p>
              )}
            </div>

            {/* Pricing */}
            <div className="flex items-center justify-between text-sm">
              <div>
                <div className="font-bold text-green-700">
                  {formatCurrency(
                    context.bookingType === 'rental' 
                      ? product.rental_price 
                      : product.sale_price
                  )}
                </div>
                {context.bookingType === 'rental' && product.security_deposit && (
                  <div className="text-xs text-gray-500">
                    +{formatCurrency(product.security_deposit)} deposit
                  </div>
                )}
              </div>
              {selectedQty > 0 && (
                <Badge className="bg-blue-100 text-blue-800">
                  {selectedQty} selected
                </Badge>
              )}
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="outline"
                className="h-7 w-7"
                onClick={() => updateQuantity(product.id, currentQty - 1)}
                disabled={currentQty <= 1}
              >
                <Plus className="h-3 w-3 rotate-45" />
              </Button>
              <Input
                type="number"
                value={currentQty}
                onChange={(e) => updateQuantity(product.id, parseInt(e.target.value) || 1)}
                className="h-7 w-14 text-center text-sm"
                min={1}
              />
              <Button
                size="icon"
                variant="outline"
                className="h-7 w-7"
                onClick={() => updateQuantity(product.id, currentQty + 1)}
                disabled={currentQty >= availableStock && inStockOnly}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              {context.eventDate && context.onCheckAvailability && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full h-7 text-xs"
                  onClick={() => handleCheckAvailability(product.id)}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Check Availability
                </Button>
              )}
              
              <Button
                size="sm"
                className="w-full"
                onClick={() => handleSelectItem(product)}
                disabled={isOutOfStock}
              >
                {isOutOfStock ? (
                  <>
                    <XCircle className="h-3 w-3 mr-1" />
                    Out of Stock
                  </>
                ) : (
                  <>
                    <Plus className="h-3 w-3 mr-1" />
                    Add to Cart
                  </>
                )}
              </Button>
            </div>

            {/* Availability Indicator */}
            {availability && (
              <div className={cn(
                "text-xs px-2 py-1 rounded flex items-center gap-1",
                availability.status === 'available' ? "bg-green-50 text-green-700" :
                availability.status === 'limited' ? "bg-yellow-50 text-yellow-700" :
                "bg-red-50 text-red-700"
              )}>
                {availability.status === 'available' ? (
                  <CheckCircle className="h-3 w-3" />
                ) : (
                  <AlertTriangle className="h-3 w-3" />
                )}
                {availability.status === 'available' ? 'Available' :
                 availability.status === 'limited' ? 'Limited Stock' : 'Unavailable'}
              </div>
            )}
          </div>
        ) : (
          // List View
          <div className="p-4 flex gap-4">
            {/* Image */}
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-20 h-20 object-cover rounded"
              />
            ) : (
              <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center shrink-0">
                <Package className="h-8 w-8 text-gray-300" />
              </div>
            )}

            {/* Info */}
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold">{product.name}</h4>
                  {product.product_code && (
                    <p className="text-xs text-gray-500">Code: {product.product_code}</p>
                  )}
                </div>
                {selectedQty > 0 && (
                  <Badge className="bg-blue-100 text-blue-800">
                    {selectedQty} selected
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {product.category && (
                  <Badge variant="outline" className="text-xs">{product.category}</Badge>
                )}
                <Badge className={cn(
                  availableStock > 10 ? "bg-green-100 text-green-800" :
                  availableStock > 0 ? "bg-yellow-100 text-yellow-800" :
                  "bg-red-100 text-red-800"
                )}>
                  {availableStock} in stock
                </Badge>
              </div>
            </div>

            {/* Price and Actions */}
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="text-right">
                <div className="font-bold text-green-700">
                  {formatCurrency(
                    context.bookingType === 'rental' 
                      ? product.rental_price 
                      : product.sale_price
                  )}
                </div>
                {context.bookingType === 'rental' && product.security_deposit && (
                  <div className="text-xs text-gray-500">
                    +{formatCurrency(product.security_deposit)} deposit
                  </div>
                )}
              </div>
              
              <Button
                size="sm"
                onClick={() => handleSelectItem(product)}
                disabled={isOutOfStock}
              >
                {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              </Button>
            </div>
          </div>
        )}
      </div>
    )

    return <div key={product.id}>{cardContent}</div>
  }

  // Render package card (simplified - you can expand this)
  const renderPackageCard = (pkg: PackageSet, isGrid: boolean = true) => {
    const selectedQty = getSelectedQuantity(pkg.id)

    return (
      <div key={pkg.id} className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-all">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-semibold">{pkg.name}</h4>
            {pkg.category && (
              <Badge variant="outline" className="mt-1">{pkg.category}</Badge>
            )}
          </div>
          {selectedQty > 0 && (
            <Badge className="bg-blue-100 text-blue-800">{selectedQty} selected</Badge>
          )}
        </div>
        
        <div className="text-sm text-gray-600">
          {pkg.description}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="font-bold text-green-700">{formatCurrency(pkg.base_price)}</div>
          <Button size="sm" onClick={() => handleSelectItem(pkg)}>
            <Plus className="h-3 w-3 mr-1" />
            Select Package
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            {title || `Select ${type === 'product' ? 'Products' : 'Packages'}`}
          </DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>

        {/* Filters Section */}
        <div className="space-y-3">
          {/* Search and View Toggle */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={`Search ${type}s...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex border rounded-md">
              <Button
                size="sm"
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                Grid
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                List
              </Button>
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex gap-2 flex-wrap">
            {categories.length > 0 && (
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            {type === 'product' && subcategories.length > 0 && (
              <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Subcategories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Subcategories</SelectItem>
                  {subcategories
                    .filter(sub => !selectedCategory || sub.parent_id === selectedCategory)
                    .map((sub) => (
                      <SelectItem key={sub.id} value={sub.id}>
                        {sub.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
            
            <Button
              size="sm"
              variant={inStockOnly ? 'default' : 'outline'}
              onClick={() => setInStockOnly(!inStockOnly)}
            >
              <Filter className="h-4 w-4 mr-1" />
              In Stock Only
            </Button>
          </div>
        </div>

        {/* Items Grid/List */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No {type}s found</p>
            </div>
          ) : (
            <div className={cn(
              viewMode === 'grid'
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                : "space-y-3",
              "pb-4"
            )}>
              {filteredItems.map((item) =>
                type === 'product'
                  ? renderProductCard(item as Product, viewMode === 'grid')
                  : renderPackageCard(item as PackageSet, viewMode === 'grid')
              )}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-gray-600">
            Showing {filteredItems.length} of {items.length} {type}s
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
