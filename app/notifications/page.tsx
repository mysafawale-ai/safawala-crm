"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { getCurrentUser } from "@/lib/auth"
import type { User } from "@/lib/types"
import { Calendar, Users, Package, DollarSign, Eye, Bell, Check, CheckCheck, ArrowLeft, RefreshCw } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase as supabaseClient } from "@/lib/supabase"

interface Notification {
  id: string
  type: "booking" | "payment" | "inventory" | "customer" | "quote" | "vendor" | "expense" | "task" | "system"
  title: string
  message: string
  timestamp: Date
  read: boolean
  priority: "high" | "medium" | "low"
  actionUrl?: string
}

export default function NotificationsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<string>("all")
  const supabase = supabaseClient

  const fetchData = async () => {
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        return
      }
      setUser(currentUser)

      console.log("[v0] Fetching notifications from Supabase...")

      // Try to fetch from Supabase first, fall back to mock data
      let notificationsData: Notification[] = []

      try {
        if (supabase) {
          let query = supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(50)

          if (currentUser.role !== "super_admin") {
            if (currentUser.franchise_id) {
              query = query.or(`franchise_id.eq.${currentUser.franchise_id},user_id.eq.${currentUser.id}`)
            } else {
              query = query.eq("user_id", currentUser.id)
            }
          }

          const { data: supabaseNotifications, error } = await query

          if (error) {
            console.error("[v0] Error fetching notifications:", error)
            throw error
          }

          // Transform Supabase data to match our interface
          notificationsData = supabaseNotifications.map((n: any) => ({
            id: n.id,
            type: n.type || "booking",
            title: n.title,
            message: n.message,
            timestamp: new Date(n.created_at),
            read: n.read || false,
            priority: n.priority || "medium",
            actionUrl: n.action_url,
          }))

          console.log(`[v0] Loaded ${notificationsData.length} real notifications from Supabase`)

          if (notificationsData.length === 0) {
            toast.success("No notifications yet")
          } else {
            toast.success(`Notifications loaded (${notificationsData.length})`)
          }
        }
      } catch (supabaseError) {
        console.error("[v0] Failed to fetch notifications:", supabaseError)
  toast.error("Failed to load notifications")
      }

      setNotifications(notificationsData)
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
  toast.error("Failed to load notifications")
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
    toast.success("Notifications refreshed")
  }

  const markAsRead = async (notificationId: string) => {
    try {
      if (supabase) {
        const { error } = await supabase
          .from("notifications")
          .update({ read: true, updated_at: new Date().toISOString() })
          .eq("id", notificationId)

        if (error) {
          console.log("[v0] Could not update notification in Supabase, updating locally only")
        } else {
          console.log("[v0] Notification marked as read in Supabase")
        }
      }
    } catch (error) {
      console.log("[v0] Supabase update failed, updating locally only")
    }

    setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)))
    toast.success("Notification marked as read")
  }

  const markAllAsRead = async () => {
    try {
      if (supabase) {
        const { error } = await supabase
          .from("notifications")
          .update({ read: true, updated_at: new Date().toISOString() })
          .eq("read", false)

        if (error) {
          console.log("[v0] Could not update notifications in Supabase, updating locally only")
        } else {
          console.log("[v0] All notifications marked as read in Supabase")
        }
      }
    } catch (error) {
      console.log("[v0] Supabase update failed, updating locally only")
    }

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    toast.success("All notifications marked as read")
  }

  const deleteNotification = (notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
    toast.success("Notification deleted")
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "booking":
        return Calendar
      case "payment":
        return DollarSign
      case "inventory":
        return Package
      case "customer":
        return Users
      case "quote":
        return Eye
      case "vendor":
        return Users
      case "expense":
        return DollarSign
      case "task":
        return Bell
      case "system":
        return Bell
      default:
        return Bell
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === "all") return true
    if (filter === "unread") return !notification.read
    if (filter === "read") return notification.read
    return notification.type === filter
  })

  const unreadCount = notifications.filter((n) => !n.read).length

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return (
      <DashboardLayout userRole={user?.role}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userRole={user?.role}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
              <p className="text-muted-foreground">
                Stay updated with all your business activities
                {unreadCount > 0 && <Badge className="ml-2 bg-red-500">{unreadCount} unread</Badge>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead}>
                <CheckCheck className="h-4 w-4 mr-2" />
                Mark All Read
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Filter Notifications</CardTitle>
                <CardDescription>Filter by type or status</CardDescription>
              </div>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter notifications" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Notifications ({notifications.length})</SelectItem>
                  <SelectItem value="unread">Unread Only ({unreadCount})</SelectItem>
                  <SelectItem value="read">Read Only ({notifications.length - unreadCount})</SelectItem>
                  <SelectItem value="booking">
                    📅 Bookings ({notifications.filter((n) => n.type === "booking").length})
                  </SelectItem>
                  <SelectItem value="payment">
                    💰 Payments ({notifications.filter((n) => n.type === "payment").length})
                  </SelectItem>
                  <SelectItem value="inventory">
                    📦 Inventory ({notifications.filter((n) => n.type === "inventory").length})
                  </SelectItem>
                  <SelectItem value="customer">
                    👤 Customers ({notifications.filter((n) => n.type === "customer").length})
                  </SelectItem>
                  <SelectItem value="quote">
                    📋 Quotes ({notifications.filter((n) => n.type === "quote").length})
                  </SelectItem>
                  <SelectItem value="vendor">
                    🏪 Vendors ({notifications.filter((n) => n.type === "vendor").length})
                  </SelectItem>
                  <SelectItem value="expense">
                    💳 Expenses ({notifications.filter((n) => n.type === "expense").length})
                  </SelectItem>
                  <SelectItem value="task">
                    ✅ Tasks ({notifications.filter((n) => n.type === "task").length})
                  </SelectItem>
                  <SelectItem value="system">
                    🔧 System ({notifications.filter((n) => n.type === "system").length})
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
        </Card>

        {/* Notifications List */}
        <Card>
          <CardHeader>
            <CardTitle>
              {filter === "all"
                ? "All Notifications"
                : filter === "unread"
                  ? "Unread Notifications"
                  : filter === "read"
                    ? "Read Notifications"
                    : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Notifications`}
            </CardTitle>
            <CardDescription>
              {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((notification) => {
                  const NotificationIcon = getNotificationIcon(notification.type)
                  return (
                    <div
                      key={notification.id}
                      className={`p-4 border rounded-lg transition-all hover:shadow-md ${
                        !notification.read ? "bg-blue-50 border-blue-200" : "bg-white"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <NotificationIcon className="h-6 w-6 text-blue-600 mt-1" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-sm">{notification.title}</h3>
                                <Badge className={getPriorityColor(notification.priority)}>
                                  {notification.priority}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {notification.type}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                              <p className="text-xs text-gray-400">{formatTimeAgo(notification.timestamp)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {!notification.read && (
                                <Button variant="ghost" size="sm" onClick={() => markAsRead(notification.id)}>
                                  <Check className="h-4 w-4" />
                                </Button>
                              )}
                              {notification.actionUrl && (
                                <Link href={notification.actionUrl}>
                                  <Button variant="outline" size="sm">
                                    View
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                        )}
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-12">
                  <Bell className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
                  <p className="text-gray-500">
                    {filter === "all"
                      ? "You're all caught up! No notifications to show."
                      : `No ${filter} notifications found.`}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
