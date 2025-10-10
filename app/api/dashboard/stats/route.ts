import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Get user session from cookie
 */
async function getUserFromSession(request: NextRequest) {
  try {
    const cookieHeader = request.cookies.get("safawala_session")
    if (!cookieHeader?.value) {
      throw new Error("No session found")
    }
    
    const sessionData = JSON.parse(cookieHeader.value)
    if (!sessionData.id) {
      throw new Error("Invalid session")
    }

    const supabase = createClient()
    const { data: user, error } = await supabase
      .from("users")
      .select("id, franchise_id, role")
      .eq("id", sessionData.id)
      .eq("is_active", true)
      .single()

    if (error || !user) {
      throw new Error("User not found")
    }

    return {
      userId: user.id,
      franchiseId: user.franchise_id,
      role: user.role,
      isSuperAdmin: user.role === "super_admin"
    }
  } catch (error) {
    throw new Error("Authentication required")
  }
}

export async function GET(request: NextRequest) {
  try {
    const { franchiseId, isSuperAdmin } = await getUserFromSession(request)
    const supabase = createClient()

    console.log(`[Dashboard Stats API] Fetching stats for franchise: ${franchiseId}, isSuperAdmin: ${isSuperAdmin}`)

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    // Build queries with franchise filter
    let bookingsQuery = supabase.from("bookings").select("*")
    let customersQuery = supabase.from("customers").select("*")
    let productsQuery = supabase.from("products").select("*")

    // CRITICAL: Filter by franchise_id unless super admin
    if (!isSuperAdmin && franchiseId) {
      bookingsQuery = bookingsQuery.eq("franchise_id", franchiseId)
      customersQuery = customersQuery.eq("franchise_id", franchiseId)
      productsQuery = productsQuery.eq("franchise_id", franchiseId)
      console.log(`[Dashboard Stats API] Applied franchise filter: ${franchiseId}`)
    } else {
      console.log(`[Dashboard Stats API] Super admin mode - showing all stats`)
    }

    const [bookingsResult, customersResult, productsResult] = await Promise.all([
      bookingsQuery,
      customersQuery,
      productsQuery
    ])

    const bookingsData = bookingsResult.data || []
    const customersData = customersResult.data || []
    const productsData = productsResult.data || []

    if (bookingsResult.error) {
      console.error("Error fetching bookings:", bookingsResult.error)
    }
    if (customersResult.error) {
      console.error("Error fetching customers:", customersResult.error)
    }
    if (productsResult.error) {
      console.error("Error fetching products:", productsResult.error)
    }

    const totalBookings = bookingsData.length
    const activeBookings = bookingsData.filter((b: any) => 
      ['confirmed', 'delivered'].includes(b.status)
    ).length

    const totalCustomers = customersData.length

    const totalRevenue = bookingsData.reduce((sum: number, booking: any) => 
      sum + (booking.total_amount || 0), 0
    )

    const thisMonthBookings = bookingsData.filter((b: any) => 
      new Date(b.created_at) >= startOfMonth
    ).length

    const lastMonthBookings = bookingsData.filter((b: any) => {
      const date = new Date(b.created_at)
      return date >= startOfLastMonth && date <= endOfLastMonth
    }).length

    const monthlyGrowth = lastMonthBookings > 0 
      ? ((thisMonthBookings - lastMonthBookings) / lastMonthBookings) * 100 
      : 0

    const lowStockItems = productsData.filter((p: any) => 
      (p.stock_available || 0) <= (p.reorder_level || 5)
    ).length

    const stats = {
      totalBookings,
      activeBookings,
      totalCustomers,
      totalRevenue,
      monthlyGrowth: Math.round(monthlyGrowth),
      lowStockItems
    }

    console.log(`[Dashboard Stats API] Returning stats:`, stats)
    return NextResponse.json({ success: true, data: stats })
  } catch (error) {
    console.error("[Dashboard Stats API] Error:", error)
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
