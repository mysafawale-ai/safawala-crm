import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = 'force-dynamic'
export const maxDuration = 30
export const revalidate = 0

/**
 * GET /api/bookings-items?id=UUID&source=product_order|package_booking
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const sourceParam = searchParams.get('source') || 'product_order'
    
    if (!id) {
      return NextResponse.json({ error: 'id parameter required' }, { status: 400 })
    }
    
    console.log(`[Items API] START GET /api/bookings-items?id=${id}&source=${sourceParam}`)
    
    // Normalize source to handle both singular and plural forms
    const source = sourceParam.replace(/s$/, '') // Remove trailing 's' if present
    console.log(`[Items API] Normalized source: ${sourceParam} -> ${source}`)
    
    const supabase = createClient()
    
    let items: any[] = []
    
    if (source === 'product_order') {
      console.log(`[Items API] Product Order Items: Checking rows for order_id=${id}`)
      // Lightweight count to aid diagnostics (subject to RLS)
      try {
        const { count: poiCount } = await supabase
          .from('product_order_items')
          .select('id', { count: 'exact', head: true })
          .eq('order_id', id)
        console.log(`[Items API] product_order_items count (RLS-scoped): ${poiCount ?? 'unknown'}`)
      } catch (e: any) {
        console.warn('[Items API] Unable to count product_order_items (likely RLS/head not supported):', e?.message)
      }
      // First try a joined select to get product details inline (handles most cases)
      let { data: joined, error: joinError } = await supabase
        .from('product_order_items')
        .select(`
          id, order_id, product_id, quantity, unit_price, total_price, security_deposit, created_at,
          product:products(id, name, barcode, product_code, category, image_url, price, rental_price, stock_available, category_id)
        `)
        .eq('order_id', id)
        .order('created_at', { ascending: true })

      if (!joinError && joined) {
        console.log(`[Items API] Joined fetch returned ${joined.length} item(s) for order ${id}`)
        items = joined
      } else {
        console.warn('[Items API] Join failed or not supported, falling back to two-step fetch:', joinError?.message)
        // Fallback: fetch items then hydrate with product info
        const { data, error } = await supabase
          .from('product_order_items')
          .select('*')
          .eq('order_id', id)
          .order('created_at', { ascending: true })
        
        if (error) {
          console.error('[Booking Items API] Error fetching product order items:', error)
          return NextResponse.json({ error: error.message }, { status: 500 })
        }
        
        if (data && data.length > 0) {
          console.log(`[Items API] Fallback base items: ${data.length}`)
          const productIds = [...new Set(data.map((item: any) => item.product_id).filter(Boolean))]
          console.log(`[Items API] Unique product IDs to hydrate: ${productIds.length}`)
          if (productIds.length > 0) {
            const { data: products } = await supabase
              .from('products')
              .select('id, name, barcode, product_code, category, image_url, price, rental_price, stock_available, category_id')
              .in('id', productIds)
            console.log(`[Items API] Products fetched for hydration: ${products?.length ?? 0}`)
            const productsMap = new Map(products?.map((p: any) => [p.id, p]) || [])
            items = data.map((item: any) => ({
              ...item,
              product: productsMap.get(item.product_id) || null
            }))
          } else {
            items = data
          }
        } else {
          console.log('[Items API] Fallback base items: 0')
        }
      }
    } else if (source === 'package_booking') {
      // Try new table first
      let { data: newTableData, error: newTableError } = await supabase
        .from('package_booking_product_items')
        .select('*')
        .eq('package_booking_id', id)
        .order('created_at', { ascending: true })
      
      if (newTableError) {
        console.warn('[Items API] New table error, trying old table:', newTableError.message)
        
        // Fall back to old table
        const { data: oldTableData, error: oldTableError } = await supabase
          .from('package_booking_items')
          .select('*')
          .eq('package_booking_id', id)
          .order('created_at', { ascending: true })
        
        if (oldTableError) {
          console.error('[Items API] Both table queries failed:', oldTableError)
          return NextResponse.json({ error: oldTableError.message }, { status: 500 })
        }
        
        newTableData = oldTableData
      }
      
      // Fetch product details
      if (newTableData && newTableData.length > 0) {
        const productIds = [...new Set(newTableData.map((item: any) => item.product_id).filter(Boolean))]
        
        if (productIds.length > 0) {
          const { data: products } = await supabase
            .from('products')
            .select('id, name, barcode, product_code, category, image_url, price, rental_price, stock_available, category_id')
            .in('id', productIds)
          
          const productsMap = new Map(products?.map((p: any) => [p.id, p]) || [])
          items = newTableData.map((item: any) => ({
            ...item,
            product: productsMap.get(item.product_id) || null
          }))
        } else {
          items = newTableData
        }
      }
    }
    
    const duration = Date.now() - startTime
    console.log(`[Items API] SUCCESS: Returned ${items.length} items in ${duration}ms`)
    
    return NextResponse.json({ items })
  } catch (error) {
    console.error('[Items API] Exception:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
