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
    const source = searchParams.get('source') || 'product_order'
    
    const supabase = createClient()
    
    let items: any[] = []
    
    if (source === 'product_order') {
      // Fetch product order items
      const { data, error } = await supabase
        .from('product_order_items')
        .select(`
          id,
          order_id,
          product_id,
          variant_id,
          quantity,
          unit_price,
          total_price,
          variant_name,
          product:products(
            id,
            name,
            code,
            category,
            image_url
          )
        `)
        .eq('order_id', id)
        .order('created_at', { ascending: true })
      
      if (error) {
        console.error('[Booking Items API] Error fetching product order items:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      
      items = data || []
    } else if (source === 'package_booking') {
      // Fetch package booking items
      const { data, error } = await supabase
        .from('package_booking_items')
        .select(`
          id,
          booking_id,
          variant_id,
          quantity,
          extra_safas,
          unit_price,
          total_price,
          variant_name,
          product:products!package_booking_items_product_id_fkey(
            id,
            name,
            code,
            category,
            image_url
          )
        `)
        .eq('booking_id', id)
        .order('created_at', { ascending: true })
      
      if (error) {
        console.error('[Booking Items API] Error fetching package booking items:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      
      // Add extra_safas to quantity for package items
      items = (data || []).map((item: any) => ({
        ...item,
        quantity: (item.quantity || 0) + (item.extra_safas || 0)
      }))
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
