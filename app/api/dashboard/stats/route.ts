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

    // Fetch from BOTH package_bookings and product_orders (the actual booking sources)
    let packageQuery = supabase
      .from("package_bookings")
      .select("id, status, total_amount, amount_paid, created_at, event_date, delivery_date, package_number", { count: 'exact' })
      .eq('is_quote', false)
      .eq('is_archived', false)
      .order('created_at', { ascending: false })

    let productQuery = supabase
      .from("product_orders")
      .select("id, status, total_amount, amount_paid, created_at, event_date, delivery_date, order_number, booking_type", { count: 'exact' })
      .or('is_quote.is.null,is_quote.eq.false')
      .eq('is_archived', false)
      .order('created_at', { ascending: false })

    // Apply franchise filter
    if (!isSuperAdmin && franchiseId) {
      packageQuery = packageQuery.eq("franchise_id", franchiseId)
      productQuery = productQuery.eq("franchise_id", franchiseId)
      console.log(`[Dashboard Stats API] Applied franchise filter: ${franchiseId}`)
    } else {
      console.log(`[Dashboard Stats API] Super admin mode - showing all stats`)
    }

    // Fetch both in parallel
    const [packageRes, productRes] = await Promise.all([packageQuery, productQuery])

    if (packageRes.error && productRes.error) {
      console.error("Error fetching bookings:", packageRes.error || productRes.error)
      return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 })
    }

    // Combine data from both sources
    const packageBookings = Array.isArray(packageRes.data) ? packageRes.data : []
    const productBookings = Array.isArray(productRes.data) ? productRes.data : []
    const bookings = [...packageBookings, ...productBookings]
    
    console.log(`[Dashboard Stats API] Fetched ${packageBookings.length} package bookings + ${productBookings.length} product orders = ${bookings.length} total`)

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
    
    const bookingsCount = bookings.length || 0
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

    // Bookings by type/source
    const bookingsByType = {
      package: packageBookings.length,
      product: productBookings.length
    }

    // Pending actions
    const pendingPayments = bookings.filter((b: any) => b.status === 'pending_payment').length
    const pendingDeliveries = bookings.filter((b: any) => b.status === 'confirmed').length
    const pendingReturns = bookings.filter((b: any) => b.status === 'delivered').length
    const overdueTasks = 0 // Can be enhanced with actual due date logic

    // Calculate payment reminders (bookings with pending balance and upcoming events)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const bookingsWithPendingPayments = bookings
      .filter((b: any) => {
        const totalAmount = Number(b.total_amount) || 0
        const amountPaid = Number(b.amount_paid) || 0
        const pendingAmount = totalAmount - amountPaid
        return pendingAmount > 0 && b.event_date
      })
      .map((b: any) => {
        const eventDate = new Date(b.event_date)
        eventDate.setHours(0, 0, 0, 0)
        const daysUntilEvent = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        return {
          id: b.id,
          bookingNumber: b.package_number || b.order_number,
          eventDate: b.event_date,
          daysUntilEvent,
          totalAmount: Number(b.total_amount) || 0,
          amountPaid: Number(b.amount_paid) || 0,
          pendingAmount: (Number(b.total_amount) || 0) - (Number(b.amount_paid) || 0),
          status: b.status
        }
      })
      .filter((b: any) => b.daysUntilEvent >= 0 && b.daysUntilEvent <= 30) // Next 30 days
      .sort((a: any, b: any) => a.daysUntilEvent - b.daysUntilEvent)

    // Group payment reminders by urgency
    const paymentReminders = {
      urgent: bookingsWithPendingPayments.filter((b: any) => b.daysUntilEvent <= 1).length,   // 1 day or less
      soon: bookingsWithPendingPayments.filter((b: any) => b.daysUntilEvent > 1 && b.daysUntilEvent <= 3).length,   // 2-3 days
      upcoming: bookingsWithPendingPayments.filter((b: any) => b.daysUntilEvent > 3 && b.daysUntilEvent <= 7).length, // 4-7 days
      later: bookingsWithPendingPayments.filter((b: any) => b.daysUntilEvent > 7 && b.daysUntilEvent <= 10).length,  // 8-10 days
      total: bookingsWithPendingPayments.length,
      totalPendingAmount: bookingsWithPendingPayments.reduce((sum: number, b: any) => sum + b.pendingAmount, 0),
      list: bookingsWithPendingPayments.slice(0, 10) // Top 10 most urgent
    }

    // Upcoming deliveries (confirmed bookings with delivery dates)
    const upcomingDeliveries = bookings
      .filter((b: any) => b.status === 'confirmed' && b.delivery_date)
      .map((b: any) => {
        const deliveryDate = new Date(b.delivery_date)
        deliveryDate.setHours(0, 0, 0, 0)
        const daysUntilDelivery = Math.ceil((deliveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        return {
          id: b.id,
          bookingNumber: b.package_number || b.order_number,
          deliveryDate: b.delivery_date,
          daysUntilDelivery,
          status: b.status
        }
      })
      .filter((b: any) => b.daysUntilDelivery >= 0 && b.daysUntilDelivery <= 14) // Next 14 days
      .sort((a: any, b: any) => a.daysUntilDelivery - b.daysUntilDelivery)

    const deliveryReminders = {
      today: upcomingDeliveries.filter((b: any) => b.daysUntilDelivery === 0).length,
      tomorrow: upcomingDeliveries.filter((b: any) => b.daysUntilDelivery === 1).length,
      thisWeek: upcomingDeliveries.filter((b: any) => b.daysUntilDelivery > 1 && b.daysUntilDelivery <= 7).length,
      total: upcomingDeliveries.length,
      list: upcomingDeliveries.slice(0, 10) // Top 10 most urgent
    }

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
      bookingsByType: bookingsByType,
      pendingActions: {
        payments: pendingPayments,
        deliveries: pendingDeliveries,
        returns: pendingReturns,
        overdue: overdueTasks
      },
      paymentReminders,
      deliveryReminders
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
