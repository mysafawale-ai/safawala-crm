import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth-middleware"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, 'readonly')
    if (!authResult.success) {
      return NextResponse.json(authResult.response, { status: 401 })
    }
    const user = authResult.authContext!.user
    const franchiseId = user.franchise_id
    const isSuperAdmin = user.role === 'super_admin'

    const supabase = createClient()
    
    let query = supabase
      .from("work_orders")
      .select(`
        *,
        work_order_tasks(*)
      `)
      .order("created_at", { ascending: false })

    if (!isSuperAdmin && franchiseId) {
      query = query.eq("franchise_id", franchiseId)
    }

    const { data: workOrders, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!workOrders || workOrders.length === 0) {
      return NextResponse.json({ success: true, data: [] })
    }

    // Group booking IDs by their source table for batched detail queries
    const productOrderIds = workOrders
      .filter((wo) => wo.booking_source === "product_orders")
      .map((wo) => wo.booking_id)

    const packageBookingIds = workOrders
      .filter((wo) => wo.booking_source === "package_bookings")
      .map((wo) => wo.booking_id)

    const directSalesIds = workOrders
      .filter((wo) => wo.booking_source === "direct_sales_orders")
      .map((wo) => wo.booking_id)

    // Execute queries in parallel
    const [productOrdersRes, packageBookingsRes, directSalesRes] = await Promise.all([
      productOrderIds.length > 0
        ? supabase.from("product_orders").select("id, order_number, event_date, customer:customers(name, phone)").in("id", productOrderIds)
        : Promise.resolve({ data: [] }),
      packageBookingIds.length > 0
        ? supabase.from("package_bookings").select("id, package_number, event_date, customer:customers(name, phone)").in("id", packageBookingIds)
        : Promise.resolve({ data: [] }),
      directSalesIds.length > 0
        ? supabase.from("direct_sales_orders").select("id, sale_number, sale_date, customer:customers(name, phone)").in("id", directSalesIds)
        : Promise.resolve({ data: [] })
    ])

    const productOrdersMap = new Map(productOrdersRes.data?.map((o: any) => [o.id, o]) || [])
    const packageBookingsMap = new Map(packageBookingsRes.data?.map((o: any) => [o.id, o]) || [])
    const directSalesMap = new Map(directSalesRes.data?.map((o: any) => [o.id, o]) || [])

    // Enrich each work order with its booking number, event date, and customer details
    const enrichedWorkOrders = workOrders.map((wo) => {
      let bookingDetails: any = null
      let bookingNumber = ""
      let eventDate = ""
      let customerName = ""
      let customerPhone = ""

      if (wo.booking_source === "product_orders") {
        bookingDetails = productOrdersMap.get(wo.booking_id)
        if (bookingDetails) {
          bookingNumber = bookingDetails.order_number
          eventDate = bookingDetails.event_date
          customerName = bookingDetails.customer?.name
          customerPhone = bookingDetails.customer?.phone
        }
      } else if (wo.booking_source === "package_bookings") {
        bookingDetails = packageBookingsMap.get(wo.booking_id)
        if (bookingDetails) {
          bookingNumber = bookingDetails.package_number
          eventDate = bookingDetails.event_date
          customerName = bookingDetails.customer?.name
          customerPhone = bookingDetails.customer?.phone
        }
      } else if (wo.booking_source === "direct_sales_orders") {
        bookingDetails = directSalesMap.get(wo.booking_id)
        if (bookingDetails) {
          bookingNumber = bookingDetails.sale_number
          eventDate = bookingDetails.sale_date
          customerName = bookingDetails.customer?.name
          customerPhone = bookingDetails.customer?.phone
        }
      }

      return {
        ...wo,
        booking_number: bookingNumber || wo.work_order_number.replace('WO-', 'BKG-'),
        event_date: eventDate || null,
        customer_name: customerName || "N/A",
        customer_phone: customerPhone || "N/A",
      }
    })

    return NextResponse.json({ success: true, data: enrichedWorkOrders })
  } catch (error: any) {
    console.error("[Work Orders GET] Error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
