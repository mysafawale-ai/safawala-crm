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
  ArrowUpRight, ArrowDownRight, Minus, ShoppingCart, Box, Truck, RotateCcw
} from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { DashboardSkeleton } from "@/components/ui/skeleton-loader"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

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
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

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
      const refreshPromises = [refreshStats()]
      
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

  if (!user) return null

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

        {/* Pending Actions Alert */}
        {stats?.pendingActions && (stats.pendingActions.payments > 0 || stats.pendingActions.deliveries > 0 || stats.pendingActions.returns > 0) && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertTitle className="text-orange-900">Pending Actions Require Attention</AlertTitle>
            <AlertDescription className="text-orange-800">
              <div className="flex flex-wrap gap-4 mt-2">
                {stats.pendingActions.payments > 0 && (
                  <Link href="/bookings?status=pending_payment" className="flex items-center gap-1 hover:underline">
                    <DollarSign className="h-4 w-4" />
                    <span>{stats.pendingActions.payments} pending payments</span>
                  </Link>
                )}
                {stats.pendingActions.deliveries > 0 && (
                  <Link href="/deliveries?status=pending" className="flex items-center gap-1 hover:underline">
                    <Truck className="h-4 w-4" />
                    <span>{stats.pendingActions.deliveries} deliveries scheduled</span>
                  </Link>
                )}
                {stats.pendingActions.returns > 0 && (
                  <Link href="/returns?status=pending" className="flex items-center gap-1 hover:underline">
                    <RotateCcw className="h-4 w-4" />
                    <span>{stats.pendingActions.returns} returns due</span>
                  </Link>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Booking Calendar - Only show if user has bookings permission */}
        {user?.permissions?.bookings && (
          <BookingCalendar 
            franchiseId={user?.role !== 'super_admin' ? user?.franchise_id : undefined} 
          />
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {user?.permissions?.bookings && (
                <>
                  <Link href="/create-product-order">
                    <Button className="w-full justify-start">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Product Order
                    </Button>
                  </Link>
                  <Link href="/book-package">
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Plus className="h-4 w-4 mr-2" />
                      Book Package
                    </Button>
                  </Link>
                </>
              )}
              {user?.permissions?.customers && (
                <Link href="/customers/new">
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
                    recentBookings.slice(0, 5).map((booking) => (
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
                                Event: {new Date(booking.event_date).toLocaleDateString()}
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
                            <Badge className={`${getStatusColor(booking.status)} text-xs mt-1`}>
                              {booking.status.replace(/_/g, ' ')}
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
