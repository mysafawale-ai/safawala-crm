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
import { InventoryAvailabilityPopup } from '@/components/bookings/inventory-availability-popup'

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
  const renderProductCard = (product: Product) => {
    const selectedQty = getSelectedQuantity(product.id)
    const currentQty = quantities[product.id] || 1
    const availableStock = product.stock_available || 0
    const isOutOfStock = availableStock === 0
    const isInCart = selectedQty > 0

    return (
      <div className={cn(
        "border rounded-lg overflow-hidden hover:shadow-md transition-all bg-white",
        isOutOfStock && "opacity-60 bg-gray-50"
      )}>
        {/* Image */}
        <div className="relative aspect-square">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <Package className="h-8 w-8 text-gray-300" />
            </div>
          )}
          
          {/* Stock Badge */}
          <Badge
            className={cn(
              "absolute top-1 right-1 text-[10px] px-1.5 py-0",
              availableStock > 10 ? "bg-green-500 text-white" :
              availableStock > 0 ? "bg-yellow-500 text-white" :
              "bg-red-500 text-white"
            )}
          >
            {availableStock} left
          </Badge>
          
          {isInCart && (
            <Badge className="absolute top-1 left-1 bg-blue-500 text-white text-[10px] px-1.5 py-0">
              {selectedQty} in cart
            </Badge>
          )}
        </div>

        {/* Info */}
        <div className="p-2 space-y-1.5">
          <h4 className="font-semibold text-xs line-clamp-2 min-h-[2rem]">
            {product.name}
          </h4>
          
          {product.product_code && (
            <p className="text-[10px] text-gray-500">
              {product.product_code}
            </p>
          )}

          {/* Price */}
          <div className="font-bold text-sm text-green-700">
            {formatCurrency(
              context.bookingType === 'rental' 
                ? product.rental_price 
                : product.sale_price
            )}
          </div>

          {/* Check Availability Button - Always visible */}
          {context.eventDate && (
            <InventoryAvailabilityPopup
              productId={product.id}
              eventDate={new Date(context.eventDate)}
              deliveryDate={context.deliveryDate ? new Date(context.deliveryDate) : undefined}
              returnDate={context.returnDate ? new Date(context.returnDate) : undefined}
            >
              <Button
                size="sm"
                variant="outline"
                className="w-full h-7 text-[11px] border-blue-200 hover:bg-blue-50"
              >
                <Eye className="h-3.5 w-3.5 mr-1.5" />
                Check Availability
              </Button>
            </InventoryAvailabilityPopup>
          )}

          {/* Add to Cart or Quantity Selector */}
          {!isInCart ? (
            <Button
              size="sm"
              className="w-full h-7 text-xs"
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
          ) : (
            <div className="space-y-1.5">
              {/* Quantity Selector */}
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-6 w-6"
                  onClick={() => updateQuantity(product.id, currentQty - 1)}
                  disabled={currentQty <= 1}
                >
                  <Plus className="h-3 w-3 rotate-45" />
                </Button>
                <Input
                  type="number"
                  value={currentQty}
                  onChange={(e) => updateQuantity(product.id, parseInt(e.target.value) || 1)}
                  className="h-6 flex-1 text-center text-xs px-1"
                  min={1}
                  max={availableStock}
                />
                <Button
                  size="icon"
                  variant="outline"
                  className="h-6 w-6"
                  onClick={() => updateQuantity(product.id, currentQty + 1)}
                  disabled={currentQty >= availableStock}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
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
          </div>

          {/* Category Filters */}
          <div className="flex gap-2 flex-wrap">{categories.length > 0 && (
              <Select value={selectedCategory || 'all'} onValueChange={(v) => {
                setSelectedCategory(v === 'all' ? '' : v)
                // Reset subcategory when main category changes
                if (v === 'all' || v !== selectedCategory) {
                  setSelectedSubcategory('')
                }
              }}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Categories" />
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
            )}
            
            {/* Show subcategories only when a main category is selected and it has subcategories */}
            {type === 'product' && selectedCategory && subcategories.filter(sub => sub.parent_id === selectedCategory).length > 0 && (
              <Select value={selectedSubcategory || 'all'} onValueChange={(v) => setSelectedSubcategory(v === 'all' ? '' : v)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Subcategories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subcategories</SelectItem>
                  {subcategories
                    .filter(sub => sub.parent_id === selectedCategory)
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
        <div className="flex-1 -mx-6 px-6 overflow-y-auto max-h-[60vh]">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No {type}s found</p>
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-3 pb-4">
              {filteredItems.map((item) =>
                type === 'product'
                  ? renderProductCard(item as Product)
                  : renderPackageCard(item as PackageSet)
              )}
            </div>
          )}
        </div>

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
