import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-middleware"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

// POST /api/orders — create a new product_order + items + lost/damaged items
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth.success) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = auth.authContext!.user
  const franchiseId = user.franchise_id
  if (!franchiseId) return NextResponse.json({ error: "No franchise assigned" }, { status: 403 })

  try {
    const body = await req.json()
    const { orderData, items, lostDamagedItems } = body

    const supabase = createClient()

    // Create the order
    const { data: order, error: orderError } = await supabase
      .from("product_orders")
      .insert([{ ...orderData, franchise_id: franchiseId }])
      .select()
      .single()

    if (orderError) {
      console.error("[Orders API] Insert error:", orderError)
      return NextResponse.json({ error: orderError.message }, { status: 500 })
    }

    // Insert items
    if (items && items.length > 0) {
      const itemsData = items.map((item: any) => ({ ...item, order_id: order.id }))
      const { error: itemsError } = await supabase.from("product_order_items").insert(itemsData)
      if (itemsError) {
        console.error("[Orders API] Items insert error:", itemsError)
        return NextResponse.json({ error: itemsError.message }, { status: 500 })
      }
    }

    // Insert lost/damaged items
    if (lostDamagedItems && lostDamagedItems.length > 0) {
      const ldData = lostDamagedItems.map((ld: any) => ({ ...ld, order_id: order.id }))
      const { error: ldError } = await supabase.from("order_lost_damaged_items").insert(ldData)
      if (ldError) {
        console.warn("[Orders API] Lost/damaged insert error (table may not exist):", ldError)
      }

      // Update inventory stock for lost/damaged
      for (const ldItem of lostDamagedItems) {
        if (ldItem.product_id) {
          const { data: product } = await supabase
            .from("products")
            .select("stock_available, stock_total")
            .eq("id", ldItem.product_id)
            .single()
          if (product) {
            await supabase
              .from("products")
              .update({
                stock_available: Math.max(0, (product.stock_available || 0) - ldItem.quantity),
                stock_total: Math.max(0, (product.stock_total || 0) - ldItem.quantity),
                updated_at: new Date().toISOString(),
              })
              .eq("id", ldItem.product_id)
          }
        }
      }
    }

    return NextResponse.json({ order }, { status: 201 })
  } catch (err: any) {
    console.error("[Orders API] Unexpected error:", err)
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 })
  }
}

// PUT /api/orders — update existing product_order + replace items + lost/damaged items
export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth.success) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = auth.authContext!.user
  const franchiseId = user.franchise_id

  try {
    const body = await req.json()
    const { orderId, orderData, items, lostDamagedItems } = body

    if (!orderId) return NextResponse.json({ error: "orderId is required" }, { status: 400 })

    const supabase = createClient()

    // Update the order
    const updatePayload: any = { ...orderData }
    if (franchiseId && !user.is_super_admin) {
      updatePayload.franchise_id = franchiseId
    }

    const { error: updateError } = await supabase
      .from("product_orders")
      .update(updatePayload)
      .eq("id", orderId)

    if (updateError) {
      console.error("[Orders API] Update error:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Replace items
    await supabase.from("product_order_items").delete().eq("order_id", orderId)

    if (items && items.length > 0) {
      const itemsData = items.map((item: any) => ({ ...item, order_id: orderId }))
      const { error: itemsError } = await supabase.from("product_order_items").insert(itemsData)
      if (itemsError) {
        console.error("[Orders API] Items update error:", itemsError)
        return NextResponse.json({ error: itemsError.message }, { status: 500 })
      }
    }

    // Replace lost/damaged items
    if (lostDamagedItems !== undefined) {
      await supabase.from("order_lost_damaged_items").delete().eq("order_id", orderId)
      if (lostDamagedItems.length > 0) {
        const ldData = lostDamagedItems.map((ld: any) => ({ ...ld, order_id: orderId }))
        await supabase.from("order_lost_damaged_items").insert(ldData)
      }
    }

    return NextResponse.json({ success: true, orderId })
  } catch (err: any) {
    console.error("[Orders API] Unexpected error:", err)
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 })
  }
}
