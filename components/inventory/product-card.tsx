"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ImageIcon, MoreHorizontal, Edit, Trash2, Barcode, Copy } from "lucide-react"
import { toast } from "sonner"

interface Product {
  id: string
  name: string
  brand?: string
  price: number
  rental_price: number
  stock_available: number
  stock_total: number
  reorder_level: number
  image_url?: string
  barcode?: string
  is_custom?: boolean
  _variation_count?: number
}

interface ProductCardProps {
  product: Product
  onEdit: (product: Product) => void
  onDelete: (productId: string, productName: string) => void
  onGenerateBarcode: (product: Product) => void
}

export function ProductCard({ product, onEdit, onDelete, onGenerateBarcode }: ProductCardProps) {
  const isInStock = product.stock_available > product.reorder_level
  const isLowStock = product.stock_available <= product.reorder_level && product.stock_available > 0
  const isOutOfStock = product.stock_available <= 0

  const getStockColor = () => {
    if (isOutOfStock) return "bg-red-50 border-red-200 text-red-700"
    if (isLowStock) return "bg-amber-50 border-amber-200 text-amber-700"
    return "bg-green-50 border-green-200 text-green-700"
  }

  const getStockLabel = () => {
    if (isOutOfStock) return "Out of Stock"
    if (isLowStock) return "Low Stock"
    return "In Stock"
  }

  const copyBarcodeToClipboard = () => {
    if (product.barcode) {
      navigator.clipboard.writeText(product.barcode)
      toast.success("Barcode copied to clipboard")
    }
  }

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full">
      {/* Image Container */}
      <div className="relative w-full aspect-square bg-muted overflow-hidden flex items-center justify-center">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = "none"
              target.parentElement!.innerHTML =
                '<div class="w-full h-full flex items-center justify-center"><svg class="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>'
            }}
          />
        ) : (
          <ImageIcon className="w-8 h-8 text-muted-foreground" />
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 space-y-3">
        {/* Header with menu */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm leading-tight truncate">{product.name}</h3>
            {product.brand && <p className="text-xs text-muted-foreground truncate">{product.brand}</p>}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(product)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onGenerateBarcode(product)}>
                <Barcode className="mr-2 h-4 w-4" />
                Print Barcode
              </DropdownMenuItem>
              <DropdownMenuItem onClick={copyBarcodeToClipboard} disabled={!product.barcode}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Barcode
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(product.id, product.name)} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Stock Status */}
        <div className="flex items-center justify-between gap-2">
          <Badge variant="outline" className={`text-xs whitespace-nowrap ${getStockColor()}`}>
            {getStockLabel()}
          </Badge>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {product.stock_available}/{product.stock_total}
          </span>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1">
          {product.is_custom && (
            <Badge variant="outline" className="text-[10px] bg-amber-50 border-amber-300 text-amber-700">
              Custom
            </Badge>
          )}
          {(product._variation_count ?? 0) > 0 && (
            <Badge variant="outline" className="text-[10px] bg-purple-50 border-purple-300 text-purple-700">
              {product._variation_count} variant{product._variation_count !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>

        {/* Pricing */}
        <div className="space-y-1 border-t pt-3">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Rental</span>
            <span className="font-semibold">₹{product.rental_price.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Sale</span>
            <span className="font-semibold">₹{product.price.toLocaleString()}</span>
          </div>
        </div>

        {/* Barcode indicator */}
        {product.barcode && (
          <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded mt-auto">
            <Barcode className="w-3 h-3" />
            <code className="font-mono text-[10px] font-bold">{product.barcode}</code>
          </div>
        )}
      </div>
    </Card>
  )
}
