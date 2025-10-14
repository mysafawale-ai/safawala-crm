"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "./app-sidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { getCurrentUser, signOut } from "@/lib/auth"
import type { User } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { LogOut, Plus, ClipboardList, Bell } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AssignTaskDialog } from "@/components/tasks/assign-task-dialog"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase"
import { CompanyHeader } from "./company-header"
import { NotificationBell } from "@/components/notifications/notification-bell"

interface DashboardLayoutProps {
  children: React.ReactNode
  userRole?: string
}

export function DashboardLayout({ children, userRole }: DashboardLayoutProps) {
  const [user, setUser] = useState<User | null>(null)
  const [showAssignTask, setShowAssignTask] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [profilePhoto, setProfilePhoto] = useState<string>("")
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Fetch fresh user data from API instead of localStorage
        const response = await fetch("/api/auth/user", {
          credentials: "include",
        })

        if (!response.ok) {
          console.log("[DashboardLayout] Not authenticated, redirecting to login")
          router.push("/")
          return
        }

        const userData = await response.json()
        console.log("[DashboardLayout] User authenticated:", userData.name, "Franchise:", userData.franchise_name)
        
        setUser(userData)
        await fetchNotifications(userData)
        await fetchProfilePhoto(userData)
      } catch (error) {
        console.error("[DashboardLayout] Auth error:", error)
        router.push("/")
      }
    }

    checkAuth()
  }, [router])

  const fetchNotifications = async (currentUser: User) => {
    try {
      console.log("[v0] Fetching all notification types from Supabase...")
      const supabase = createClient()

      let query = supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(10)

      if (currentUser.role !== "super_admin" && currentUser.franchise_id) {
        query = query.eq("franchise_id", currentUser.franchise_id)
      }

      const { data, error } = await query

      if (error) {
        console.error("[v0] Error fetching notifications:", error)
        return
      }

      console.log(`[v0] Loaded ${data?.length || 0} notifications of all types from Supabase`)

      // Log notification types for debugging
      if (data && data.length > 0) {
        const types = data.map((n: any) => n.type).filter((v: any, i: number, a: any[]) => a.indexOf(v) === i)
        console.log("[v0] Notification types found:", types)
      }

      setNotifications(data || [])
    } catch (error) {
      console.error("[v0] Failed to fetch notifications:", error)
    }
  }

  const fetchProfilePhoto = async (currentUser: User) => {
    try {
      if (!currentUser.franchise_id || !currentUser.id) {
        console.log("[DashboardLayout] Missing franchise_id or user_id, skipping profile photo fetch")
        return
      }

      const params = new URLSearchParams({
        franchise_id: currentUser.franchise_id,
        user_id: currentUser.id,
      })

      const response = await fetch(`/api/settings/profile?${params}`)
      
      if (response.ok) {
        const result = await response.json()
        if (result.data?.profile_photo_url) {
          console.log("[DashboardLayout] Profile photo loaded:", result.data.profile_photo_url)
          setProfilePhoto(result.data.profile_photo_url)
        } else {
          console.log("[DashboardLayout] No profile photo found")
        }
      }
    } catch (error) {
      console.error("[DashboardLayout] Failed to fetch profile photo:", error)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  const canAssignTasks = user?.role === "super_admin" || user?.role === "franchise_admin"
  const unreadNotifications = notifications.filter((n) => !n.read).length

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar userRole={user.role} />
      <SidebarInset>
        <header className="heritage-header flex h-14 sm:h-16 shrink-0 items-center justify-between border-b px-3 sm:px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="p-1 h-8 w-8 sm:h-9 sm:w-9" />
            <CompanyHeader className="hidden sm:flex" />
            <div className="sm:hidden">
              <CompanyHeader className="text-sm" />
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="btn-heritage-outline gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 h-8 sm:h-9 bg-transparent"
                >
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Create Order</span>
                  <span className="sm:hidden">Order</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Create New</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/create-product-order" className="cursor-pointer">
                    Product Order
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/book-package" className="cursor-pointer">
                    Package Booking
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {canAssignTasks && (
              <Button
                variant="outline"
                size="sm"
                className="btn-heritage-outline gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 h-8 sm:h-9 bg-transparent"
                onClick={() => setShowAssignTask(true)}
              >
                <ClipboardList className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Assign Task</span>
                <span className="sm:hidden">Task</span>
              </Button>
            )}

            {/* New Notification Bell Component */}
            <NotificationBell />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-full p-0">
                  <Avatar className="h-6 w-6 sm:h-8 sm:w-8">
                    {profilePhoto && <AvatarImage src={profilePhoto} alt={user.name} />}
                    <AvatarFallback className="text-xs sm:text-sm bg-primary text-primary-foreground">
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 max-w-[calc(100vw-1rem)] mr-2" align="end" forceMount>
                <DropdownMenuLabel className="font-normal p-4">
                  <div className="flex flex-col space-y-2">
                    <p className="text-sm font-medium leading-none truncate">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground truncate">{user.email}</p>
                    <Badge variant="secondary" className="w-fit text-xs capitalize">
                      {user.role.replace("_", " ")}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="p-3">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="heritage-container flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">{children}</main>

        {canAssignTasks && (
          <AssignTaskDialog open={showAssignTask} onOpenChange={setShowAssignTask} currentUser={user} />
        )}
      </SidebarInset>
    </SidebarProvider>
  )
}
