import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth-middleware"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, 'readonly')
    if (!authResult.success) {
      return NextResponse.json(authResult.response, { status: 401 })
    }
    const { authContext } = authResult
    const franchiseId = authContext!.user.franchise_id
    const isSuperAdmin = authContext!.user.role === 'super_admin'
    const supabase = createClient()

    console.log(`[Dashboard Stats API] Fetching stats for franchise: ${franchiseId}, isSuperAdmin: ${isSuperAdmin}`)

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    // Optimized: Build a single aggregated query instead of fetching all records
    let bookingsQuery = supabase
      .from("bookings")
      .select("id, status, total_amount, created_at, type", { count: 'exact' })
      .order('created_at', { ascending: false })

    // Apply franchise filter
    if (!isSuperAdmin && franchiseId) {
      bookingsQuery = bookingsQuery.eq("franchise_id", franchiseId)
      console.log(`[Dashboard Stats API] Applied franchise filter: ${franchiseId}`)
    } else {
      console.log(`[Dashboard Stats API] Super admin mode - showing all stats`)
    }

    // Fetch bookings with count
    const { data: bookingsData, error: bookingsError, count: totalBookings } = await bookingsQuery

    if (bookingsError) {
      console.error("Error fetching bookings:", bookingsError)
      return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 })
    }

    // Ensure bookingsData is an array
    const bookings = Array.isArray(bookingsData) ? bookingsData : []
    console.log(`[Dashboard Stats API] Fetched ${bookings.length} bookings from database`)

    // Parallel queries for other data
    const [customersResult, productsResult] = await Promise.all([
      isSuperAdmin || !franchiseId
        ? supabase.from("customers").select("id", { count: 'exact', head: true })
        : supabase.from("customers").select("id", { count: 'exact', head: true }).eq("franchise_id", franchiseId),
      isSuperAdmin || !franchiseId
        ? supabase.from("products").select("id, stock_available, reorder_level")
        : supabase.from("products").select("id, stock_available, reorder_level").eq("franchise_id", franchiseId)
    ])

    const totalCustomers = customersResult.count || 0
    const productsData = productsResult.data || []
    const activeBookings = bookings.filter((b: any) => 
      ['confirmed', 'delivered'].includes(b.status)
    ).length

    const totalRevenue = bookings.reduce((sum: number, booking: any) => 
      sum + (booking.total_amount || 0), 0
    )

    const thisMonthBookings = bookings.filter((b: any) => 
      new Date(b.created_at) >= startOfMonth
    ).length

    const lastMonthBookings = bookings.filter((b: any) => {
      const date = new Date(b.created_at)
      return date >= startOfLastMonth && date <= endOfLastMonth
    }).length

    const monthlyGrowth = lastMonthBookings > 0 
      ? ((thisMonthBookings - lastMonthBookings) / lastMonthBookings) * 100 
      : 0

    const lowStockItems = productsData.filter((p: any) => 
      (p.stock_available || 0) <= (p.reorder_level || 5)
    ).length

    // Calculate additional metrics
    const confirmedBookings = bookings.filter((b: any) => b.status === 'confirmed').length
    const quotesCount = bookings.filter((b: any) => b.status === 'quote').length
    const conversionRate = quotesCount > 0 ? ((confirmedBookings / (confirmedBookings + quotesCount)) * 100) : 0
    
    const bookingsCount = totalBookings || 0
    const avgBookingValue = bookingsCount > 0 ? totalRevenue / bookingsCount : 0

    // Revenue by month (last 6 months)
    const revenueByMonth = []
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      const monthRevenue = bookings
        .filter((b: any) => {
          const date = new Date(b.created_at)
          return date >= monthDate && date <= monthEnd
        })
        .reduce((sum: number, b: any) => sum + (b.total_amount || 0), 0)
      
      revenueByMonth.push({
        month: monthDate.toLocaleDateString('en-US', { month: 'short' }),
        revenue: monthRevenue
      })
    }

    // Bookings by type
    const packageBookings = bookings.filter((b: any) => b.type === 'package').length
    const productBookings = bookings.filter((b: any) => b.type !== 'package').length

    // Pending actions
    const pendingPayments = bookings.filter((b: any) => b.status === 'pending_payment').length
    const pendingDeliveries = bookings.filter((b: any) => b.status === 'confirmed').length
    const pendingReturns = bookings.filter((b: any) => b.status === 'delivered').length
    const overdueTasks = 0 // Can be enhanced with actual due date logic

    const stats = {
      totalBookings: bookingsCount,
      activeBookings,
      totalCustomers,
      totalRevenue,
      monthlyGrowth: Math.round(monthlyGrowth),
      lowStockItems,
      conversionRate: Math.round(conversionRate),
      avgBookingValue: Math.round(avgBookingValue),
      revenueByMonth,
      bookingsByType: {
        package: packageBookings,
        product: productBookings
      },
      pendingActions: {
        payments: pendingPayments,
        deliveries: pendingDeliveries,
        returns: pendingReturns,
        overdue: overdueTasks
      }
    }

    console.log(`[Dashboard Stats API] Returning stats:`, stats)
    return NextResponse.json(
      { success: true, data: stats },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30'
        }
      }
    )
  } catch (error) {
    console.error("[Dashboard Stats API] Error:", error)
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
