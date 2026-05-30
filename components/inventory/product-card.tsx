"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ImageIcon, MoreHorizontal, Edit, Trash2, Barcode, Copy, Eye, Tag } from "lucide-react"
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
  category_name?: string
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
    if (isOutOfStock) return "bg-red-50 border-red-200/60 text-red-700"
    if (isLowStock) return "bg-amber-50 border-amber-200/60 text-amber-700"
    return "bg-emerald-50 border-emerald-200/60 text-emerald-700"
  }

  const getStockLabel = () => {
    if (isOutOfStock) return "Out of Stock"
    if (isLowStock) return "Low Stock"
    return "In Stock"
  }

  const getStockDot = () => {
    if (isOutOfStock) return "bg-red-500"
    if (isLowStock) return "bg-amber-500"
    return "bg-emerald-500"
  }

  const copyBarcodeToClipboard = () => {
    if (product.barcode) {
      navigator.clipboard.writeText(product.barcode)
      toast.success("Barcode copied to clipboard")
    }
  }

  return (
    <Card
      className="group overflow-hidden flex flex-col h-full border-[#102516]/8
        bg-gradient-to-b from-[#fcf7f0] to-[#f9f2e8]/80
        hover:translate-y-[-3px] hover:shadow-[0_12px_30px_rgba(16,37,22,0.12)]
        transition-all duration-300 ease-out rounded-xl"
    >
      {/* Heritage top accent line */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-[#102516]/20 to-transparent" />

      {/* Image Container */}
      <div className="relative w-full aspect-square bg-gradient-to-br from-[#f9f2e8] to-[#f6e1c3]/30 overflow-hidden flex items-center justify-center">
        {product.image_url ? (
          <>
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = "none"
                if (target.nextElementSibling) {
                  (target.nextElementSibling as HTMLElement).style.display = "flex"
                }
              }}
            />
            <div className="hidden w-full h-full items-center justify-center">
              <ImageIcon className="w-8 h-8 text-[#102516]/20" />
            </div>
            {/* Hover overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#102516]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 text-[#102516]/20">
            <ImageIcon className="w-10 h-10" />
            <span className="text-[10px] uppercase tracking-wider" style={{ fontFamily: "var(--font-crimson), serif" }}>
              No Image
            </span>
          </div>
        )}

        {/* Stock indicator dot — top-left */}
        <div className={`absolute top-2.5 left-2.5 w-2.5 h-2.5 rounded-full ${getStockDot()} ring-2 ring-white/80 shadow-sm`} />

        {/* Category badge — top-right */}
        {product.category_name && (
          <div className="absolute top-2.5 right-2.5">
            <Badge
              variant="outline"
              className="text-[9px] font-medium bg-white/85 backdrop-blur-sm border-[#102516]/10 text-[#102516]/80 shadow-sm px-2 py-0.5"
              style={{ fontFamily: "var(--font-crimson), serif" }}
            >
              <Tag className="w-2.5 h-2.5 mr-1" />
              {product.category_name}
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3.5 flex flex-col flex-1 space-y-2.5">
        {/* Header with menu */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3
              className="font-semibold text-sm leading-tight truncate text-[#102516]"
              style={{ fontFamily: "var(--font-crimson), serif", fontWeight: 600 }}
            >
              {product.name}
            </h3>
            {product.brand && (
              <p
                className="text-[11px] text-[#102516]/50 truncate mt-0.5"
                style={{ fontFamily: "var(--font-crimson), serif" }}
              >
                {product.brand}
              </p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity
                  hover:bg-[#102516]/5 rounded-lg"
              >
                <MoreHorizontal className="h-4 w-4 text-[#102516]/60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => onEdit(product)} className="text-[#102516]">
                <Edit className="mr-2 h-3.5 w-3.5" />
                Edit Product
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onGenerateBarcode(product)} className="text-[#102516]">
                <Barcode className="mr-2 h-3.5 w-3.5" />
                Print Barcode
              </DropdownMenuItem>
              <DropdownMenuItem onClick={copyBarcodeToClipboard} disabled={!product.barcode} className="text-[#102516]">
                <Copy className="mr-2 h-3.5 w-3.5" />
                Copy Barcode
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(product.id, product.name)} className="text-red-600 focus:text-red-600">
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Stock Status Row */}
        <div className="flex items-center justify-between gap-2">
          <Badge variant="outline" className={`text-[10px] font-medium whitespace-nowrap px-2 py-0.5 ${getStockColor()}`}>
            {getStockLabel()}
          </Badge>
          <span
            className="text-[11px] text-[#102516]/50 whitespace-nowrap font-medium"
            style={{ fontFamily: "var(--font-crimson), serif" }}
          >
            {product.stock_available}/{product.stock_total} units
          </span>
        </div>

        {/* Attribute Badges */}
        <div className="flex flex-wrap gap-1">
          {product.is_custom && (
            <Badge
              variant="outline"
              className="text-[9px] bg-[#f6e1c3]/40 border-[#f6e1c3] text-[#102516]/70 px-1.5 py-0"
            >
              Custom
            </Badge>
          )}
          {(product._variation_count ?? 0) > 0 && (
            <Badge
              variant="outline"
              className="text-[9px] bg-purple-50/80 border-purple-200/60 text-purple-700 px-1.5 py-0"
            >
              {product._variation_count} variant{product._variation_count !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>

        {/* Pricing — pushed to bottom */}
        <div className="space-y-1.5 border-t border-[#102516]/6 pt-2.5 mt-auto">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#102516]/45" style={{ fontFamily: "var(--font-crimson), serif" }}>
              Rental
            </span>
            <span className="font-bold text-[#102516]" style={{ fontFamily: "var(--font-crimson), serif" }}>
              ₹{product.rental_price.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#102516]/45" style={{ fontFamily: "var(--font-crimson), serif" }}>
              Sale
            </span>
            <span className="font-semibold text-[#102516]/70" style={{ fontFamily: "var(--font-crimson), serif" }}>
              ₹{product.price.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Barcode indicator */}
        {product.barcode && (
          <div className="flex items-center gap-1.5 text-[10px] text-[#102516]/60 bg-[#102516]/3 px-2 py-1 rounded-md mt-auto">
            <Barcode className="w-3 h-3 text-[#102516]/40" />
            <code className="font-mono text-[9px] font-bold tracking-wide">{product.barcode}</code>
          </div>
        )}
      </div>
    </Card>
  )
}
