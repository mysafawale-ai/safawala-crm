import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Get user session from cookie and validate franchise access
 */
async function getUserFromSession(request: NextRequest) {
  try {
    const cookieHeader = request.cookies.get("safawala_session")
    if (!cookieHeader?.value) {
      throw new Error("No session found")
    }
    
    const sessionData = JSON.parse(cookieHeader.value)
    if (!sessionData.id) {
      throw new Error("Invalid session")
    }

    // Use service role to fetch user details (bypasses RLS for user lookup only)
    const supabase = createClient()
    const { data: user, error } = await supabase
      .from("users")
      .select("id, franchise_id, role")
      .eq("id", sessionData.id)
      .eq("is_active", true)
      .single()

    if (error || !user) {
      throw new Error("User not found")
    }

    return {
      userId: user.id,
      franchiseId: user.franchise_id,
      role: user.role,
      isSuperAdmin: user.role === "super_admin"
    }
  } catch (error) {
    throw new Error("Authentication required")
  }
}

export async function GET(request: NextRequest) {
  try {
    const { franchiseId, isSuperAdmin } = await getUserFromSession(request)
    const supabase = createClient()

    console.log(`[Bookings API] Fetching bookings for franchise: ${franchiseId}, isSuperAdmin: ${isSuperAdmin}`)

    // Build queries with franchise filter (unless super admin)
    let productQuery = supabase
      .from("product_orders")
      .select(`
        id, order_number, customer_id, franchise_id, status, event_date, delivery_date, return_date, booking_type,
        event_type, venue_address, total_amount, amount_paid, notes, created_at,
        customer:customers(name, phone, email)
      `)
      .eq("is_quote", false)
      .order("created_at", { ascending: false })

    let packageQuery = supabase
      .from("package_bookings")
      .select(`
        id, package_number, customer_id, franchise_id, status, event_date, delivery_date, return_date,
        event_type, venue_address, total_amount, amount_paid, notes, created_at,
        customer:customers(name, phone, email)
      `)
      .eq("is_quote", false)
      .order("created_at", { ascending: false })

    // CRITICAL: Filter by franchise_id unless super admin
    if (!isSuperAdmin && franchiseId) {
      productQuery = productQuery.eq("franchise_id", franchiseId)
      packageQuery = packageQuery.eq("franchise_id", franchiseId)
      console.log(`[Bookings API] Applied franchise filter: ${franchiseId}`)
    } else {
      console.log(`[Bookings API] Super admin mode - showing all bookings`)
    }

    const [productRes, packageRes] = await Promise.all([productQuery, packageQuery])
    
    if (productRes.error && packageRes.error) {
      console.error("[Bookings API] Error:", productRes.error || packageRes.error)
      const msg = productRes.error?.message || packageRes.error?.message || 'Failed to fetch bookings'
      return NextResponse.json({ error: msg }, { status: 500 })
    }

    // Map to unified Booking shape
    const productRows = (productRes.data || []).map((r: any) => ({
      id: r.id,
      booking_number: r.order_number,
      customer_id: r.customer_id,
      franchise_id: r.franchise_id,
      event_date: r.event_date,
      delivery_date: r.delivery_date,
      pickup_date: r.return_date,
      event_type: r.event_type || null,
      status: r.status,
      total_amount: Number(r.total_amount) || 0,
      paid_amount: Number(r.amount_paid) || 0,
      notes: r.notes,
      created_at: r.created_at,
      updated_at: r.created_at,
      customer: r.customer || null,
      venue_address: r.venue_address || null,
      source: 'product_order' as const,
      type: r.booking_type || 'rental',
      booking_kind: 'product' as const,
    }))

    const packageRows = (packageRes.data || []).map((r: any) => ({
      id: r.id,
      booking_number: r.package_number,
      customer_id: r.customer_id,
      franchise_id: r.franchise_id,
      event_date: r.event_date,
      delivery_date: r.delivery_date,
      pickup_date: r.return_date,
      event_type: r.event_type || null,
      status: r.status,
      total_amount: Number(r.total_amount) || 0,
      paid_amount: Number(r.amount_paid) || 0,
      notes: r.notes,
      created_at: r.created_at,
      updated_at: r.created_at,
      customer: r.customer || null,
      venue_address: r.venue_address || null,
      source: 'package_booking' as const,
      type: 'package' as const,
      booking_kind: 'package' as const,
    }))

    const data = [...productRows, ...packageRows].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )

    console.log(`[Bookings API] Returning ${data.length} bookings`)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("[Bookings API] Error:", error)
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, franchiseId } = await getUserFromSession(request)
    const supabase = createClient()

    const body = await request.json()
    const { customer_id, event_date, venue_name, booking_items = [] } = body

    if (!customer_id || typeof customer_id !== "string") {
      return NextResponse.json({ error: "Customer ID is required and must be valid" }, { status: 400 })
    }

    if (!event_date || !Date.parse(event_date)) {
      return NextResponse.json({ error: "Valid event date is required" }, { status: 400 })
    }

    if (!venue_name || typeof venue_name !== "string" || venue_name.trim().length === 0) {
      return NextResponse.json({ error: "Venue name is required" }, { status: 400 })
    }

    if (booking_items.length > 0) {
      for (const item of booking_items) {
        if (!item.product_id || !item.quantity || item.quantity <= 0) {
          return NextResponse.json(
            { error: "All booking items must have valid product_id and quantity" },
            { status: 400 },
          )
        }
        if (typeof item.quantity !== "number" || item.quantity > 1000) {
          return NextResponse.json({ error: "Invalid quantity. Must be a number between 1 and 1000" }, { status: 400 })
        }
      }
    }

    const { data: transactionResult, error: transactionError } = await supabase.rpc(
      "create_booking_with_conflict_check",
      {
        p_customer_id: customer_id,
        p_event_date: event_date,
        p_venue_name: venue_name.trim(),
        p_franchise_id: franchiseId,
        p_created_by: userId,
        p_booking_data: JSON.stringify({
          type: body.type || "rental",
          event_type: body.event_type || null,
          payment_type: body.payment_type || "advance_payment",
          delivery_date: body.delivery_date || null,
          return_date: body.return_date || null,
          event_for: body.event_for || null,
          groom_name: body.groom_name || null,
          groom_home_address: body.groom_home_address || null,
          groom_additional_whatsapp: body.groom_additional_whatsapp || null,
          bride_name: body.bride_name || null,
          bride_home_address: body.bride_home_address || null,
          bride_additional_whatsapp: body.bride_additional_whatsapp || null,
          venue_address: body.venue_address || null,
          special_instructions: body.special_instructions || null,
          total_amount: body.total_amount || 0,
          subtotal: body.subtotal || 0,
          gst_amount: body.gst_amount || 0,
          other_amount: body.other_amount || 0,
        }),
        p_booking_items: JSON.stringify(booking_items),
      },
    )

    if (transactionError) {
      if (transactionError.message.includes("conflict")) {
        return NextResponse.json({ error: transactionError.message }, { status: 409 })
      }
      if (transactionError.message.includes("stock")) {
        return NextResponse.json({ error: transactionError.message }, { status: 400 })
      }
      if (transactionError.message.includes("not found")) {
        return NextResponse.json({ error: transactionError.message }, { status: 404 })
      }
      return NextResponse.json({ error: transactionError.message }, { status: 500 })
    }

    const booking = transactionResult

    try {
      const { NotificationService } = await import("@/lib/notification-service")
      // await NotificationService.sendBookingConfirmation(booking.id) // TODO: Implement notification service
    } catch (notificationError) {
      console.error("[v0] WATI notification failed:", notificationError)
      // Don't fail the booking creation if notification fails
    }

    return NextResponse.json({
      success: true,
      data: booking,
    })
  } catch (error) {
    console.error("[v0] Booking creation error:", error)
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
