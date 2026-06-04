import { NextRequest, NextResponse } from "next/server"
import { generateAndSaveInvoicePDF } from "@/lib/services/invoice-pdf-service"
import { supabaseServer } from "@/lib/supabase-server-simple"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 60 // Allow up to 60 seconds for Puppeteer PDF rendering

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, orderType } = body

    if (!orderId || !orderType) {
      return NextResponse.json(
        { error: "orderId and orderType are required" },
        { status: 400 }
      )
    }

    const validTypes = ["product_order", "package_booking", "direct_sale", "booking", "product_orders", "package_bookings", "direct_sales_orders", "bookings"]
    if (!validTypes.includes(orderType)) {
      return NextResponse.json(
        { error: `Invalid orderType. Valid: ${validTypes.join(", ")}` },
        { status: 400 }
      )
    }

    console.log(`[PDF API] Generating PDF for ${orderType} ${orderId}...`)
    const publicUrl = await generateAndSaveInvoicePDF(orderId, orderType, supabaseServer)
    console.log(`[PDF API] Generation succeeded. URL: ${publicUrl}`)

    return NextResponse.json(
      { success: true, message: "Invoice PDF generated successfully", pdfUrl: publicUrl },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("[PDF API] Route error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
