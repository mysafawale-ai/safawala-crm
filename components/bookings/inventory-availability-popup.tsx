"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Package, AlertTriangle, CheckCircle, Clock } from "lucide-react"
import { format, addDays, subDays } from "date-fns"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface Product {
  id: string
  name: string
  stock_total: number
  stock_available: number
  stock_booked: number
  stock_damaged: number
  stock_in_laundry: number
}

interface DailyBooking {
  date: string
  bookings: {
    booking_number: string
    customer_name: string
    quantity: number
    source: 'package' | 'product'
    booking_id: string
  }[]
  totalQuantity: number
}

interface ProductAvailability {
  product: Product
  dailyBookings: DailyBooking[]
  totalBooked: number
}

interface InventoryAvailabilityPopupProps {
  packageId?: string
  variantId?: string
  productId?: string
  eventDate?: Date
  deliveryDate?: Date
  returnDate?: Date
  children: React.ReactNode
}

export function InventoryAvailabilityPopup({
  packageId,
  variantId,
  productId,
  eventDate,
  deliveryDate,
  returnDate,
  children,
}: InventoryAvailabilityPopupProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [availabilityData, setAvailabilityData] = useState<ProductAvailability[]>([])
  const supabase = createClient()

  const checkAvailability = async () => {
    if (!eventDate) {
      toast({
        title: "Date Required",
        description: "Please select an event date first",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      // Calculate date range (2 days before event, event day, 2 days after = 5 days)
      const startDate = subDays(eventDate, 2)
      const endDate = addDays(eventDate, 2)
      
      // Generate 5 dates (event date +/- 2 days)
      const dates: string[] = []
      for (let i = 0; i < 5; i++) {
        dates.push(format(addDays(startDate, i), 'yyyy-MM-dd'))
      }      console.log(`Checking availability for dates:`, dates)

      // Get products to check
      let productIds: string[] = []

      if (productId) {
        productIds = [productId]
      } else if (variantId) {
        const { data: allProducts } = await supabase.from("products").select("id").eq("is_active", true)
        productIds = allProducts?.map((p) => p.id) || []
      } else {
        const { data: allProducts } = await supabase.from("products").select("id").eq("is_active", true)
        productIds = allProducts?.map((p) => p.id) || []
      }

      // Get product details
      const { data: products } = await supabase
        .from("products")
        .select("*")
        .in("id", productIds)
        .eq("is_active", true)

      if (!products || products.length === 0) {
        setAvailabilityData([])
        return
      }

      // Get all package bookings that overlap with our date range
      const { data: packageBookings } = await supabase
        .from("package_bookings")
        .select(`
          id,
          package_number,
          event_date,
          delivery_date,
          return_date,
          status,
          customer_id,
          customers(name)
        `)
        .gte('event_date', format(startDate, 'yyyy-MM-dd'))
        .lte('event_date', format(endDate, 'yyyy-MM-dd'))
        .neq('status', 'cancelled')

      // Get package booking items
      const packageBookingIds = packageBookings?.map(b => b.id) || []
      const { data: packageItems } = await supabase
        .from("package_booking_items")
        .select("booking_id, reserved_products")
        .in("booking_id", packageBookingIds)

      // Get all product orders that overlap with our date range
      const { data: productOrders } = await supabase
        .from("product_orders")
        .select(`
          id,
          order_number,
          event_date,
          delivery_date,
          return_date,
          status,
          customer_id,
          customers(name)
        `)
        .gte('event_date', format(startDate, 'yyyy-MM-dd'))
        .lte('event_date', format(endDate, 'yyyy-MM-dd'))
        .neq('status', 'cancelled')

      // Get product order items
      const productOrderIds = productOrders?.map(o => o.id) || []
      const { data: productOrderItems } = await supabase
        .from("product_order_items")
        .select("order_id, product_id, quantity")
        .in("order_id", productOrderIds)
        .in("product_id", productIds)

      // Build availability data for each product
      const availability: ProductAvailability[] = products.map(product => {
        const dailyBookings: DailyBooking[] = dates.map(date => {
          const bookings: DailyBooking['bookings'] = []

          // Check package bookings for this date
          packageBookings?.forEach(booking => {
            if (booking.event_date === date) {
              // Check if any package items have this product in reserved_products
              const items = packageItems?.filter(item => item.booking_id === booking.id) || []
              items.forEach(item => {
                if (item.reserved_products) {
                  const reserved = Array.isArray(item.reserved_products) 
                    ? item.reserved_products 
                    : []
                  
                  const productInReserved = reserved.find((r: any) => r.id === product.id || r.product_id === product.id)
                  if (productInReserved) {
                    const qty = productInReserved.quantity || 1
                    bookings.push({
                      booking_number: booking.package_number || booking.id.slice(0, 8),
                      customer_name: (booking.customers as any)?.name || 'Unknown',
                      quantity: qty,
                      source: 'package',
                      booking_id: booking.id
                    })
                  }
                }
              })
            }
          })

          // Check product orders for this date
          productOrders?.forEach(order => {
            if (order.event_date === date) {
              const items = productOrderItems?.filter(item => 
                item.order_id === order.id && item.product_id === product.id
              ) || []
              
              items.forEach(item => {
                bookings.push({
                  booking_number: order.order_number || order.id.slice(0, 8),
                  customer_name: (order.customers as any)?.name || 'Unknown',
                  quantity: item.quantity,
                  source: 'product',
                  booking_id: order.id
                })
              })
            }
          })

          const totalQuantity = bookings.reduce((sum, b) => sum + b.quantity, 0)

          return {
            date,
            bookings,
            totalQuantity
          }
        })

        const totalBooked = dailyBookings.reduce((sum, day) => sum + day.totalQuantity, 0)

        return {
          product,
          dailyBookings,
          totalBooked
        }
      })

      setAvailabilityData(availability)
      console.log(`Availability check complete for ${availability.length} products`)
    } catch (error) {
      console.error("Error checking availability:", error)
      toast({
        title: "Error",
        description: "Failed to check inventory availability",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (newOpen) {
      checkAvailability()
    }
  }

  const isEventDate = (dateStr: string) => {
    return eventDate && dateStr === format(eventDate, 'yyyy-MM-dd')
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            5-Day Booking Overview
          </DialogTitle>
          {eventDate && (
            <p className="text-sm text-gray-600">
              Showing bookings from {format(subDays(eventDate, 2), "MMM dd")} to{" "}
              {format(addDays(eventDate, 2), "MMM dd, yyyy")}
            </p>
          )}
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {availabilityData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No products found for availability check</p>
              </div>
            ) : (
              <>
                {availabilityData.map((data) => (
                  <Card key={data.product.id} className="border-2">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{data.product.name}</CardTitle>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">Total Stock</div>
                          <div className="text-2xl font-bold">{data.product.stock_total}</div>
                          <div className="text-xs text-gray-500">Available: {data.product.stock_available}</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Daily breakdown */}
                      {data.dailyBookings.map((day, index) => {
                        const isEvent = isEventDate(day.date)
                        const hasBookings = day.bookings.length > 0
                        
                        return (
                          <div 
                            key={day.date} 
                            className={cn(
                              "border rounded-lg p-3",
                              isEvent && "border-blue-500 bg-blue-50",
                              !isEvent && hasBookings && "bg-orange-50 border-orange-200",
                              !hasBookings && "bg-gray-50"
                            )}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span className="font-semibold">
                                  {format(new Date(day.date), "EEE, MMM dd")}
                                </span>
                                {isEvent && (
                                  <Badge variant="default" className="text-xs">
                                    Event Date
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {hasBookings ? (
                                  <>
                                    <Badge variant="destructive" className="text-sm">
                                      {day.totalQuantity} Booked
                                    </Badge>
                                    <Badge variant="outline" className="text-sm">
                                      {day.bookings.length} {day.bookings.length === 1 ? 'Booking' : 'Bookings'}
                                    </Badge>
                                  </>
                                ) : (
                                  <Badge variant="secondary" className="text-sm">
                                    Available
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Booking details */}
                            {hasBookings && (
                              <div className="space-y-2 mt-3">
                                {day.bookings.map((booking, idx) => (
                                  <div 
                                    key={idx}
                                    className="flex items-center justify-between p-2 bg-white rounded border"
                                  >
                                    <div className="flex items-center gap-3">
                                      <Badge 
                                        variant={booking.source === 'package' ? 'default' : 'secondary'}
                                        className="text-xs"
                                      >
                                        {booking.source === 'package' ? '📦 Package' : '🛒 Product'}
                                      </Badge>
                                      <div>
                                        <div className="font-medium text-sm">
                                          {booking.customer_name}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {booking.booking_number}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-bold text-orange-600">
                                        Qty: {booking.quantity}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}

                      {/* Summary */}
                      <div className="border-t pt-3 mt-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Total bookings in 5 days:</span>
                          <span className="font-bold text-lg">{data.totalBooked} units</span>
                        </div>
                        {data.totalBooked > 0 && (
                          <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-700">
                            💡 Peak demand: {Math.max(...data.dailyBookings.map(d => d.totalQuantity))} units on{' '}
                            {format(
                              new Date(data.dailyBookings.reduce((max, d) => 
                                d.totalQuantity > max.totalQuantity ? d : max
                              ).date),
                              "MMM dd"
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
