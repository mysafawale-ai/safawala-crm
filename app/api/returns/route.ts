import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import AuditLogger from "@/lib/audit-logger"

// Contract
// Input JSON:
// {
//   deliveryId: string,
//   bookingId: string,
//   items: Array<{ product_id: string, qty_delivered: number, qty_returned: number, qty_damaged: number, qty_lost: number, notes?: string }>,
//   notes?: string,
//   user?: { id?: string, email?: string }
// }
// Output: { success: boolean, returnId?: string }

export async function POST(request: Request) {
  const supabase = createClient()
  try {
    const body = await request.json()
    const { deliveryId, bookingId, items, notes, user } = body || {}

    if (!bookingId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: "bookingId and items are required" }, { status: 400 })
    }

    // Basic validation for each item
    for (const it of items) {
      const d = Number(it.qty_delivered || 0)
      const r = Number(it.qty_returned || 0)
      const dm = Number(it.qty_damaged || 0)
      const l = Number(it.qty_lost || 0)
      if (r < 0 || dm < 0 || l < 0 || d < 0) {
        return NextResponse.json({ success: false, error: "Quantities must be non-negative" }, { status: 400 })
      }
      if (r + dm + l !== d) {
        return NextResponse.json({ success: false, error: "returned + damaged + lost must equal delivered for all items" }, { status: 400 })
      }
    }

    // Create rental_returns header
    const { data: ret, error: retErr } = await supabase
      .from("rental_returns")
      .insert({ booking_id: bookingId, delivery_id: deliveryId || null, processed_by: user?.id || null, notes: notes || null })
      .select("id")
      .single()

    if (retErr) throw retErr

    const returnId = ret.id

    // Insert items
    const rows = items.map((it: any) => ({
      return_id: returnId,
      product_id: it.product_id,
      qty_delivered: Number(it.qty_delivered || 0),
      qty_returned: Number(it.qty_returned || 0),
      qty_damaged: Number(it.qty_damaged || 0),
      qty_lost: Number(it.qty_lost || 0),
      notes: it.notes || null,
    }))

    const { error: itemsErr } = await supabase.from("rental_return_items").insert(rows)
    if (itemsErr) throw itemsErr

    // Aggregate totals for booking summary and inventory updates per product
    let totalDamaged = 0
    let totalLost = 0

    for (const r of rows) {
      totalDamaged += r.qty_damaged
      totalLost += r.qty_lost

      // Inventory adjustments on products table
      // returned -> increase available (stock_available) and decrease stock_booked if tracked
      // damaged -> increase stock_damaged
      // lost -> decrease stock_total and stock_available

      // Fetch current product snapshot (best-effort)
      const { data: prod } = await supabase
        .from("products")
        .select("id, stock_total, stock_available, stock_booked, stock_damaged")
        .eq("id", r.product_id)
        .maybeSingle()

      // Compute new values safely
      const stock_total = Math.max(0, (prod?.stock_total || 0) - r.qty_lost)
      const stock_available = Math.max(0, (prod?.stock_available || 0) + r.qty_returned - r.qty_lost)
      const stock_damaged = Math.max(0, (prod?.stock_damaged || 0) + r.qty_damaged)
      const stock_booked = Math.max(0, (prod?.stock_booked || 0) - r.qty_delivered) // whole delivered batch no longer booked

      await supabase
        .from("products")
        .update({ stock_total, stock_available, stock_damaged, stock_booked })
        .eq("id", r.product_id)
    }

    // Push damaged/lost summary into booking (accumulative)
    const { data: existing } = await supabase
      .from("bookings")
      .select("id, settlement_details")
      .eq("id", bookingId)
      .maybeSingle()

    const settlement_details = existing?.settlement_details || {}
    const returnsSummary = settlement_details.returns_summary || { damaged: 0, lost: 0 }
    returnsSummary.damaged = Number(returnsSummary.damaged || 0) + totalDamaged
    returnsSummary.lost = Number(returnsSummary.lost || 0) + totalLost

    const newDetails = { ...settlement_details, returns_summary: returnsSummary }

    await supabase
      .from("bookings")
      .update({ settlement_details: newDetails })
      .eq("id", bookingId)

    // Audit log
    try {
      await AuditLogger.logCreate("rental_returns", returnId, { booking_id: bookingId, delivery_id: deliveryId, totals: { damaged: totalDamaged, lost: totalLost } }, {
        userId: user?.id,
        userEmail: user?.email,
      })
    } catch (e) {
      console.warn("Audit log failed for rental return", e)
    }

    return NextResponse.json({ success: true, returnId })
  } catch (error: any) {
    console.error("Process return failed:", error)
    return NextResponse.json({ success: false, error: error?.message || "Unknown error" }, { status: 500 })
  }
}
