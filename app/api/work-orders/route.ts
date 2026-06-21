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
      console.error("[Work Orders GET] Database query error:", error)
      if (error.message?.includes("restricted") || error.message?.includes("quota") || error.message?.includes("violation") || error.message?.includes("limit") || error.message?.includes("Service for this project is restricted")) {
        console.warn("Supabase restricted, returning mock work orders");
        const mockWorkOrders = [
          {
            id: "wo1",
            work_order_number: "WO-9302",
            booking_id: "b1",
            booking_source: "package_bookings",
            booking_number: "BKG-1823",
            customer_name: "Rohan Sharma",
            customer_phone: "+91 98765 43210",
            event_date: "2026-06-25",
            status: "in_progress",
            created_at: new Date().toISOString(),
            work_order_tasks: [
              {
                id: "task1",
                work_order_id: "wo1",
                department: "warehouse",
                task_number: "TSK-001",
                title: "Pick items for Rohan Sharma",
                status: "active",
                instructions: "• 1x Red Premium Silk Safa\n• 1x Gold Zari Safa\n• 2x Kalangi Brooch",
                checklist: [
                  { text: "Red Premium Silk Safa", checked: false },
                  { text: "Gold Zari Safa", checked: false },
                  { text: "Kalangi Brooch", checked: false }
                ]
              },
              {
                id: "task2",
                work_order_id: "wo1",
                department: "packing",
                task_number: "TSK-002",
                title: "Pack items for Rohan Sharma",
                status: "pending",
                instructions: "Verify all items are pressed and clean. Attach tags.",
                checklist: [
                  { text: "Pack Red Safa in Box A", checked: false },
                  { text: "Pack Gold Safa in Box B", checked: false },
                  { text: "Secure Brooches in bubble wrap", checked: false }
                ]
              }
            ]
          },
          {
            id: "wo2",
            work_order_number: "WO-9411",
            booking_id: "b2",
            booking_source: "package_bookings",
            booking_number: "BKG-1921",
            customer_name: "Amit Patel",
            customer_phone: "+91 99112 23344",
            event_date: "2026-06-28",
            status: "new",
            created_at: new Date().toISOString(),
            work_order_tasks: [
              {
                id: "task3",
                work_order_id: "wo2",
                department: "warehouse",
                task_number: "TSK-003",
                title: "Pick items for Amit Patel",
                status: "active",
                instructions: "• 3x Peach Floral Safa\n• 3x Safa Pins",
                checklist: [
                  { text: "Peach Floral Safa (Qty 3)", checked: false },
                  { text: "Safa Pins (Qty 3)", checked: false }
                ]
              }
            ]
          }
        ];
        return NextResponse.json({ success: true, data: mockWorkOrders, mock: true });
      }
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
