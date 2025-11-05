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
            .select('id, name, product_code, category, image_url, price, rental_price, stock_available, category_id')
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
            .select('id, name, product_code, category, image_url, price, rental_price, stock_available, category_id')
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
