"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { DashboardErrorBoundary } from "@/components/error-boundary"
import { getCurrentUser } from "@/lib/auth"
import { useData } from "@/hooks/use-data"
import type { User, Booking } from "@/lib/types"
import { BookingCalendar } from "@/components/bookings/booking-calendar"
import { 
  Calendar, Users, Package, DollarSign, Plus, Eye, Crown, RefreshCw, Search,
  TrendingUp, TrendingDown, AlertCircle, Clock, CheckCircle2, XCircle,
  ArrowUpRight, ArrowDownRight, Minus, ShoppingCart, Box, Truck, RotateCcw,
  MapPin, ClipboardList
} from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { DashboardSkeleton } from "@/components/ui/skeleton-loader"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface PaymentReminderItem {
  id: string
  bookingNumber: string
  eventDate: string
  daysUntilEvent: number
  totalAmount: number
  amountPaid: number
  pendingAmount: number
  status: string
}

interface DeliveryReminderItem {
  id: string
  bookingNumber: string
  deliveryDate: string
  daysUntilDelivery: number
  status: string
}

interface DashboardStats {
  totalBookings: number
  activeBookings: number
  totalCustomers: number
  totalRevenue: number
  monthlyGrowth: number
  lowStockItems: number
  conversionRate: number
  avgBookingValue: number
  revenueByMonth: Array<{ month: string; revenue: number }>
  bookingsByType: {
    package: number
    product: number
  }
  pendingActions: {
    payments: number
    deliveries: number
    returns: number
    overdue: number
  }
  paymentReminders?: {
    urgent: number
    soon: number
    upcoming: number
    later: number
    total: number
    totalPendingAmount: number
    list: PaymentReminderItem[]
  }
  deliveryReminders?: {
    today: number
    tomorrow: number
    thisWeek: number
    total: number
    list: DeliveryReminderItem[]
  }
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  const [workOrders, setWorkOrders] = useState<any[]>([])
  const [loadingWorkOrders, setLoadingWorkOrders] = useState(false)

  const fetchDashboardWorkOrders = async () => {
    try {
      setLoadingWorkOrders(true)
      const res = await fetch("/api/work-orders")
      if (res.ok) {
        const json = await res.json()
        setWorkOrders(json.data || [])
      }
    } catch (e) {
      console.error("Failed to fetch work orders for dashboard", e)
    } finally {
      setLoadingWorkOrders(false)
    }
  }

  // Fetch all dashboard data in parallel for better performance
  const { data: stats, loading: statsLoading, refresh: refreshStats, error: statsError } = useData<DashboardStats>("dashboard-stats")
  
  // Only fetch bookings data if user has bookings permission
  const shouldFetchBookings = user?.permissions?.bookings ?? false
  const {
    data: recentBookings,
    loading: bookingsLoading,
    refresh: refreshBookings,
  } = useData<Booking[]>(shouldFetchBookings ? "recent-bookings" : "skip")
  const {
    data: calendarBookings,
    loading: calendarLoading,
    refresh: refreshCalendar,
  } = useData<any[]>(shouldFetchBookings ? "calendar-bookings" : "skip")

  // Debug: Log stats when they change and force refresh on mount if no data
  useEffect(() => {
    if (stats) {
      console.log("[Dashboard] Stats received:", stats)
    }
    if (statsError) {
      console.error("[Dashboard] Stats error:", statsError)
    }
  }, [stats, statsError])

  // Force refresh stats on mount to ensure real data
  useEffect(() => {
    if (user) {
      console.log("[Dashboard] Component mounted, forcing stats refresh...")
      refreshStats()
      fetchDashboardWorkOrders()
    }
  }, [user, refreshStats])



  // Combined loading state for better UX
  const isLoading = statsLoading || (shouldFetchBookings && (bookingsLoading || calendarLoading))

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser()
        if (!currentUser) {
          // Redirect to login with current path as redirect target
          const currentPath = window.location.pathname
          router.push(`/?redirect=${currentPath}`)
          return
        }
        
        // Check if user has dashboard permission
        if (!currentUser.permissions?.dashboard) {
          // Find first available page based on permissions
          const availablePages = [
            { path: '/bookings', permission: currentUser.permissions?.bookings },
            { path: '/customers', permission: currentUser.permissions?.customers },
            { path: '/inventory', permission: currentUser.permissions?.inventory },
            { path: '/quotes', permission: currentUser.permissions?.quotes },
          ]
          
          const firstAvailable = availablePages.find(p => p.permission)
          if (firstAvailable) {
            router.push(firstAvailable.path)
          } else {
            // No permissions, log out
            router.push('/')
          }
          return
        }
        
        setUser(currentUser)
      } catch (error) {
        console.error('Dashboard auth check failed:', error)
        router.push('/')
      }
    }

    checkAuth()
  }, [router])

  const handleRefresh = useCallback(async () => {
    try {
      const refreshPromises = [refreshStats(), fetchDashboardWorkOrders()]
      
      // Only refresh bookings data if user has bookings permission
      if (user?.permissions?.bookings) {
        refreshPromises.push(refreshBookings(), refreshCalendar())
      }
      
      await Promise.all(refreshPromises)
      toast.success("Dashboard refreshed successfully")
    } catch (error) {
      // Silent fail - don't show error toast
    }
  }, [refreshStats, refreshBookings, refreshCalendar, user?.permissions?.bookings])

  // Auto-refresh dashboard data every 30 seconds
  useEffect(() => {
    if (!user) return
    const interval = setInterval(() => {
      console.log("[Dashboard] Auto-refreshing data (30s interval)...")
      handleRefresh()
    }, 30000)
    return () => clearInterval(interval)
  }, [user, handleRefresh])

  const navigateMonth = useCallback((direction: "prev" | "next") => {
    setCurrentDate((prevDate) => {
      const newDate = new Date(prevDate)
      if (direction === "prev") {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }, [])

  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) {
      router.push(`/bookings?search=${encodeURIComponent(searchQuery)}`)
    } else {
      router.push("/bookings")
    }
  }, [searchQuery, router])

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800"
      case "pending_payment":
        return "bg-yellow-100 text-yellow-800"
      case "delivered":
        return "bg-blue-100 text-blue-800"
      case "order_complete":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }, [])

  if (!user) return (
    <DashboardErrorBoundary>
      <DashboardLayout>
        <DashboardSkeleton />
      </DashboardLayout>
    </DashboardErrorBoundary>
  )

  return (
    <DashboardErrorBoundary>
      <DashboardLayout userRole={user?.role}>
        <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {user?.name || "User"}! Here's what's happening with your business.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>

            <div className="flex items-center gap-2">
              <Input
                placeholder="Search bookings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="w-48"
              />
              <Button variant="outline" size="sm" onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <DashboardSkeleton />
        ) : (
          <>
        {/* Primary Stats Cards */}
        {user?.role === 'super_admin' ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/quotes">
              <Card className="hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer bg-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">New Leads</CardTitle>
                  <Users className="h-4 w-4 text-indigo-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.ownerKPIs?.newLeads ?? 0}</div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Active leads pending selection</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/bookings">
              <Card className="hover:shadow-md hover:border-blue-200 transition-all cursor-pointer bg-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Confirmed Bookings</CardTitle>
                  <Calendar className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.ownerKPIs?.confirmedOrders ?? 0}</div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Orders scheduled for execution</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/work-orders">
              <Card className="hover:shadow-md hover:border-orange-200 transition-all cursor-pointer bg-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Orders in Packing</CardTitle>
                  <Package className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{stats?.ownerKPIs?.ordersInPacking ?? 0}</div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Orders in packing department</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/work-orders">
              <Card className="hover:shadow-md hover:border-cyan-200 transition-all cursor-pointer bg-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Orders in Dispatch</CardTitle>
                  <Truck className="h-4 w-4 text-cyan-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-cyan-600">{stats?.ownerKPIs?.ordersInDispatch ?? 0}</div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Active dispatches in transit</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/bookings">
              <Card className="hover:shadow-md hover:border-rose-200 transition-all cursor-pointer bg-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today's Events</CardTitle>
                  <MapPin className="h-4 w-4 text-rose-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-rose-600">{stats?.ownerKPIs?.eventsToday ?? 0}</div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Rentals/Events happening today</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/bookings?status=pending_payment">
              <Card className="hover:shadow-md hover:border-green-200 transition-all cursor-pointer bg-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">₹{(stats?.ownerKPIs?.pendingPayments ?? 0).toLocaleString()}</div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Total outstanding collections due</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/work-orders">
              <Card className="hover:shadow-md hover:border-slate-300 transition-all cursor-pointer bg-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Material Not Returned</CardTitle>
                  <RotateCcw className="h-4 w-4 text-slate-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-800">{stats?.ownerKPIs?.materialNotReturned ?? 0}</div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Pending collection from venues</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/work-orders">
              <Card className="hover:shadow-md hover:border-violet-300 transition-all cursor-pointer bg-slate-50/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Operations Board</CardTitle>
                  <ClipboardList className="h-4 w-4 text-violet-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-violet-600 font-bold">Launch Board</div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Open Work Orders board →</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{stats?.totalRevenue?.toLocaleString() || 0}</div>
                <div className="flex items-center mt-1">
                  {(stats?.monthlyGrowth || 0) >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                  )}
                  <p className={`text-xs ${(stats?.monthlyGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(stats?.monthlyGrowth || 0) >= 0 ? '+' : ''}{stats?.monthlyGrowth || 0}% from last month
                  </p>
                </div>
              </CardContent>
            </Card>

            {user?.permissions?.bookings && (
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                  <Calendar className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalBookings || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.activeBookings || 0} active • {stats?.conversionRate || 0}% conversion
                  </p>
                </CardContent>
              </Card>
            )}

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Booking Value</CardTitle>
                <ShoppingCart className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{stats?.avgBookingValue?.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground">{stats?.totalCustomers || 0} total customers</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Low Stock Alert</CardTitle>
                <Package className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats?.lowStockItems || 0}</div>
                <p className="text-xs text-muted-foreground">Items need restocking</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Work Orders Board - Displayed above Calendar */}
        {user?.permissions?.bookings && (
          <Card className="bg-white border-slate-100 shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-extrabold flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-indigo-600 animate-pulse" />
                  Active Operations & Work Orders
                </CardTitle>
                <CardDescription className="text-xs">
                  Packings, Dispatches, and Deliveries currently in progress
                </CardDescription>
              </div>
              <Link href="/work-orders">
                <Button size="sm" variant="ghost" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 p-0 h-auto">
                  View Board →
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {loadingWorkOrders ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent" />
                </div>
              ) : workOrders && workOrders.filter(wo => wo && wo.status !== 'completed' && wo.status !== 'cancelled').length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-h-[600px] overflow-y-auto pr-1">
                  {workOrders
                    .filter(wo => wo && wo.status !== 'completed' && wo.status !== 'cancelled')
                    .map((wo) => {
                      const totalTasks = wo.work_order_tasks?.length || 0
                      const completedTasks = wo.work_order_tasks?.filter((t: any) => t && (t.status === 'completed' || t.status === 'picked')).length || 0
                      const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
                      const isRental = wo.booking_source === 'product_orders' || wo.booking_source === 'package_bookings'

                      const getPriorityColor = (dateStr: string | null) => {
                        if (!dateStr) return "bg-slate-100 text-slate-700 border-slate-200"
                        const diffDays = Math.ceil((new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                        if (diffDays <= 1) return "bg-red-100 text-red-800 border-red-200"
                        if (diffDays <= 3) return "bg-orange-100 text-orange-800 border-orange-200"
                        if (diffDays <= 7) return "bg-yellow-100 text-yellow-800 border-yellow-200"
                        return "bg-green-100 text-green-800 border-green-200"
                      }

                      const getPriorityLabel = (dateStr: string | null) => {
                        if (!dateStr) return "Low"
                        const diffDays = Math.ceil((new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                        if (diffDays <= 1) return "Critical (Immediate)"
                        if (diffDays <= 3) return "High"
                        if (diffDays <= 7) return "Medium"
                        return "Low"
                      }

                      let formattedDate = ""
                      if (wo.event_date) {
                        try {
                          const d = new Date(wo.event_date)
                          if (!isNaN(d.getTime())) {
                            formattedDate = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                          }
                        } catch (e) {}
                      }

                      const isUrgent = getPriorityLabel(wo.event_date).includes("Critical")

                      return (
                        <div
                          key={wo.id}
                          onClick={() => router.push(`/work-orders/${wo.id}`)}
                          className={`bg-white border rounded-xl overflow-hidden hover:shadow-lg transition-all cursor-pointer border-t-4 ${
                            isUrgent ? 'border-t-red-500' : isRental ? 'border-t-indigo-500' : 'border-t-emerald-500'
                          }`}
                        >
                          <div className="pb-2 pt-3 px-4 flex flex-row items-start justify-between space-y-0">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-black text-indigo-600 tracking-wider">
                                  {wo.work_order_number || ''}
                                </span>
                                <span className="text-[10px] text-slate-400 font-bold">•</span>
                                <span className="text-xs font-semibold text-slate-500">
                                  {wo.booking_number || ''}
                                </span>
                                {isRental ? (
                                  <span className="inline-flex items-center gap-0.5 text-[9px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded-full">
                                    Rental
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-0.5 text-[9px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                                    Sale
                                  </span>
                                )}
                              </div>
                              <p className="text-sm font-bold text-slate-800 line-clamp-1">{wo.customer_name || 'N/A'}</p>
                            </div>
                            <Badge className={
                              wo.status === 'new'
                                ? 'bg-blue-50 text-blue-700 border-blue-100 shrink-0'
                                : 'bg-amber-50 text-amber-700 border-amber-100 shrink-0'
                            } variant="outline">
                              {wo.status === 'new' ? 'New' : 'In Progress'}
                            </Badge>
                          </div>

                          <div className="pb-3 px-4 space-y-2">
                            <div className="flex items-center justify-between gap-2 border-y py-2 text-[11px] text-slate-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-slate-400" />
                                Event: {formattedDate || 'N/A'}
                              </span>
                              <Badge variant="outline" className={`text-[9px] border font-bold ${getPriorityColor(wo.event_date)}`}>
                                {getPriorityLabel(wo.event_date)}
                              </Badge>
                            </div>

                            {totalTasks > 0 && (
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-[10px] font-bold text-slate-600">
                                  <span>Operations Progress</span>
                                  <span>{completedTasks}/{totalTasks} ({progressPct}%)</span>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full transition-all duration-300 ${isRental ? 'bg-indigo-600' : 'bg-emerald-600'}`}
                                    style={{ width: `${progressPct}%` }}
                                  />
                                </div>
                              </div>
                            )}

                            <div className="flex items-center justify-end text-[11px] text-indigo-600 font-bold pt-1 gap-0.5">
                              View Work Order Details
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-medium">No active work orders</p>
                  <p className="text-xs mt-0.5">Everything is packed and delivered!</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Booking Calendar - Only show if user has bookings permission */}
        {user?.permissions?.bookings && (
          <BookingCalendar 
            franchiseId={user?.role !== 'super_admin' ? user?.franchise_id : undefined} 
          />
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Staff Performance Card for Owner */}
          {user?.role === 'super_admin' && (
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-base font-extrabold">Staff Performance</CardTitle>
                <CardDescription className="text-xs">Workflow tasks completed by staff members</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {stats?.ownerKPIs?.staffPerformance && stats.ownerKPIs.staffPerformance.length > 0 ? (
                  stats.ownerKPIs.staffPerformance
                    .filter((staff: any) => staff && staff.name)
                    .map((staff: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0 text-xs font-semibold">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center font-bold text-xs text-indigo-700">
                            {(staff.name || 'Staff').slice(0, 2).toUpperCase()}
                          </div>
                          <span className="text-slate-700">{staff.name || 'Staff'}</span>
                        </div>
                        <Badge className="bg-green-50 text-green-700 border border-green-150 text-[10px] px-1.5 py-0.5 rounded font-bold">
                          {staff.completedCount || 0} Tasks Done
                        </Badge>
                      </div>
                    ))
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No task completion records found.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {user?.permissions?.bookings && (
                <Link href="/create-invoice">
                  <Button className="w-full justify-start">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Booking
                  </Button>
                </Link>
              )}
              {user?.permissions?.customers && (
                <Link href="/customers?add=true">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Users className="h-4 w-4 mr-2" />
                    Add New Customer
                  </Button>
                </Link>
              )}
              {user?.permissions?.inventory && (
                <Link href="/inventory">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Package className="h-4 w-4 mr-2" />
                    Manage Inventory
                  </Button>
                </Link>
              )}
              {!user?.permissions?.bookings && !user?.permissions?.customers && !user?.permissions?.inventory && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No quick actions available
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity Timeline - Only show if user has bookings permission */}
          {user?.permissions?.bookings && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest booking updates and events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentBookings && recentBookings.length > 0 ? (
                    recentBookings.filter(Boolean).slice(0, 5).map((booking) => (
                    <div key={booking.id} className="flex items-start gap-4 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-shrink-0 mt-1">
                        {booking.status === 'confirmed' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                        {(booking as any).status === 'pending_payment' && <Clock className="h-5 w-5 text-yellow-600" />}
                        {booking.status === 'delivered' && <Truck className="h-5 w-5 text-blue-600" />}
                        {(booking as any).status === 'quote' && <Calendar className="h-5 w-5 text-purple-600" />}
                        {!['confirmed', 'pending_payment', 'delivered', 'quote'].includes((booking as any).status) && <Crown className="h-5 w-5 text-gray-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-sm">{booking.booking_number}</p>
                            <p className="text-sm text-gray-600">{booking.customer?.name}</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                              <span className="text-xs text-gray-500">
                                Event: {(() => {
                                  if (!booking.event_date) return "N/A"
                                  try {
                                    const d = new Date(booking.event_date)
                                    if (isNaN(d.getTime())) return "N/A"
                                    return d.toLocaleDateString()
                                  } catch {
                                    return "N/A"
                                  }
                                })()}
                              </span>
                              {(booking as any).type && (
                                <Badge variant="outline" className="text-xs">
                                  {(booking as any).type === 'package' ? 'Package' : 'Product'}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-semibold text-sm">₹{booking.total_amount?.toLocaleString()}</p>
                            <Badge className={`${getStatusColor(booking.status || '')} text-xs mt-1`}>
                              {(booking.status || '').replace(/_/g, ' ')}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No recent bookings found</p>
                    <p className="text-xs mt-1">Create your first booking to get started</p>
                  </div>
                )}
              </div>
              <div className="mt-4">
                <Link href="/bookings">
                  <Button variant="outline" className="w-full bg-transparent">
                    <Eye className="h-4 w-4 mr-2" />
                    View All Bookings
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          )}
        </div>
        </>
        )}
      </div>
    </DashboardLayout>
    </DashboardErrorBoundary>
  )
}
