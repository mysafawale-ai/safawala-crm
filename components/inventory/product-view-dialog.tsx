"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Printer, Edit, ImageIcon, Layers } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { generateBarcode } from "@/lib/barcode-generator"
import { BarcodePrinter } from "@/components/inventory/barcode-printer"
import { VariantBarcodePrinter } from "@/components/inventory/variant-barcode-printer"
import Link from "next/link"

interface Product {
  id: string
  product_code?: string
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
  image_url?: string
}

interface ProductViewDialogProps {
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProductViewDialog({ product, open, onOpenChange }: ProductViewDialogProps) {
  const [barcodePrinterOpen, setBarcodePrinterOpen] = useState(false)
  const [variations, setVariations] = useState<any[]>([])
  const [loadingVariations, setLoadingVariations] = useState(false)
  const [variationBarcodes, setVariationBarcodes] = useState<Record<string, string>>({})
  const [variantPrintDialogOpen, setVariantPrintDialogOpen] = useState(false)
  const [selectedVariantForPrint, setSelectedVariantForPrint] = useState<any>(null)

  useEffect(() => {
    if (open && product) loadVariations()
  }, [open, product])

  const loadVariations = async () => {
    if (!product) return
    setLoadingVariations(true)
    try {
      const { data, error } = await supabase
        .from("product_variations")
        .select("*")
        .eq("product_id", product.id)
        .eq("is_active", true)
        .order("created_at", { ascending: true })

      if (error) throw error
      setVariations(data || [])

      const imgs: Record<string, string> = {}
      for (const v of (data || [])) {
        if (v.barcode) {
          try { imgs[v.barcode] = generateBarcode(v.barcode) } catch { /* ignore */ }
        }
      }
      setVariationBarcodes(imgs)
    } catch (e) {
      console.error("Error loading variations:", e)
    } finally {
      setLoadingVariations(false)
    }
  }

  if (!product) return null

  const isOut = product.stock_available <= 0
  const isLow = !isOut && product.stock_available <= product.reorder_level

  const stockColor = isOut ? "text-red-600" : isLow ? "text-amber-600" : "text-green-600"
  const dotColor = isOut ? "bg-red-500" : isLow ? "bg-amber-400" : "bg-green-500"

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">

          {/* Product Hero */}
          <div className="flex gap-4 p-6 pb-4">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-20 h-20 object-cover rounded-xl border flex-shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-xl border bg-gray-100 flex items-center justify-center flex-shrink-0">
                <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold leading-tight">{product.name}</h2>
                  {product.brand && <p className="text-sm text-muted-foreground">{product.brand}</p>}
                </div>
                <Link href={`/inventory/edit/${product.id}`} onClick={() => onOpenChange(false)}>
                  <Button variant="outline" size="sm" className="h-8 flex-shrink-0">
                    <Edit className="w-3.5 h-3.5 mr-1.5" />
                    Edit
                  </Button>
                </Link>
              </div>
              {product.description && (
                <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{product.description}</p>
              )}
              <div className="flex items-center gap-3 mt-2 text-sm">
                <span className="font-medium">₹{product.rental_price.toLocaleString()} <span className="text-muted-foreground font-normal text-xs">/ rental</span></span>
                {product.price > 0 && <span className="text-muted-foreground">₹{product.price.toLocaleString()} sale</span>}
              </div>
            </div>
          </div>

          <div className="border-t" />

          {/* Stock row */}
          <div className="grid grid-cols-4 divide-x px-6 py-4">
            {[
              { label: "Available", value: product.stock_available, color: stockColor },
              { label: "Total", value: product.stock_total, color: "" },
              { label: "Booked", value: product.stock_booked, color: "text-blue-600" },
              { label: "Damaged", value: product.stock_damaged, color: "text-red-500" },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center px-2">
                <p className={`text-xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          <div className="border-t" />

          {/* Product details */}
          <div className="px-6 py-4 space-y-3">
            {/* Barcode */}
            {product.barcode && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Barcode</p>
                  <div className="flex items-center gap-3">
                    <img
                      src={generateBarcode(product.barcode)}
                      alt="barcode"
                      className="h-8 w-auto"
                    />
                    <code className="text-sm font-mono text-muted-foreground">{product.barcode}</code>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8"
                  onClick={() => setBarcodePrinterOpen(true)}
                >
                  <Printer className="w-3.5 h-3.5 mr-1.5" />
                  Print
                </Button>
              </div>
            )}

            {/* Attributes */}
            {(product.size || product.color || product.material) && (
              <div className="flex items-center gap-2 flex-wrap">
                {product.size && <Badge variant="secondary" className="text-xs">{product.size}</Badge>}
                {product.color && <Badge variant="secondary" className="text-xs">{product.color}</Badge>}
                {product.material && <Badge variant="secondary" className="text-xs">{product.material}</Badge>}
              </div>
            )}
          </div>

          {/* Variations */}
          {(loadingVariations || variations.length > 0) && (
            <>
              <div className="border-t" />
              <div className="px-6 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <Layers className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Variants</p>
                  {variations.length > 0 && (
                    <Badge variant="secondary" className="text-xs">{variations.length}</Badge>
                  )}
                </div>

                {loadingVariations ? (
                  <div className="space-y-2">
                    {[1,2,3].map(i => <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />)}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {variations.map(v => {
                      const adjPrice = product.price + (typeof v.price_adjustment === 'number' ? v.price_adjustment : parseFloat(String(v.price_adjustment)) || 0)
                      return (
                        <div
                          key={v.id}
                          className="flex items-center justify-between rounded-lg border px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {v.color && (
                              <div
                                className="w-3 h-3 rounded-full border flex-shrink-0"
                                style={{ backgroundColor: v.color.toLowerCase() }}
                              />
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{v.variation_name}</p>
                              <p className="text-[11px] text-muted-foreground truncate">
                                {[v.color, v.design, v.material, v.size].filter(Boolean).join(" · ")}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 flex-shrink-0 ml-3">
                            {/* Stock dots */}
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <span className="text-green-600 font-medium">{v.stock_available || 0}</span>
                              <span>/</span>
                              <span>{v.stock_total || 0}</span>
                            </div>

                            {/* Barcode preview */}
                            {v.barcode && variationBarcodes[v.barcode] && (
                              <img src={variationBarcodes[v.barcode]} alt="" className="h-6 w-auto hidden sm:block" />
                            )}

                            {/* Print button */}
                            {v.barcode && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                                title={`Print ${v.variation_name} labels`}
                                onClick={() => { setSelectedVariantForPrint(v); setVariantPrintDialogOpen(true) }}
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          <div className="h-2" />
        </DialogContent>
      </Dialog>

      {product && (
        <BarcodePrinter
          open={barcodePrinterOpen}
          onOpenChange={setBarcodePrinterOpen}
          productCode={product.barcode || product.product_code || ""}
          productName={product.name}
          productPrice={product.price}
        />
      )}

      {selectedVariantForPrint && (
        <VariantBarcodePrinter
          open={variantPrintDialogOpen}
          onOpenChange={setVariantPrintDialogOpen}
          variantCode={selectedVariantForPrint.barcode || ""}
          variantName={selectedVariantForPrint.variation_name || ""}
          productName={product?.name}
          productPrice={product?.price}
          priceAdjustment={
            typeof selectedVariantForPrint.price_adjustment === 'number'
              ? selectedVariantForPrint.price_adjustment
              : parseFloat(String(selectedVariantForPrint.price_adjustment)) || 0
          }
        />
      )}
    </>
  )
}
