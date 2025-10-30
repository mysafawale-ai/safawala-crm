import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = 'force-dynamic'

/**
 * GET /api/bookings/[id]/items?source=product_order|package_booking
 * Fetch items for a specific booking
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { searchParams } = new URL(request.url)
    const sourceParam = searchParams.get('source') || 'product_order'
    
    // Normalize source to handle both singular and plural forms
    const source = sourceParam.replace(/s$/, '') // Remove trailing 's' if present
    
    const supabase = createClient()
    
    let items: any[] = []
    
    if (source === 'product_order') {
      // Fetch product order items WITHOUT joins (FK doesn't exist yet)
      const { data, error } = await supabase
        .from('product_order_items')
        .select('*')
        .eq('order_id', id)
        .order('created_at', { ascending: true })
      
      if (error) {
        console.error('[Booking Items API] Error fetching product order items:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      
      // Fetch product details separately if there are items
      if (data && data.length > 0) {
        const productIds = [...new Set(data.map((item: any) => item.product_id).filter(Boolean))]
        
        if (productIds.length > 0) {
          const { data: products } = await supabase
            .from('products')
            .select('id, name, product_code, category, image_url')
            .in('id', productIds)
          
          const productsMap = new Map(products?.map((p: any) => [p.id, p]) || [])
          
          items = data.map((item: any) => ({
            ...item,
            product: productsMap.get(item.product_id) || null
          }))
        } else {
          items = data
        }
      }
    } else if (source === 'package_booking') {
      // First try the new dedicated table
      let { data, error } = await supabase
        .from('package_booking_product_items')
        .select('*')
        .eq('package_booking_id', id)
        .order('created_at', { ascending: true })
      
      // If new table is empty or has an error, check the old table
      if (!data || data.length === 0) {
        console.log('[Booking Items API] No items in new table, checking old table...')
        const { data: oldData, error: oldError } = await supabase
          .from('package_booking_items')
          .select('*')
          .eq('package_booking_id', id)
          .order('created_at', { ascending: true })
        
        if (!oldError && oldData && oldData.length > 0) {
          console.log('[Booking Items API] Found items in old table:', oldData.length)
          data = oldData
        }
      }
      
      if (error && (!data || data.length === 0)) {
        console.error('[Booking Items API] Error fetching package booking items:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      
      // Fetch related product data
      if (data && data.length > 0) {
        console.log('[Booking Items API] Fetching product data for items:', data.length)
        const productIds = [...new Set(data.map((item: any) => item.product_id || item.package_id).filter(Boolean))]
        
        // Fetch products
        const productsMap = new Map()
        if (productIds.length > 0) {
          const { data: products } = await supabase
            .from('products')
            .select('id, name, product_code, category, image_url, price, rental_price, stock_available, category_id')
            .in('id', productIds)
          
          products?.forEach((p: any) => productsMap.set(p.id, p))
        }
        
        // Map the data with product structure for consistent display
        items = data.map((item: any) => {
          const product = productsMap.get(item.product_id || item.package_id)
          return {
            ...item,
            id: item.id,
            product_id: item.product_id,
            quantity: item.quantity || 1,
            unit_price: item.unit_price || 0,
            total_price: item.total_price || 0,
            product: product || null,
          }
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      items,
      count: items.length
    })
  } catch (error) {
    console.error('[Booking Items API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch booking items' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/bookings/[id]/items
 * Save items for a booking (product_order or package_booking)
 * Body: { items: SelectedItem[], source: 'product_order' | 'package_booking' }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { items, source } = body

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Items must be an array' },
        { status: 400 }
      )
    }

    if (!source || !['product_order', 'product_orders', 'package_booking', 'package_bookings'].includes(source)) {
      return NextResponse.json(
        { error: 'Source must be product_order or package_booking' },
        { status: 400 }
      )
    }

    const normalizedSource = source.replace(/s$/, '') // Normalize to singular

    const supabase = createClient()

    if (normalizedSource === 'product_order') {
      // Delete existing items for this order
      const { error: deleteError } = await supabase
        .from('product_order_items')
        .delete()
        .eq('order_id', id)

      if (deleteError) {
        console.error('[Booking Items API] Error deleting old product order items:', deleteError)
        return NextResponse.json({ error: deleteError.message }, { status: 500 })
      }

      // Update has_items flag based on whether we have new items
      const hasItemsFlag = items.length > 0
      const { error: updateFlagError } = await supabase
        .from('product_orders')
        .update({ has_items: hasItemsFlag })
        .eq('id', id)

      if (updateFlagError) {
        console.error('[Booking Items API] Error updating product_orders.has_items:', updateFlagError)
      }

      // Insert new items only if there are any
      if (items.length > 0) {
        const itemsToInsert = items.map((item: any) => ({
          order_id: id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price || 0,
          total_price: item.total_price || 0,
        }))

        const { error: insertError } = await supabase
          .from('product_order_items')
          .insert(itemsToInsert)

        if (insertError) {
          console.error('[Booking Items API] Error inserting product order items:', insertError)
          return NextResponse.json({ error: insertError.message }, { status: 500 })
        }
      }
    } else if (normalizedSource === 'package_booking') {
      // Delete existing product items for this booking from the new table
      const { error: deleteError } = await supabase
        .from('package_booking_product_items')
        .delete()
        .eq('package_booking_id', id)

      if (deleteError) {
        console.error('[Booking Items API] Error deleting old package booking product items:', deleteError)
        return NextResponse.json({ error: deleteError.message }, { status: 500 })
      }

      // Update has_items flag based on whether we have new items
      const hasItemsFlag = items.length > 0
      const { error: updateFlagError } = await supabase
        .from('package_bookings')
        .update({ has_items: hasItemsFlag })
        .eq('id', id)

      if (updateFlagError) {
        console.error('[Booking Items API] Error updating package_bookings.has_items:', updateFlagError)
      }

      // Insert new product items only if there are any
      if (items.length > 0) {
        const itemsToInsert = items.map((item: any) => ({
          package_booking_id: id,
          product_id: item.product_id,
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
          total_price: item.total_price || 0,
          notes: item.notes || null,
        }))

        const { error: insertError } = await supabase
          .from('package_booking_product_items')
          .insert(itemsToInsert)

        if (insertError) {
          console.error('[Booking Items API] Error inserting package booking product items:', insertError)
          return NextResponse.json({ error: insertError.message }, { status: 500 })
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Saved ${items.length} items for ${normalizedSource}`,
      count: items.length
    })
  } catch (error) {
    console.error('[Booking Items API] POST Error:', error)
    return NextResponse.json(
      { error: 'Failed to save booking items' },
      { status: 500 }
    )
  }
}
