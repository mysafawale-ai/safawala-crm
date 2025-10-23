"use client"

/**
 * ItemsDisplayDialog
 * 
 * A reusable dialog component to display selected items (products or packages)
 * with capabilities to:
 * - View all selected items with details
 * - Edit quantities inline
 * - Remove items
 * - Add more items
 * - Show pricing breakdown
 * - Display availability warnings
 * 
 * Usage:
 * <ItemsDisplayDialog
 *   open={showDialog}
 *   onOpenChange={setShowDialog}
 *   items={selectedItems}
 *   context={{
 *     bookingType: 'rental',
 *     eventDate: '2025-10-23',
 *     isEditable: true,
 *     showPricing: true
 *   }}
 *   onQuantityChange={(id, qty) => updateQuantity(id, qty)}
 *   onRemoveItem={(id) => removeItem(id)}
 *   onAddItems={() => openSelectionDialog()}
 * />
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Package, 
  Plus, 
  Minus, 
  X, 
  AlertTriangle, 
  CheckCircle,
  ShoppingCart,
  Edit,
  Trash2
} from 'lucide-react'
import type { 
  SelectedItem, 
  SelectedProductItem, 
  SelectedPackageItem,
  ItemsDisplayContext 
} from '../types/items'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface ItemsDisplayDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: SelectedItem[]
  context: ItemsDisplayContext
  // Callbacks
  onQuantityChange?: (itemId: string, quantity: number) => void
  onRemoveItem?: (itemId: string) => void
  onAddItems?: () => void
  onItemEdit?: (itemId: string) => void
  // Display options
  title?: string
  description?: string
  showSummary?: boolean
  summaryData?: {
    subtotal?: number
    discount?: number
    gst?: number
    total?: number
    securityDeposit?: number
  }
}

export function ItemsDisplayDialog({
  open,
  onOpenChange,
  items,
  context,
  onQuantityChange,
  onRemoveItem,
  onAddItems,
  onItemEdit,
  title = 'Selected Items',
  description,
  showSummary = true,
  summaryData,
}: ItemsDisplayDialogProps) {
  const isEditable = context.isEditable ?? true
  const showPricing = context.showPricing ?? true

  const handleQuantityChange = (itemId: string, delta: number) => {
    const item = items.find(i => i.id === itemId)
    if (item && onQuantityChange) {
      onQuantityChange(itemId, item.quantity + delta)
    }
  }

  const renderProductItem = (item: SelectedProductItem) => (
    <div className="p-4 border rounded-lg space-y-3 hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-3">
        {/* Product Image */}
        {item.product.image_url ? (
          <img 
            src={item.product.image_url} 
            alt={item.product.name}
            className="w-16 h-16 object-cover rounded border"
          />
        ) : (
          <div className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center">
            <Package className="h-8 w-8 text-gray-400" />
          </div>
        )}

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4 className="font-semibold text-sm text-gray-900 truncate">
                {item.product.name}
              </h4>
              {item.product.product_code && (
                <p className="text-xs text-gray-500 mt-0.5">
                  Code: {item.product.product_code}
                </p>
              )}
              {item.product.category && (
                <Badge variant="outline" className="mt-1 text-xs">
                  {item.product.category}
                </Badge>
              )}
            </div>

            {/* Remove Button */}
            {isEditable && onRemoveItem && (
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-gray-400 hover:text-red-500"
                onClick={() => onRemoveItem(item.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Stock Warning */}
          {item.product.stock_available !== undefined && 
           item.quantity > item.product.stock_available && (
            <div className="flex items-center gap-1 mt-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
              <AlertTriangle className="h-3 w-3" />
              <span>Quantity exceeds available stock ({item.product.stock_available})</span>
            </div>
          )}

          {/* Variant Info */}
          {item.variant_name && (
            <p className="text-xs text-blue-600 mt-1">
              Variant: {item.variant_name}
            </p>
          )}
        </div>
      </div>

      {/* Quantity and Price Controls */}
      <div className="flex items-center justify-between pt-2 border-t">
        {isEditable && onQuantityChange ? (
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="outline"
              className="h-7 w-7"
              onClick={() => handleQuantityChange(item.id, -1)}
              disabled={item.quantity <= 1}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <Input
              type="number"
              value={item.quantity}
              onChange={(e) => onQuantityChange?.(item.id, parseInt(e.target.value) || 1)}
              className="w-16 h-7 text-center text-sm"
              min={1}
            />
            <Button
              size="icon"
              variant="outline"
              className="h-7 w-7"
              onClick={() => handleQuantityChange(item.id, 1)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div className="text-sm text-gray-600">
            Quantity: <span className="font-medium">{item.quantity}</span>
          </div>
        )}

        {showPricing && (
          <div className="text-right">
            <div className="text-xs text-gray-500">
              {formatCurrency(item.unit_price)} × {item.quantity}
            </div>
            <div className="font-semibold text-sm">
              {formatCurrency(item.total_price)}
            </div>
          </div>
        )}
      </div>

      {/* Edit Button */}
      {onItemEdit && (
        <Button
          size="sm"
          variant="outline"
          className="w-full h-7 text-xs"
          onClick={() => onItemEdit(item.id)}
        >
          <Edit className="h-3 w-3 mr-1" />
          Edit Product
        </Button>
      )}
    </div>
  )

  const renderPackageItem = (item: SelectedPackageItem) => {
    // Parse inclusions
    const inclusions: string[] = Array.isArray(item.variant.inclusions)
      ? item.variant.inclusions
      : typeof item.variant.inclusions === 'string'
        ? item.variant.inclusions.split(',').map(s => s.trim()).filter(Boolean)
        : []

    return (
      <div className="p-4 border rounded-lg space-y-3 hover:shadow-sm transition-shadow">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-2">
            {/* Package Category */}
            {item.package.category && (
              <Badge className="bg-green-50 text-green-700 border-green-200">
                {item.package.category}
              </Badge>
            )}

            {/* Package Name */}
            <h4 className="font-bold text-base text-gray-900">
              {item.package.name}
            </h4>

            {/* Variant Info */}
            {item.variant && (
              <div className="space-y-1.5">
                <Badge variant="outline" className="text-xs text-blue-700 bg-blue-50 border-blue-200">
                  ◆ {item.variant.variant_name || item.variant.name}
                </Badge>

                {/* Inclusions */}
                {inclusions.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {inclusions.map((inc, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-700 rounded border"
                      >
                        ✓ {inc}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Extra Safas */}
            {item.extra_safas && item.extra_safas > 0 && (
              <div className="text-xs text-orange-700 bg-orange-50 px-2 py-1 rounded border border-orange-200">
                + Extra Safas: <span className="font-semibold">{item.extra_safas}</span>
              </div>
            )}

            {/* Products Pending Warning */}
            {item.products_pending && (
              <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                <AlertTriangle className="h-3 w-3" />
                <span>Products selection pending</span>
              </div>
            )}
          </div>

          {/* Remove Button */}
          {isEditable && onRemoveItem && (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-gray-400 hover:text-red-500"
              onClick={() => onRemoveItem(item.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Quantity and Price Controls */}
        <div className="flex items-center justify-between pt-2 border-t">
          {isEditable && onQuantityChange ? (
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="outline"
                className="h-7 w-7"
                onClick={() => handleQuantityChange(item.id, -1)}
                disabled={item.quantity <= 1}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <Input
                type="number"
                value={item.quantity}
                onChange={(e) => onQuantityChange?.(item.id, parseInt(e.target.value) || 1)}
                className="w-16 h-7 text-center text-sm"
                min={1}
              />
              <Button
                size="icon"
                variant="outline"
                className="h-7 w-7"
                onClick={() => handleQuantityChange(item.id, 1)}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="text-sm text-gray-600">
              Quantity: <span className="font-medium">{item.quantity}</span>
            </div>
          )}

          {showPricing && (
            <div className="text-right">
              <div className="text-xs text-gray-500">
                {formatCurrency(item.unit_price)} × {item.quantity}
              </div>
              <div className="font-semibold text-sm">
                {formatCurrency(item.total_price)}
              </div>
            </div>
          )}
        </div>

        {/* Security Deposit */}
        {item.security_deposit && item.security_deposit > 0 && (
          <div className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
            Security Deposit: {formatCurrency(item.security_deposit)} per item
          </div>
        )}

        {/* Edit Button */}
        {onItemEdit && (
          <Button
            size="sm"
            variant="outline"
            className="w-full h-7 text-xs"
            onClick={() => onItemEdit(item.id)}
          >
            <Edit className="h-3 w-3 mr-1" />
            Edit Package
          </Button>
        )}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <ShoppingCart className="h-5 w-5" />
                {title} ({items.length})
              </DialogTitle>
              {description && (
                <DialogDescription className="mt-1">
                  {description}
                </DialogDescription>
              )}
            </div>
            
            {/* Add Items Button */}
            {isEditable && onAddItems && (
              <Button
                size="sm"
                onClick={onAddItems}
                className="shrink-0"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add More
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Items List */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          {items.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No items added yet</p>
              {onAddItems && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onAddItems}
                  className="mt-4"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Items
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3 pb-4">
              {items.map((item) => (
                <div key={item.id}>
                  {'product' in item 
                    ? renderProductItem(item as SelectedProductItem)
                    : renderPackageItem(item as SelectedPackageItem)
                  }
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Summary Section */}
        {showSummary && summaryData && items.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2 text-sm">
              {summaryData.subtotal !== undefined && (
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium">{formatCurrency(summaryData.subtotal)}</span>
                </div>
              )}
              
              {summaryData.discount !== undefined && summaryData.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(summaryData.discount)}</span>
                </div>
              )}
              
              {summaryData.gst !== undefined && (
                <div className="flex justify-between text-gray-600">
                  <span>GST (5%)</span>
                  <span>{formatCurrency(summaryData.gst)}</span>
                </div>
              )}
              
              {summaryData.securityDeposit !== undefined && summaryData.securityDeposit > 0 && (
                <div className="flex justify-between text-amber-600">
                  <span>Security Deposit</span>
                  <span>{formatCurrency(summaryData.securityDeposit)}</span>
                </div>
              )}
              
              {summaryData.total !== undefined && (
                <>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold text-base">
                    <span>Total</span>
                    <span>{formatCurrency(summaryData.total)}</span>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
