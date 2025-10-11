"use client"

import type * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import {
  Calendar,
  Crown,
  Users,
  Package,
  FileText,
  Settings,
  BarChart3,
  Truck,
  Shirt,
  Receipt,
  Building2,
  UserCheck,
  LogOut,
  ChevronUp,
  User2,
  Home,
  DollarSign,
  Clock,
  Store,
  Zap,
  Info,
  Layers,
  FileCheck,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { signOut } from "@/lib/auth"
import Link from "next/link"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  userRole?: string
}

// Helper function to get initials from name
function getInitials(name: string): string {
  if (!name) return "U"
  const parts = name.trim().split(" ")
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase()
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const navigationItems = {
  main: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
      roles: ["super_admin", "franchise_admin", "staff", "readonly"],
      description: "Overview of your business metrics, recent activities, and key performance indicators",
    },
    {
      title: "Bookings",
      url: "/bookings",
      icon: Calendar,
      roles: ["super_admin", "franchise_admin", "staff"],
      description: "Manage wedding bookings, event schedules, and customer appointments",
    },
    {
      title: "Customers",
      url: "/customers",
      icon: Users,
      roles: ["super_admin", "franchise_admin", "staff"],
      description: "Customer database with contact information, booking history, and preferences",
    },
    {
      title: "Inventory",
      url: "/inventory",
      icon: Package,
      roles: ["super_admin", "franchise_admin"],
      description: "Track wedding accessories, manage stock levels, and monitor product availability",
    },
    {
      title: "Packages",
      url: "/sets",
      icon: Layers,
      roles: ["super_admin", "franchise_admin"],
      description:
        "Manage wedding accessory packages with categories, variants, and distance-based pricing from Alkapuri, Vadodara",
    },
    {
      title: "Vendors",
      url: "/vendors",
      icon: Store,
      roles: ["super_admin", "franchise_admin", "staff"],
      description: "Manage supplier relationships, vendor contacts, and procurement processes",
    },
  ],
  business: [
    {
      title: "Quotes",
      url: "/quotes",
      icon: FileText,
      roles: ["super_admin", "franchise_admin", "staff"],
      description: "Generate price quotes, proposals, and estimates for wedding services",
    },
    {
      title: "Invoices",
      url: "/invoices",
      icon: FileCheck,
      roles: ["super_admin", "franchise_admin", "staff"],
      description: "View and manage invoices for confirmed bookings and orders",
    },
    {
      title: "Laundry",
      url: "/laundry",
      icon: Shirt,
      roles: ["super_admin", "franchise_admin", "staff"],
      description: "Track laundry batches, vendor relationships, and cleaning schedules",
    },
    {
      title: "Expenses",
      url: "/expenses",
      icon: Receipt,
      roles: ["super_admin", "franchise_admin"],
      description: "Record business expenses, categorize costs, and track spending patterns",
    },
    {
      title: "Deliveries",
      url: "/deliveries",
      icon: Truck,
      roles: ["super_admin", "franchise_admin", "staff"],
      description: "Manage delivery schedules, track shipments, and coordinate logistics",
    },
    {
      title: "Payroll",
      url: "/payroll",
      icon: DollarSign,
      roles: ["super_admin", "franchise_admin"],
      description: "Process employee salaries, manage attendance, and handle payroll calculations",
    },
    {
      title: "Attendance",
      url: "/attendance",
      icon: Clock,
      roles: ["super_admin", "franchise_admin", "staff"],
      description: "Track employee attendance, working hours, and leave management",
    },
  ],
  reports: [
    {
      title: "Reports",
      url: "/reports",
      icon: BarChart3,
      roles: ["super_admin", "franchise_admin"],
      description: "Generate business reports, analytics, and performance insights",
    },
    {
      title: "Financials",
      url: "/financials",
      icon: FileText,
      roles: ["super_admin", "franchise_admin"],
      description: "Financial overview, revenue tracking, and profit/loss analysis",
    },
  ],
  admin: [
    {
      title: "Franchises",
      url: "/franchises",
      icon: Building2,
      roles: ["super_admin"],
      description: "Manage franchise locations, permissions, and organizational structure",
    },
    {
      title: "Staff",
      url: "/staff",
      icon: UserCheck,
      roles: ["super_admin", "franchise_admin"],
      description: "Employee management, role assignments, and staff administration",
    },
    {
      title: "Integrations",
      url: "/integrations",
      icon: Zap,
      roles: ["super_admin", "franchise_admin"],
      description: "Connect third-party services, APIs, and external tools",
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
      roles: ["super_admin", "franchise_admin"],
      description: "System configuration, preferences, and application settings",
    },
  ],
}

export function AppSidebar({ userRole = "staff", ...props }: AppSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [profilePhoto, setProfilePhoto] = useState<string>("")

  // Load user data from localStorage
  useEffect(() => {
    try {
      const userStr = localStorage.getItem("safawala_user")
      if (userStr) {
        const user = JSON.parse(userStr)
        setCurrentUser(user)
        console.log('[Sidebar] User loaded:', user)
      }
    } catch (error) {
      console.error("Failed to load user data:", error)
    }
  }, [])

  // Fetch profile photo - SIMPLIFIED VERSION
  useEffect(() => {
    if (!currentUser?.franchise_id) {
      console.log('[Sidebar] Waiting for franchise_id...')
      return
    }

    console.log('[Sidebar] Fetching profile for franchise:', currentUser.franchise_id)
    
    fetch(`/api/settings/profile?franchise_id=${currentUser.franchise_id}`)
      .then(res => res.json())
      .then(data => {
        console.log('[Sidebar] Full API Response:', JSON.stringify(data, null, 2))
        
        // Try to get profile_photo_url from different possible structures
        let photoUrl = null
        
        if (data.data) {
          if (Array.isArray(data.data) && data.data.length > 0) {
            photoUrl = data.data[0].profile_photo_url
            console.log('[Sidebar] Found in array[0]:', photoUrl)
          } else if (typeof data.data === 'object') {
            photoUrl = data.data.profile_photo_url
            console.log('[Sidebar] Found in object:', photoUrl)
          }
        }
        
        if (photoUrl) {
          console.log('[Sidebar] ✅ Setting profile photo:', photoUrl)
          setProfilePhoto(photoUrl)
        } else {
          console.log('[Sidebar] ❌ No profile_photo_url found in:', data)
        }
      })
      .catch(err => console.error('[Sidebar] Fetch error:', err))
  }, [currentUser?.franchise_id, pathname]) // Re-fetch when pathname changes

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  const filterItemsByRole = (items: any[]) => {
    return items.filter((item) => item.roles.includes(userRole))
  }

  const isActiveItem = (url: string) => {
    return pathname === url || pathname.startsWith(url + "/")
  }

  // Get user display info
  const userName = currentUser?.name || "User"
  const userInitials = getInitials(userName)
  const userAvatar = profilePhoto || currentUser?.avatar_url || ""
  
  console.log('[Sidebar] Render - profilePhoto:', profilePhoto)
  console.log('[Sidebar] Render - userAvatar:', userAvatar)

  return (
    <TooltipProvider>
      <Sidebar variant="inset" collapsible="icon" className="heritage-sidebar" {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                asChild
                isActive={isActiveItem("/dashboard")}
                className="heritage-sidebar-item"
              >
                <Link href="/dashboard" className="w-full">
                  <div className="flex w-full items-center justify-start py-4 pl-4">
                    <img 
                      src="/safawalalogo.png" 
                      alt="Safawala Logo" 
                      className="w-[80%] md:w-[85%] h-auto max-h-[45px] object-contain" 
                      style={{ 
                        imageRendering: "-webkit-optimize-contrast",
                        WebkitFontSmoothing: "antialiased",
                      }}
                    />
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="vintage-subtitle">Main</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filterItemsByRole(navigationItems.main).map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActiveItem(item.url)}
                      tooltip={item.title}
                      className="heritage-sidebar-item"
                    >
                      <Link href={item.url} className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <item.icon />
                          <span>{item.title}</span>
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs">
                            <p className="text-sm">{item.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel className="vintage-subtitle">Business</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filterItemsByRole(navigationItems.business).map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActiveItem(item.url)}
                      tooltip={item.title}
                      className="heritage-sidebar-item"
                    >
                      <Link href={item.url} className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <item.icon />
                          <span>{item.title}</span>
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs">
                            <p className="text-sm">{item.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel className="vintage-subtitle">Analytics</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filterItemsByRole(navigationItems.reports).map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActiveItem(item.url)}
                      tooltip={item.title}
                      className="heritage-sidebar-item"
                    >
                      <Link href={item.url} className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <item.icon />
                          <span>{item.title}</span>
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs">
                            <p className="text-sm">{item.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {(userRole === "super_admin" || userRole === "franchise_admin") && (
            <SidebarGroup>
              <SidebarGroupLabel className="vintage-subtitle">Administration</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {filterItemsByRole(navigationItems.admin).map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActiveItem(item.url)}
                        tooltip={item.title}
                        className="heritage-sidebar-item"
                      >
                        <Link href={item.url} className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <item.icon />
                            <span>{item.title}</span>
                          </div>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-xs">
                              <p className="text-sm">{item.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="heritage-sidebar-item data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <Avatar className="h-8 w-8 rounded-lg">
                      {userAvatar && <AvatarImage src={userAvatar} alt={userName} />}
                      <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold vintage-title">{userName}</span>
                      <span className="truncate text-xs capitalize vintage-subtitle">{userRole.replace("_", " ")}</span>
                    </div>
                    <ChevronUp className="ml-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  side="bottom"
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuItem asChild>
                    <Link href="/settings?tab=profile">
                      <User2 className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    </TooltipProvider>
  )
}
