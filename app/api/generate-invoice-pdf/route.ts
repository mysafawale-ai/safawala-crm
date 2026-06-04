import { NextRequest, NextResponse } from "next/server"
import { generateAndSaveInvoicePDF } from "@/lib/services/invoice-pdf-service"
import { supabaseServer } from "@/lib/supabase-server-simple"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

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

    // Fire-and-forget: Spawns the PDF generation asynchronously in the background
    // so the client gets an immediate response.
    console.log(`[PDF API] Spawning background PDF generation for ${orderType} ${orderId}...`)
    
    // We execute the async process in a non-awaited IIFE
    ;(async () => {
      try {
        const publicUrl = await generateAndSaveInvoicePDF(orderId, orderType, supabaseServer)
        console.log(`[PDF API] Background generation succeeded. URL: ${publicUrl}`)
      } catch (err: any) {
        console.error(`[PDF API] Background generation failed for ${orderType} ${orderId}:`, err.message || err)
      }
    })()

    return NextResponse.json(
      { success: true, message: "Invoice PDF generation initiated in the background" },
      { status: 202 }
    )
  } catch (error: any) {
    console.error("[PDF API] Route error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
