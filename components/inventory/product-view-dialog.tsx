"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Truck, Package, DollarSign, MapPin, Phone, Calendar, Wrench, FileText } from "lucide-react"

interface OrderItem {
  id: string
  product_id: string
  product_name: string
  category: string
  quantity: number
  unit_price: number
  total_price: number
  security_deposit: number
}

interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
}

interface Product {
  id: string
  name: string
}

interface DirectSaleOrder {
  id: string
  order_number: string
  customer_id: string
  customer?: Customer
  delivery_date?: string
  delivery_time?: string
  delivery_address?: string
  venue_address?: string
  total_amount: number
  paid_amount?: number
  discount_amount?: number
  tax_amount?: number
  payment_method?: string
  payment_type?: string
  notes?: string
  booking_items?: OrderItem[]
  status?: string
  created_at?: string
  has_modifications?: boolean
  modifications_details?: string
  modification_date?: string
  modification_time?: string
  sales_closed_by_id?: string
}

interface ProductViewDialogProps {
  product: DirectSaleOrder | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProductViewDialog({ product, open, onOpenChange }: ProductViewDialogProps) {
  if (!product) return null

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return "₹0"
    return `₹${amount.toLocaleString("en-IN")}`
  }

  const formatDate = (date: string | undefined) => {
    if (!date) return "N/A"
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  const pendingAmount = (product.total_amount || 0) - (product.paid_amount || 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Order #{product.order_number || "N/A"}</DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Ordered on {formatDate(product.created_at)}
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Status & Total */}
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Status</p>
                  <Badge className="mt-1 bg-green-100 text-green-800">
                    {product.status || "Confirmed"}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Order Total</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-400 mt-1">
                    {formatCurrency(product.total_amount)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Paid</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400 mt-1">
                    {formatCurrency(product.paid_amount || 0)}
                  </p>
                </div>
              </div>
              {pendingAmount > 0 && (
                <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
                  <p className="text-sm font-semibold text-orange-600">
                    Pending: {formatCurrency(pendingAmount)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Name</p>
                  <p className="font-medium text-lg">{product.customer?.name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                    <Phone className="h-3 w-3" /> Phone
                  </p>
                  <p className="font-medium">{product.customer?.phone || "N/A"}</p>
                </div>
              </div>
              {product.customer?.email && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Email</p>
                  <p className="font-medium">{product.customer.email}</p>
                </div>
              )}
              {product.customer && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Address
                  </p>
                  <p className="font-medium">
                    {[
                      product.customer.address,
                      product.customer.city,
                      product.customer.state,
                      product.customer.pincode,
                    ]
                      .filter(Boolean)
                      .join(", ") || "N/A"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delivery Information */}
          {product.delivery_date && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Delivery Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Delivery Date
                    </p>
                    <p className="font-medium">{formatDate(product.delivery_date)}</p>
                  </div>
                  {product.delivery_time && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">Delivery Time</p>
                      <p className="font-medium">{product.delivery_time}</p>
                    </div>
                  )}
                </div>
                {product.delivery_address && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Delivery Address
                    </p>
                    <p className="font-medium">{product.delivery_address}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Products */}
          {product.booking_items && product.booking_items.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Items Ordered ({product.booking_items.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-2 font-semibold">Product</th>
                        <th className="text-center py-3 px-2 font-semibold">Qty</th>
                        <th className="text-right py-3 px-2 font-semibold">Price</th>
                        <th className="text-right py-3 px-2 font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.booking_items.map((item: OrderItem) => (
                        <tr
                          key={item.id}
                          className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50"
                        >
                          <td className="py-3 px-2">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100">
                                {item.product_name}
                              </p>
                              <p className="text-xs text-muted-foreground">{item.category}</p>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-center font-medium">{item.quantity}</td>
                          <td className="py-3 px-2 text-right">{formatCurrency(item.unit_price)}</td>
                          <td className="py-3 px-2 text-right font-semibold">
                            {formatCurrency(item.total_price)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payment Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">
                  {formatCurrency(
                    (product.total_amount || 0) - (product.tax_amount || 0) + (product.discount_amount || 0)
                  )}
                </span>
              </div>

              {product.discount_amount && product.discount_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="font-medium text-green-600">-{formatCurrency(product.discount_amount)}</span>
                </div>
              )}

              {product.tax_amount && product.tax_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-medium">+{formatCurrency(product.tax_amount)}</span>
                </div>
              )}

              <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2 flex justify-between font-bold">
                <span>Total</span>
                <span className="text-lg text-green-600 dark:text-green-400">
                  {formatCurrency(product.total_amount)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method & Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {product.payment_method && (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Payment Method</p>
                  <p className="font-medium mt-1">{product.payment_method}</p>
                </CardContent>
              </Card>
            )}
            {product.payment_type && (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Payment Type</p>
                  <p className="font-medium mt-1">{product.payment_type}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Modifications Section */}
          {product.has_modifications && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Modifications Required
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {product.modifications_details && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase">Modification Details</p>
                    <p className="font-medium mt-1 bg-orange-50 dark:bg-orange-950/30 p-3 rounded">
                      {product.modifications_details}
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {product.modification_date && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Modification Date
                      </p>
                      <p className="font-medium mt-1">{formatDate(product.modification_date)}</p>
                    </div>
                  )}
                  {product.modification_time && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">Modification Time</p>
                      <p className="font-medium mt-1">{product.modification_time}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {product.notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Special Notes & Instructions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {product.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
