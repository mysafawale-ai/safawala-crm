import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

/**
 * GET /api/returns/[id]/preview
 * Preview inventory impact before processing return
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const returnId = params.id
    
    // Get URL parameters for item quantities (if provided)
    const { searchParams } = new URL(request.url)
    const itemsParam = searchParams.get("items") // JSON string of items
    
    // 1. Fetch return record
    const { data: returnRecord, error: returnError } = await supabase
      .from("returns")
      .select("*")
      .eq("id", returnId)
      .single()
    
    if (returnError || !returnRecord) {
      return NextResponse.json(
        { error: "Return not found" },
        { status: 404 }
      )
    }
    
    // 2. Get products from booking
    let productIds: string[] = []
    
    if (returnRecord.booking_source === "product_order") {
      const { data: orderItems } = await supabase
        .from("product_order_items")
        .select("product_id, quantity")
        .eq("order_id", returnRecord.booking_id)
      
      productIds = (orderItems || []).map(item => item.product_id)
    } else if (returnRecord.booking_source === "package_booking") {
      const { data: packageItems } = await supabase
        .from("package_booking_items")
        .select("selected_products")
        .eq("booking_id", returnRecord.booking_id)
      
      // Extract product IDs from selected_products array
      productIds = (packageItems || []).flatMap(item => item.selected_products || [])
    }
    
    // Remove duplicates
    productIds = [...new Set(productIds)]
    
    if (productIds.length === 0) {
      return NextResponse.json({
        success: true,
        preview: [],
        message: "No products found in booking"
      })
    }
    
    // 3. Fetch current product inventory
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name, product_code, category, stock_total, stock_available, stock_damaged, stock_booked, stock_in_laundry")
      .in("id", productIds)
    
    if (productsError) {
      console.error("Error fetching products:", productsError)
      return NextResponse.json(
        { error: "Failed to fetch products" },
        { status: 500 }
      )
    }
    
    // 4. Parse items if provided, otherwise use defaults
    let items: any[] = []
    if (itemsParam) {
      try {
        items = JSON.parse(itemsParam)
      } catch (e) {
        console.error("Error parsing items param:", e)
      }
    }
    
    // 5. Calculate preview for each product
    const preview = (products || []).map(product => {
      // Find item data if provided
      const itemData = items.find(i => i.product_id === product.id)
      
      const qty_delivered = itemData?.qty_delivered || 0
      const qty_returned = itemData?.qty_returned || 0
      const qty_not_used = itemData?.qty_not_used || 0
      const qty_damaged = itemData?.qty_damaged || 0
      const qty_lost = itemData?.qty_lost || 0
      const send_to_laundry = itemData?.send_to_laundry || false
      
      // Calculate new inventory values
      // qty_not_used: Goes directly to available (never used, no laundry needed)
      // qty_returned: Goes to laundry if send_to_laundry is true, otherwise to available
      const directToAvailable = qty_not_used + (send_to_laundry ? 0 : qty_returned)
      const tolaundry = send_to_laundry ? qty_returned : 0
      
      const new_stock_available = product.stock_available + directToAvailable
      const new_stock_damaged = product.stock_damaged + qty_damaged
      const new_stock_total = product.stock_total - qty_lost
      const new_stock_in_laundry = (product.stock_in_laundry || 0) + tolaundry
      const new_stock_booked = Math.max(0, (product.stock_booked || 0) - qty_delivered)
      
      return {
        product_id: product.id,
        product_name: product.name,
        product_code: product.product_code,
        category: product.category,
        current_stock: {
          total: product.stock_total,
          available: product.stock_available,
          damaged: product.stock_damaged,
          booked: product.stock_booked,
          in_laundry: product.stock_in_laundry || 0
        },
        new_stock: {
          total: new_stock_total,
          available: new_stock_available,
          damaged: new_stock_damaged,
          booked: new_stock_booked,
          in_laundry: new_stock_in_laundry
        },
        changes: {
          total: new_stock_total - product.stock_total,
          available: new_stock_available - product.stock_available,
          damaged: new_stock_damaged - product.stock_damaged,
          booked: new_stock_booked - (product.stock_booked || 0),
          in_laundry: new_stock_in_laundry - (product.stock_in_laundry || 0)
        },
        quantities: {
          delivered: qty_delivered,
          returned: qty_returned,
          not_used: qty_not_used,
          damaged: qty_damaged,
          lost: qty_lost,
          send_to_laundry
        },
        warnings: [
          ...(new_stock_total < 0 ? ["Total stock would go negative"] : []),
          ...(new_stock_available < 0 ? ["Available stock would go negative"] : []),
          ...(qty_lost > 0 ? [`${qty_lost} items will be permanently removed`] : []),
          ...(qty_damaged > 0 ? [`${qty_damaged} items will be archived as damaged`] : []),
          ...(send_to_laundry && qty_returned > 0 ? [`${qty_returned} used items will be sent to laundry`] : []),
          ...(qty_not_used > 0 ? [`${qty_not_used} unused items will go directly to available`] : [])
        ]
      }
    })
    
    return NextResponse.json({
      success: true,
      preview,
      return_id: returnId,
      return_number: returnRecord.return_number
    })
    
  } catch (error: any) {
    console.error("Error in GET /api/returns/[id]/preview:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}
