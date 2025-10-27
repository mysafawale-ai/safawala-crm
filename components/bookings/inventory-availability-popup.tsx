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

interface Product {
  id: string
  name: string
  stock_total: number
  stock_available: number
  stock_booked: number
  stock_damaged: number
  stock_in_laundry: number
}

interface BookingConflict {
  booking_id: string
  customer_name: string
  delivery_date: string
  return_date: string
  quantity: number
  return_status?: 'returned' | 'in_progress'
}

interface AvailabilityData {
  product: Product
  availableQuantity: number
  conflicts: BookingConflict[]
  nextAvailableDate?: string
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
  const [availabilityData, setAvailabilityData] = useState<AvailabilityData[]>([])
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
      // Calculate date range (2 days before and after)
      const startDate = subDays(eventDate, 2)
      const endDate = addDays(eventDate, 2)
      const checkDeliveryDate = deliveryDate || subDays(eventDate, 1)
      const checkReturnDate = returnDate || addDays(eventDate, 1)

      console.log(
        `[v0] Checking availability from ${format(startDate, "yyyy-MM-dd")} to ${format(endDate, "yyyy-MM-dd")}`,
      )

      // Get products associated with the package/variant
      let productIds: string[] = []

      if (productId) {
        // Check specific product only
        productIds = [productId]
      } else if (variantId) {
        // Get products from variant inclusions (if they reference product IDs)
        const { data: variantData } = await supabase
          .from("package_variants")
          .select("inclusions")
          .eq("id", variantId)
          .single()

        if (variantData?.inclusions) {
          // For now, we'll get all products as inclusions might be text descriptions
          const { data: allProducts } = await supabase.from("products").select("id").eq("is_active", true)

          productIds = allProducts?.map((p) => p.id) || []
        }
      } else {
        // Get all active products for general availability check
        const { data: allProducts } = await supabase.from("products").select("id").eq("is_active", true)

        productIds = allProducts?.map((p) => p.id) || []
      }

      // Get product details
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("*")
        .in("id", productIds)
        .eq("is_active", true)

      if (productsError) throw productsError

      // Get conflicting bookings for the date range
      const { data: conflictingBookings, error: bookingsError } = await supabase
        .from("bookings")
        .select(`
          id,
          delivery_date,
          return_date,
          customers(name),
          booking_items(product_id, quantity)
        `)
        .or(
          `delivery_date.lte.${format(checkReturnDate, "yyyy-MM-dd")},return_date.gte.${format(checkDeliveryDate, "yyyy-MM-dd")}`,
        )
        .neq("status", "cancelled")

      if (bookingsError) throw bookingsError

      // Get barcode status for each booking to determine return status
      const bookingIds = conflictingBookings?.map((b) => b.id) || []
      const { data: barcodeData } = await supabase
        .from("booking_barcode_assignments")
        .select("booking_id, status, returned_at")
        .in("booking_id", bookingIds)
        .eq("booking_type", "package")

      // Create a map of booking_id to return status
      const returnStatusMap = new Map<string, { returned: number; pending: number }>()
      barcodeData?.forEach((bc) => {
        if (!returnStatusMap.has(bc.booking_id)) {
          returnStatusMap.set(bc.booking_id, { returned: 0, pending: 0 })
        }
        const stats = returnStatusMap.get(bc.booking_id)!
        if (bc.status === "returned" || bc.status === "completed") {
          stats.returned++
        } else {
          stats.pending++
        }
      })

      // Calculate availability for each product
      const availability: AvailabilityData[] =
        products?.map((product) => {
          // Find conflicts for this product
          const productConflicts: BookingConflict[] = []
          let bookedQuantity = 0

          conflictingBookings?.forEach((booking: any) => {
            const customerName = Array.isArray(booking.customers) 
              ? booking.customers[0]?.name 
              : booking.customers?.name || "Unknown"
            
            // Determine return status for this booking
            const barcodeStats = returnStatusMap.get(booking.id)
            let returnStatus: 'returned' | 'in_progress' | undefined
            if (barcodeStats) {
              if (barcodeStats.pending > 0) {
                returnStatus = 'in_progress'
              } else if (barcodeStats.returned > 0) {
                returnStatus = 'returned'
              }
            }

            booking.booking_items?.forEach((item: any) => {
              if (item.product_id === product.id) {
                bookedQuantity += item.quantity
                productConflicts.push({
                  booking_id: booking.id,
                  customer_name: customerName,
                  delivery_date: booking.delivery_date,
                  return_date: booking.return_date,
                  quantity: item.quantity,
                  return_status: returnStatus,
                })
              }
            })
          })

          const availableQuantity = Math.max(0, product.stock_available - bookedQuantity)

          // Find next available date if not available now
          let nextAvailableDate: string | undefined
          if (availableQuantity === 0) {
            // Find the earliest return date from conflicts
            const returnDates = productConflicts
              .map((c) => new Date(c.return_date))
              .sort((a, b) => a.getTime() - b.getTime())

            if (returnDates.length > 0) {
              nextAvailableDate = format(addDays(returnDates[0], 1), "yyyy-MM-dd")
            }
          }

          return {
            product,
            availableQuantity,
            conflicts: productConflicts,
            nextAvailableDate,
          }
        }) || []

      setAvailabilityData(availability)
      console.log(`[v0] Availability check complete for ${availability.length} products`)
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

  const getAvailabilityStatus = (data: AvailabilityData) => {
    if (data.availableQuantity > 5) {
      return { status: "good", color: "text-green-600", icon: CheckCircle }
    } else if (data.availableQuantity > 0) {
      return { status: "limited", color: "text-yellow-600", icon: AlertTriangle }
    } else {
      return { status: "unavailable", color: "text-red-600", icon: AlertTriangle }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Inventory Availability Check
          </DialogTitle>
          {eventDate && (
            <p className="text-sm text-gray-600">
              Checking availability for {format(subDays(eventDate, 2), "MMM dd")} -{" "}
              {format(addDays(eventDate, 2), "MMM dd, yyyy")}
            </p>
          )}
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {availabilityData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No products found for availability check</p>
              </div>
            ) : (
              <>
                {/* Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Availability Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {availabilityData.filter((d) => d.availableQuantity > 5).length}
                        </div>
                        <div className="text-sm text-gray-600">Fully Available</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-yellow-600">
                          {availabilityData.filter((d) => d.availableQuantity > 0 && d.availableQuantity <= 5).length}
                        </div>
                        <div className="text-sm text-gray-600">Limited Stock</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-red-600">
                          {availabilityData.filter((d) => d.availableQuantity === 0).length}
                        </div>
                        <div className="text-sm text-gray-600">Unavailable</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Product Details */}
                <div className="space-y-3">
                  {availabilityData.map((data) => {
                    const { status, color, icon: Icon } = getAvailabilityStatus(data)

                    return (
                      <Card key={data.product.id} className="border-l-4 border-l-gray-200">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Icon className={`h-4 w-4 ${color}`} />
                                <h4 className="font-medium">{data.product.name}</h4>
                                <Badge
                                  variant={
                                    status === "good" ? "default" : status === "limited" ? "secondary" : "destructive"
                                  }
                                >
                                  {data.availableQuantity} available
                                </Badge>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600 mb-2">
                                <div>Total Stock: {data.product.stock_total}</div>
                                <div>Available: {data.product.stock_available}</div>
                                <div>Booked: {data.product.stock_booked}</div>
                                <div>In Laundry: {data.product.stock_in_laundry}</div>
                              </div>

                              {data.conflicts.length > 0 && (
                                <div className="mt-3">
                                  <p className="text-sm font-medium text-gray-700 mb-2">Booking Conflicts:</p>
                                  <div className="space-y-1">
                                    {data.conflicts.map((conflict, index) => (
                                      <div
                                        key={index}
                                        className="text-xs bg-red-50 p-2 rounded flex items-center gap-2 flex-wrap"
                                      >
                                        <Calendar className="h-3 w-3" />
                                        <span>{conflict.customer_name}</span>
                                        <span>•</span>
                                        <span>
                                          {format(new Date(conflict.delivery_date), "MMM dd")} -{" "}
                                          {format(new Date(conflict.return_date), "MMM dd")}
                                        </span>
                                        <span>•</span>
                                        <span>{conflict.quantity} items</span>
                                        
                                        {/* Return Status Badges */}
                                        {conflict.return_status === 'returned' && (
                                          <Badge variant="default" className="bg-green-500 text-white text-[10px] px-1.5 py-0">
                                            Returned
                                          </Badge>
                                        )}
                                        {conflict.return_status === 'in_progress' && (
                                          <>
                                            <Badge variant="secondary" className="bg-orange-500 text-white text-[10px] px-1.5 py-0">
                                              In Progress
                                            </Badge>
                                            <span className="text-[10px] text-orange-600 font-medium">
                                              Return: {format(new Date(conflict.return_date), "MMM dd, hh:mm a")}
                                            </span>
                                          </>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {data.nextAvailableDate && (
                                <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                                  <Clock className="h-4 w-4" />
                                  <span>
                                    Next available: {format(new Date(data.nextAvailableDate), "MMM dd, yyyy")}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
