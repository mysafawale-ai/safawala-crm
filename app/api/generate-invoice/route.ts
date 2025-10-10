import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { bookingId } = await request.json()

    const supabase = createServerClient()

    // Get booking details with customer and items
    const { data: booking, error } = await supabase
      .from("bookings")
      .select(`
        *,
        customer:customers(*),
        booking_items(*, product:products(*)),
        franchise:franchises(*)
      `)
      .eq("id", bookingId)
      .single()

    if (error) throw error

    // Generate PDF invoice (simplified version)
    const invoiceData = {
      bookingNumber: booking.booking_number,
      date: new Date(booking.created_at).toLocaleDateString(),
      customer: booking.customer,
      franchise: booking.franchise,
      items: booking.booking_items,
      totalAmount: booking.total_amount,
      amountPaid: booking.amount_paid,
      pendingAmount: booking.pending_amount,
      depositAmount: booking.deposit_amount,
    }

    // In a real implementation, you would use a PDF library like jsPDF or Puppeteer
    // For now, we'll return the invoice data
    return NextResponse.json({
      success: true,
      invoiceData,
      message: "Invoice generated successfully",
    })
  } catch (error) {
    console.error("Error generating invoice:", error)
    return NextResponse.json({ error: "Failed to generate invoice" }, { status: 500 })
  }
}
