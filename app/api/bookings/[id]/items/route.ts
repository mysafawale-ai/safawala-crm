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
      // Fetch package booking items WITHOUT joins (FK doesn't exist yet)
      const { data, error } = await supabase
        .from('package_booking_items')
        .select('*')
        .eq('booking_id', id)
        .order('created_at', { ascending: true })
      
      if (error) {
        console.error('[Booking Items API] Error fetching package booking items:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      
      // Fetch related data separately
      if (data && data.length > 0) {
        const packageIds = [...new Set(data.map((item: any) => item.package_id).filter(Boolean))]
        const variantIds = [...new Set(data.map((item: any) => item.variant_id).filter(Boolean))]
        
        // Fetch package_sets
        const packagesMap = new Map()
        if (packageIds.length > 0) {
          const { data: packages } = await supabase
            .from('package_sets')
            .select('id, name')
            .in('id', packageIds)
          
          packages?.forEach((p: any) => packagesMap.set(p.id, p))
        }
        
        // Fetch package_variants
        const variantsMap = new Map()
        if (variantIds.length > 0) {
          const { data: variants } = await supabase
            .from('package_variants')
            .select('id, name, size, quantity_safas')
            .in('id', variantIds)
          
          variants?.forEach((v: any) => variantsMap.set(v.id, v))
        }
        
        // Map the data with product-like structure for consistent display
        items = data.map((item: any) => {
          const packageSet = packagesMap.get(item.package_id)
          const variant = variantsMap.get(item.variant_id)
          
          return {
            ...item,
            quantity: (item.quantity || 0) + (item.extra_safas || 0),
            product: packageSet ? {
              id: packageSet.id,
              name: packageSet.name,
              product_code: null,
              category: 'Package',
              image_url: null
            } : null,
            variant_name: variant?.name || null
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

      // Insert new items
      if (items.length > 0) {
        const itemsToInsert = items.map((item: any) => ({
          order_id: id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price || 0,
          total_price: item.total_price || 0,
          variant_id: item.variant_id || null,
          variant_name: item.variant_name || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
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
      // Delete existing items for this booking
      const { error: deleteError } = await supabase
        .from('package_booking_items')
        .delete()
        .eq('booking_id', id)

      if (deleteError) {
        console.error('[Booking Items API] Error deleting old package booking items:', deleteError)
        return NextResponse.json({ error: deleteError.message }, { status: 500 })
      }

      // Insert new items
      if (items.length > 0) {
        const itemsToInsert = items.map((item: any) => ({
          booking_id: id,
          package_id: item.package_id,
          variant_id: item.variant_id,
          quantity: item.quantity || 0,
          extra_safas: item.extra_safas || 0,
          unit_price: item.unit_price || 0,
          total_price: item.total_price || 0,
          distance_addon: item.distance_addon || 0,
          security_deposit: item.security_deposit || 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }))

        const { error: insertError } = await supabase
          .from('package_booking_items')
          .insert(itemsToInsert)

        if (insertError) {
          console.error('[Booking Items API] Error inserting package booking items:', insertError)
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
