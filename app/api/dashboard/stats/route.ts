import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth-middleware"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, 'viewer')
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

    // Calculate additional metrics
    const confirmedBookings = bookingsData.filter((b: any) => b.status === 'confirmed').length
    const quotesCount = bookingsData.filter((b: any) => b.status === 'quote').length
    const conversionRate = quotesCount > 0 ? ((confirmedBookings / (confirmedBookings + quotesCount)) * 100) : 0
    
    const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0

    // Revenue by month (last 6 months)
    const revenueByMonth = []
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      const monthRevenue = bookingsData
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
    const packageBookings = bookingsData.filter((b: any) => b.type === 'package').length
    const productBookings = bookingsData.filter((b: any) => b.type !== 'package').length

    // Pending actions
    const pendingPayments = bookingsData.filter((b: any) => b.status === 'pending_payment').length
    const pendingDeliveries = bookingsData.filter((b: any) => b.status === 'confirmed').length
    const pendingReturns = bookingsData.filter((b: any) => b.status === 'delivered').length
    const overdueTasks = 0 // Can be enhanced with actual due date logic

    const stats = {
      totalBookings,
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
    return NextResponse.json({ success: true, data: stats })
  } catch (error) {
    console.error("[Dashboard Stats API] Error:", error)
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
