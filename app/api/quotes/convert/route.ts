import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { quote_id, booking_type } = await request.json()

    if (!quote_id) {
      return NextResponse.json(
        { error: "Quote ID is required" },
        { status: 400 }
      )
    }

    // Determine which table to query based on booking_type
    const tableName = booking_type === "package" ? "package_bookings" : "product_orders"

    // Fetch the quote
    const { data: quote, error: quoteError } = await supabase
      .from(tableName)
      .select("*")
      .eq("id", quote_id)
      .eq("is_quote", true)
      .single()

    if (quoteError || !quote) {
      return NextResponse.json(
        { error: "Quote not found" },
        { status: 404 }
      )
    }

    // Check if quote is already converted (status is not 'quote')
    if (quote.status !== "generated" && quote.status !== "quote" && quote.status !== "sent" && quote.status !== "accepted") {
      return NextResponse.json(
        { error: "Quote has already been converted or has invalid status" },
        { status: 400 }
      )
    }

    // Convert the quote to a booking by:
    // 1. Creating a NEW booking entry (duplicate of quote)
    // 2. Marking the original quote as 'converted' (keeps it visible in quotes)
    
    // First, update the quote status to 'converted'
    const { error: quoteUpdateError } = await supabase
      .from(tableName)
      .update({
        status: "converted",
        updated_at: new Date().toISOString()
      })
      .eq("id", quote_id)

    if (quoteUpdateError) {
      console.error("Error updating quote status:", quoteUpdateError)
      throw new Error("Failed to update quote status")
    }

    // Second, create a NEW booking entry (duplicate of the quote)
    const bookingData = {
      ...quote,
      id: undefined, // Remove ID to create new record
      is_quote: false, // This is a booking, not a quote
      status: "pending_payment", // New booking status
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: newBooking, error: createError } = await supabase
      .from(tableName)
      .insert(bookingData)
      .select()
      .single()

    if (createError) {
      console.error("Error creating booking:", createError)
      throw new Error("Failed to create booking from quote")
    }

    // If product order, duplicate the order items for the new booking
    if (booking_type !== "package" && newBooking) {
      const { data: quoteItems, error: itemsFetchError } = await supabase
        .from("product_order_items")
        .select("*")
        .eq("order_id", quote_id)

      if (!itemsFetchError && quoteItems && quoteItems.length > 0) {
        const newItems = quoteItems.map(item => ({
          ...item,
          id: undefined, // Remove ID to create new records
          order_id: newBooking.id // Link to new booking
        }))

        await supabase
          .from("product_order_items")
          .insert(newItems)
      }
    }

    // For product orders, update inventory (reduce stock)
    if (booking_type !== "package" && newBooking) {
      // Fetch the NEW booking's product order items
      const { data: items, error: itemsError } = await supabase
        .from("product_order_items")
        .select("*, product:products(id, name, total_quantity)")
        .eq("order_id", newBooking.id)

      if (!itemsError && items && items.length > 0) {
        for (const item of items) {
          if (item.product) {
            const newQuantity = (item.product.total_quantity || 0) - item.quantity
            
            // Update product stock
            await supabase
              .from("products")
              .update({ total_quantity: newQuantity })
              .eq("id", item.product_id)
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      booking_id: newBooking?.id,
      booking_number: tableName === "package_bookings" ? newBooking?.package_number : newBooking?.order_number,
      message: "Quote successfully converted to booking"
    })

  } catch (error: any) {
    console.error("Error in convert API:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}