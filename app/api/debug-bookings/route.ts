import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server-simple"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    console.log('[DEBUG] Starting debug bookings check...')

    // Check product_orders count
    const { count: productCount, data: products, error: productError } = await supabaseServer
      .from("product_orders")
      .select("id, order_number, booking_type", { count: 'exact' })
      .limit(5)

    console.log(`[DEBUG] Product orders - Count: ${productCount}, Error: ${productError?.message || 'none'}`)
    console.log(`[DEBUG] Sample products:`, products)

    // Check package_bookings count
    const { count: packageCount, data: packages, error: packageError } = await supabaseServer
      .from("package_bookings")
      .select("id, package_number", { count: 'exact' })
      .limit(5)

    console.log(`[DEBUG] Package bookings - Count: ${packageCount}, Error: ${packageError?.message || 'none'}`)
    console.log(`[DEBUG] Sample packages:`, packages)

    // Check direct_sales_orders count
    const { count: directCount, data: directs, error: directError } = await supabaseServer
      .from("direct_sales_orders")
      .select("id, sale_number", { count: 'exact' })
      .limit(5)

    console.log(`[DEBUG] Direct sales - Count: ${directCount}, Error: ${directError?.message || 'none'}`)
    console.log(`[DEBUG] Sample direct sales:`, directs)

    // Check product_orders schema
    const { data: schema, error: schemaError } = await supabaseServer
      .from("information_schema.columns")
      .select("column_name, data_type")
      .eq("table_name", "product_orders")
      .limit(20)

    console.log(`[DEBUG] Product orders schema (first 20 columns):`, schema)
    if (schemaError) console.log(`[DEBUG] Schema error:`, schemaError)

    return NextResponse.json({
      product_orders: {
        count: productCount,
        error: productError?.message,
        sample: products
      },
      package_bookings: {
        count: packageCount,
        error: packageError?.message,
        sample: packages
      },
      direct_sales: {
        count: directCount,
        error: directError?.message,
        sample: directs
      },
      schema: schema
    })
  } catch (error) {
    console.error('[DEBUG] Error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
