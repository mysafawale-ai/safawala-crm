import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server-simple"
import { authenticateRequest } from "@/lib/auth-middleware"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

interface ReturnItem {
  id: string
  product_id?: string
  variant_id?: string
  product_name: string
  variant_name?: string
  quantity: number
  lost_damaged: number
  used: number
  fresh: number
}

/**
 * POST /api/deliveries/process-return
 * Process return: send used to laundry, fresh to inventory, lost/damaged to booking
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, { minRole: "staff" })
    if (!auth.authorized) {
      return NextResponse.json(auth.error, { status: auth.statusCode || 401 })
    }

    const body = await request.json()
    const {
      delivery_id,
      booking_id,
      booking_source,
      items,
      client_name,
      client_phone,
      notes,
      photo_url,
    } = body

    if (!delivery_id || !booking_id || !items?.length) {
      return NextResponse.json(
        { error: "delivery_id, booking_id, and items are required" },
        { status: 400 }
      )
    }

    const typedItems = items as ReturnItem[]
    let usedToLaundry = 0
    let freshToInventory = 0
    let lostDamagedCount = 0

    // Determine which table to update
    const itemsTable = booking_source === "package_booking"
      ? "package_booking_product_items"
      : "product_order_items"

    const bookingTable = booking_source === "package_booking"
      ? "package_bookings"
      : "product_orders"

    // Process each item
    for (const item of typedItems) {
      // 1. Update item with return quantities
      await supabaseServer
        .from(itemsTable)
        .update({
          return_lost_damaged: item.lost_damaged,
          return_used: item.used,
          return_fresh: item.fresh,
          return_processed: true,
          return_processed_at: new Date().toISOString(),
        })
        .eq("id", item.id)

      // 2. Send USED items to Laundry
      if (item.used > 0 && item.variant_id) {
        usedToLaundry += item.used

        // Create laundry entry
        await supabaseServer.from("laundry_items").insert({
          variant_id: item.variant_id,
          product_id: item.product_id,
          product_name: item.product_name,
          variant_name: item.variant_name,
          quantity: item.used,
          status: "pending",
          source: "return",
          source_id: delivery_id,
          booking_id: booking_id,
          franchise_id: auth.user?.franchise_id,
          created_by: auth.user?.id,
          notes: `Return from delivery - ${item.used} items need cleaning`,
        })
      }

      // 3. Return FRESH items to Inventory (increase stock)
      if (item.fresh > 0 && item.variant_id) {
        freshToInventory += item.fresh

        // Get current stock and update
        const { data: variant } = await supabaseServer
          .from("product_variants")
          .select("stock_quantity")
          .eq("id", item.variant_id)
          .single()

        if (variant) {
          await supabaseServer
            .from("product_variants")
            .update({
              stock_quantity: (variant.stock_quantity || 0) + item.fresh,
              updated_at: new Date().toISOString(),
            })
            .eq("id", item.variant_id)

          // Log inventory movement
          await supabaseServer.from("inventory_movements").insert({
            variant_id: item.variant_id,
            product_id: item.product_id,
            movement_type: "return",
            quantity: item.fresh,
            previous_stock: variant.stock_quantity || 0,
            new_stock: (variant.stock_quantity || 0) + item.fresh,
            reference_type: "delivery_return",
            reference_id: delivery_id,
            notes: `Fresh items returned from delivery`,
            franchise_id: auth.user?.franchise_id,
            created_by: auth.user?.id,
          })
        }
      }

      // 4. Track LOST/DAMAGED items
      if (item.lost_damaged > 0) {
        lostDamagedCount += item.lost_damaged

        // Update booking's lost_damaged_items JSON
        const { data: booking } = await supabaseServer
          .from(bookingTable)
          .select("lost_damaged_items")
          .eq("id", booking_id)
          .single()

        const existingLostDamaged = booking?.lost_damaged_items || []
        const newLostDamagedEntry = {
          product_id: item.product_id,
          variant_id: item.variant_id,
          product_name: item.product_name,
          variant_name: item.variant_name,
          quantity: item.lost_damaged,
          reported_at: new Date().toISOString(),
          reported_by: auth.user?.name || auth.user?.email,
          source: "return_processing",
        }

        await supabaseServer
          .from(bookingTable)
          .update({
            lost_damaged_items: [...existingLostDamaged, newLostDamagedEntry],
            updated_at: new Date().toISOString(),
          })
          .eq("id", booking_id)

        // Also log to product_archive table if it exists
        try {
          await supabaseServer.from("product_archive").insert({
            product_id: item.product_id,
            variant_id: item.variant_id,
            product_name: item.product_name,
            variant_name: item.variant_name,
            quantity: item.lost_damaged,
            reason: "lost_damaged",
            source: "delivery_return",
            source_id: delivery_id,
            booking_id: booking_id,
            franchise_id: auth.user?.franchise_id,
            created_by: auth.user?.id,
            notes: notes || `Lost/damaged during delivery return`,
          })
        } catch (archiveErr) {
          // Table might not exist, that's okay
          console.warn("Could not insert to product_archive:", archiveErr)
        }
      }
    }

    // 5. Update delivery status to return_completed
    await supabaseServer
      .from("deliveries")
      .update({
        status: "return_completed",
        return_completed_at: new Date().toISOString(),
        return_confirmation_name: client_name,
        return_confirmation_phone: client_phone,
        return_notes: notes,
        return_photo_url: photo_url,
        return_processed_by: auth.user?.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", delivery_id)

    // 6. Update booking status if needed
    await supabaseServer
      .from(bookingTable)
      .update({
        return_status: "completed",
        return_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", booking_id)

    return NextResponse.json({
      success: true,
      message: "Return processed successfully",
      used_to_laundry: usedToLaundry,
      fresh_to_inventory: freshToInventory,
      lost_damaged_count: lostDamagedCount,
    })
  } catch (error: any) {
    console.error("[Process Return] Error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
