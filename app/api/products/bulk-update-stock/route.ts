import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateRequest } from '@/lib/auth-middleware'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * POST /api/products/bulk-update-stock
 * Bulk update stock quantities for all products
 * Body: {
 *   stock_quantity: number (default: 600)
 *   franchise_id?: string (optional - if not provided, updates all franchises)
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // Check for admin authentication - either via session or API key
    const authHeader = req.headers.get('authorization')
    const hasValidKey = authHeader === `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
    
    if (!hasValidKey) {
      // Fall back to session-based auth
      const auth = await authenticateRequest(req, { minRole: 'super_admin' })
      if (!auth.authorized) {
        return NextResponse.json(auth.error, { status: auth.statusCode || 401 })
      }
    }

    const body = await req.json()
    const { stock_quantity = 600, franchise_id } = body

    if (!Number.isFinite(stock_quantity) || stock_quantity < 0) {
      return NextResponse.json(
        { error: "Invalid stock_quantity. Must be a non-negative number." },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Build the update query
    let query = supabase
      .from("products")
      .update({
        stock_available: stock_quantity,
        stock_total: stock_quantity,
        updated_at: new Date().toISOString()
      })

    // Always add a WHERE clause - either for specific franchise or all active products
    if (franchise_id) {
      query = query.eq("franchise_id", franchise_id)
    } else {
      // Update all active products when no franchise is specified
      query = query.eq("is_active", true)
    }

    // Execute the update
    const { data, error, count } = await query.select("id", { count: "exact" })

    if (error) {
      console.error("Failed to bulk update stock:", error)
      return NextResponse.json(
        { error: error.message || "Failed to update stock quantities" },
        { status: 500 }
      )
    }

    console.log(`✅ Bulk updated stock to ${stock_quantity} for ${count} products`)

    return NextResponse.json({
      success: true,
      message: `Successfully updated stock quantity to ${stock_quantity} for ${count} products`,
      updated_count: count,
      stock_quantity
    })

  } catch (error) {
    console.error("Error in bulk stock update:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/products/bulk-update-stock
 * Get current stock statistics
 */
export async function GET(req: NextRequest) {
  try {
    // Check for admin authentication - either via session or API key
    const authHeader = req.headers.get('authorization')
    const hasValidKey = authHeader === `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
    
    if (!hasValidKey) {
      // Fall back to session-based auth
      const auth = await authenticateRequest(req, { minRole: 'super_admin' })
      if (!auth.authorized) {
        return NextResponse.json(auth.error, { status: auth.statusCode || 401 })
      }
    }

    const supabase = createClient()

    // Get stock statistics
    const { data: stats, error } = await supabase
      .from("products")
      .select("stock_available, franchise_id")
      .eq("is_active", true)

    if (error) {
      return NextResponse.json(
        { error: error.message || "Failed to fetch stock statistics" },
        { status: 500 }
      )
    }

    const totalProducts = stats.length
    const totalStock = stats.reduce((sum, product) => sum + (product.stock_available || 0), 0)
    const averageStock = totalProducts > 0 ? Math.round(totalStock / totalProducts) : 0
    const minStock = Math.min(...stats.map(p => p.stock_available || 0))
    const maxStock = Math.max(...stats.map(p => p.stock_available || 0))

    // Group by franchise
    const franchiseStats = stats.reduce((acc, product) => {
      const franchiseId = product.franchise_id || 'unknown'
      if (!acc[franchiseId]) {
        acc[franchiseId] = { count: 0, totalStock: 0 }
      }
      acc[franchiseId].count++
      acc[franchiseId].totalStock += product.stock_available || 0
      return acc
    }, {} as Record<string, { count: number; totalStock: number }>)

    return NextResponse.json({
      total_products: totalProducts,
      total_stock: totalStock,
      average_stock: averageStock,
      min_stock: minStock,
      max_stock: maxStock,
      franchise_breakdown: franchiseStats
    })

  } catch (error) {
    console.error("Error fetching stock statistics:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}