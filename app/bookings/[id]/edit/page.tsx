"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, RefreshCw } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { BookingForm } from "@/components/bookings/booking-form"
import type { Booking, Customer, Product } from "@/lib/types"

export default function EditBookingPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      loadData(params.id as string)
    }
  }, [params.id])

  const loadData = async (bookingId: string) => {
    try {
      setLoading(true)

      const { data: bookingData, error: bookingError } = await supabase
        .from("bookings")
        .select(`
          *,
          customer:customers(*),
          booking_items(
            id,
            quantity,
            unit_price,
            total_price,
            product:products(*)
          )
        `)
        .eq("id", bookingId)
        .single()

      if (bookingError) throw bookingError

      if (bookingData.booking_items) {
        bookingData.booking_items = bookingData.booking_items.filter((item) => item.quantity > 0)
      }

      // Load customers
      const { data: customersData, error: customersError } = await supabase.from("customers").select("*").order("name")

      if (customersError) throw customersError

      // Load products
      const { data: productsData, error: productsError } = await supabase.from("products").select("*").order("name")

      if (productsError) throw productsError

      setBooking(bookingData)
      setCustomers(customersData || [])
      setProducts(productsData || [])
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: "Failed to load booking data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateBooking = async (bookingData: any) => {
    try {
      const { error: bookingError } = await supabase
        .from("bookings")
        .update({
          customer_id: bookingData.isNewCustomer ? null : bookingData.customer,
          type: bookingData.bookingType,
          payment_type: bookingData.paymentType,
          status: booking?.status || "pending",
          event_date: bookingData.eventDate?.toISOString(),
          delivery_date: bookingData.deliveryDate?.toISOString(),
          pickup_date: bookingData.returnDate?.toISOString(),
          total_amount: bookingData.totalAmount,
          notes: bookingData.notes,
          groom_name: bookingData.groomName,
          groom_additional_whatsapp: bookingData.groomWhatsapp,
          groom_home_address: bookingData.groomHomeAddress,
          bride_name: bookingData.brideName,
          bride_additional_whatsapp: bookingData.brideWhatsapp,
          bride_home_address: bookingData.brideHomeAddress,
          venue_name: bookingData.venueName,
          venue_address: bookingData.venueAddress,
          event_type: bookingData.eventType,
          event_for: bookingData.eventFor,
          updated_at: new Date().toISOString(),
        })
        .eq("id", params.id)

      if (bookingError) throw bookingError

      // Handle new customer creation if needed
      if (bookingData.isNewCustomer) {
        const { data: newCustomer, error: customerError } = await supabase
          .from("customers")
          .insert([
            {
              name: bookingData.customer.name,
              phone: bookingData.customer.phone,
              whatsapp: bookingData.customer.whatsapp || bookingData.customer.phone,
              email: bookingData.customer.email,
              address: bookingData.customer.address,
              city: bookingData.customer.city,
              state: bookingData.customer.state,
              area: bookingData.customer.area,
            },
          ])
          .select()
          .single()

        if (customerError) throw customerError

        // Update booking with new customer ID
        await supabase.from("bookings").update({ customer_id: newCustomer.id }).eq("id", params.id)
      }

      // Delete existing booking items
      await supabase.from("booking_items").delete().eq("booking_id", params.id)

      // Insert updated booking items
      const bookingItems = Object.entries(bookingData.selectedProducts).map(([productId, quantity]) => {
        const product = products.find((p) => p.id === productId)
        const unitPrice = bookingData.bookingType === "rental" ? product?.rental_price : product?.price
        return {
          booking_id: params.id,
          product_id: productId,
          quantity: quantity as number,
          unit_price: unitPrice || 0,
          total_price: (unitPrice || 0) * (quantity as number),
        }
      })

      if (bookingItems.length > 0) {
        const { error: itemsError } = await supabase.from("booking_items").insert(bookingItems)

        if (itemsError) throw itemsError
      }

      toast({
        title: "Success",
        description: "Booking updated successfully!",
      })

      router.push(`/bookings/${params.id}`)
    } catch (error) {
      console.error("Error updating booking:", error)
      toast({
        title: "Error",
        description: "Failed to update booking. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="text-center py-8">
          <h3 className="mt-2 text-sm font-semibold text-gray-900">Booking not found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            The booking you're trying to edit doesn't exist or has been deleted.
          </p>
          <div className="mt-6">
            <Button onClick={() => router.push("/bookings")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Bookings
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.push(`/bookings/${params.id}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Edit Booking</h2>
            <p className="text-muted-foreground">#{booking.booking_number}</p>
          </div>
        </div>
      </div>

      <BookingForm customers={customers} products={products} onSubmit={handleUpdateBooking} initialBooking={booking} />
    </div>
  )
}
