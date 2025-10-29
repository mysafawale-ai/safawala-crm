import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * POST /api/inventory/reserve
 * Adjust product inventory when items are selected in a booking
 * 
 * Operations:
 * - "reserve": Decrease qty_available, increase qty_reserved (when items selected)
 * - "release": Increase qty_available, decrease qty_reserved (when items removed/unconfirmed)
 * - "confirm": Decrease qty_reserved, increase qty_in_use (when booking delivered)
 * 
 * Body: {
 *   operation: 'reserve' | 'release' | 'confirm',
 *   items: Array<{ product_id: string, quantity: number }>,
 *   bookingId: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { operation, items, bookingId } = body

    if (!operation || !Array.isArray(items) || !bookingId) {
      return NextResponse.json(
        { error: 'Missing required fields: operation, items, bookingId' },
        { status: 400 }
      )
    }

    if (!['reserve', 'release', 'confirm', 'return'].includes(operation)) {
      return NextResponse.json(
        { error: 'Invalid operation. Must be: reserve, release, confirm, or return' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Get product IDs
    const productIds = items.map((item: any) => item.product_id).filter(Boolean)

    if (productIds.length === 0) {
      return NextResponse.json(
        { error: 'No valid product IDs provided' },
        { status: 400 }
      )
    }

    // Fetch current inventory for all products
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, stock_available, qty_reserved, qty_in_use')
      .in('id', productIds)

    if (fetchError) {
      console.error('[Inventory API] Error fetching products:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!products || products.length === 0) {
      return NextResponse.json(
        { error: 'Products not found' },
        { status: 404 }
      )
    }

    const productsMap = new Map(products.map(p => [p.id, p]))
    const updates: any[] = []

    // Build updates based on operation
    for (const item of items) {
      const product = productsMap.get(item.product_id)
      if (!product) continue

      const qty = item.quantity || 0
      let update: any = { id: item.product_id }

      switch (operation) {
        case 'reserve':
          // Decrease available, increase reserved
          const availableAfterReserve = (product.stock_available || 0) - qty
          if (availableAfterReserve < 0) {
            return NextResponse.json(
              { error: `Insufficient stock for product ${item.product_id}. Available: ${product.stock_available}, Requested: ${qty}` },
              { status: 400 }
            )
          }
          update.stock_available = availableAfterReserve
          update.qty_reserved = (product.qty_reserved || 0) + qty
          break

        case 'release':
          // Increase available, decrease reserved
          update.stock_available = (product.stock_available || 0) + qty
          update.qty_reserved = Math.max(0, (product.qty_reserved || 0) - qty)
          break

        case 'confirm':
          // Decrease reserved, increase in use
          if ((product.qty_reserved || 0) < qty) {
            return NextResponse.json(
              { error: `Cannot confirm: reserved quantity is less than requested` },
              { status: 400 }
            )
          }
          update.qty_reserved = (product.qty_reserved || 0) - qty
          update.qty_in_use = (product.qty_in_use || 0) + qty
          break

        case 'return':
          // Decrease in use, increase available
          if ((product.qty_in_use || 0) < qty) {
            return NextResponse.json(
              { error: `Cannot return: in-use quantity is less than requested` },
              { status: 400 }
            )
          }
          update.qty_in_use = (product.qty_in_use || 0) - qty
          update.stock_available = (product.stock_available || 0) + qty
          break
      }

      updates.push(update)
    }

    // Apply all updates
    if (updates.length > 0) {
      const { error: updateError } = await supabase
        .from('products')
        .upsert(updates, { onConflict: 'id' })

      if (updateError) {
        console.error('[Inventory API] Error updating inventory:', updateError)
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
    }

    // Log the operation
    console.log(`[Inventory] ${operation.toUpperCase()} for booking ${bookingId}:`, {
      items: items.map(i => ({ product_id: i.product_id, qty: i.quantity })),
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      operation,
      message: `${operation} operation completed for ${items.length} item(s)`,
      itemsUpdated: updates.length
    })
  } catch (error) {
    console.error('[Inventory API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to update inventory' },
      { status: 500 }
    )
  }
}
