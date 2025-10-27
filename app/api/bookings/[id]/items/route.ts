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
