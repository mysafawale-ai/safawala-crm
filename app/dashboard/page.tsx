"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { getCurrentUser } from "@/lib/auth"
import { useData } from "@/hooks/use-data"
import type { User, Booking } from "@/lib/types"
import { Calendar, Users, Package, DollarSign, Plus, Eye, Crown, RefreshCw, Search } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { DashboardSkeleton } from "@/components/ui/skeleton-loader"

interface DashboardStats {
  totalBookings: number
  activeBookings: number
  totalCustomers: number
  totalRevenue: number
  monthlyGrowth: number
  lowStockItems: number
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  const { data: stats, loading: statsLoading, refresh: refreshStats } = useData<DashboardStats>("dashboard-stats")
  const {
    data: recentBookings,
    loading: bookingsLoading,
    refresh: refreshBookings,
  } = useData<Booking[]>("recent-bookings")
  const {
    data: calendarBookings,
    loading: calendarLoading,
    refresh: refreshCalendar,
  } = useData<any[]>("calendar-bookings")

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser()
        if (!currentUser) {
          router.push("/")
          return
        }
        setUser(currentUser)
      } catch (error) {
        router.push("/")
      }
    }

    checkAuth()
  }, [router])

  const handleRefresh = useCallback(async () => {
    try {
      await Promise.all([refreshStats(), refreshBookings(), refreshCalendar()])
      toast.success("Dashboard refreshed successfully")
    } catch (error) {
      toast.error("Failed to refresh dashboard")
    }
  }, [refreshStats, refreshBookings, refreshCalendar])

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
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={statsLoading}>
              <RefreshCw className={`h-4 w-4 ${statsLoading ? 'animate-spin' : ''}`} />
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
        {statsLoading ? (
          <DashboardSkeleton />
        ) : (
          <>
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalBookings || 0}</div>
              <p className="text-xs text-muted-foreground">{stats?.activeBookings || 0} active bookings</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalCustomers || 0}</div>
              <p className="text-xs text-muted-foreground">Growing steadily</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats?.totalRevenue?.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground">+{stats?.monthlyGrowth || 0}% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats?.lowStockItems || 0}</div>
              <p className="text-xs text-muted-foreground">Require immediate attention</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
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
              <Link href="/customers/new">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Users className="h-4 w-4 mr-2" />
                  Add New Customer
                </Button>
              </Link>
              <Link href="/inventory">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Package className="h-4 w-4 mr-2" />
                  Manage Inventory
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Bookings */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Bookings</CardTitle>
              <CardDescription>Latest booking activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentBookings && recentBookings.length > 0 ? (
                  recentBookings.slice(0, 5).map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Crown className="h-5 w-5 text-purple-600" />
                        <div className="flex-1">
                          <p className="font-medium">{booking.booking_number}</p>
                          <p className="text-sm text-gray-500">{booking.customer?.name}</p>
                          <p className="text-xs text-gray-400">
                            Event: {new Date(booking.event_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">₹{booking.total_amount?.toLocaleString()}</p>
                        <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
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
        </div>
        </>
        )}
      </div>
    </DashboardLayout>
  )
}
