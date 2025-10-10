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

    // Convert the quote to a booking by updating its fields
    const { data: updatedBooking, error: updateError } = await supabase
      .from(tableName)
      .update({
        is_quote: false,
        status: "pending_payment",
        updated_at: new Date().toISOString()
      })
      .eq("id", quote_id)
      .select()
      .single()

    if (updateError) {
      console.error("Error converting quote:", updateError)
      throw new Error("Failed to convert quote to booking")
    }

    // For product orders, update inventory (reduce stock)
    if (booking_type !== "package") {
      // Fetch the product order items
      const { data: items, error: itemsError } = await supabase
        .from("product_order_items")
        .select("*, product:products(id, name, total_quantity)")
        .eq("order_id", quote_id)

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
      booking_id: updatedBooking.id,
      booking_number: tableName === "package_bookings" ? updatedBooking.package_number : updatedBooking.order_number,
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