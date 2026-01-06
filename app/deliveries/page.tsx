"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Plus, Truck, Package, Clock, CheckCircle, XCircle, Eye, Edit, ArrowLeft, CalendarClock, Loader2, RotateCcw, PackageCheck, Play, Ban } from "lucide-react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { ReturnProcessingDialog } from "@/components/returns/ReturnProcessingDialog"
import { UnifiedHandoverDialog } from "@/components/deliveries/UnifiedHandoverDialog"
import { DialogFooter } from "@/components/ui/dialog"
import { formatTime12Hour } from "@/lib/utils"

const supabase = createClient()

interface Customer {
  id: string
  name: string
  phone: string
  email: string
  address: string
}

interface Booking {
  id: string
  booking_number: string
  customer_id: string
  status: string
  total_amount: number
  booking_date: string
  delivery_date: string
  delivery_address: string
  customers?: Customer
}

interface Delivery {
  id: string
  delivery_number: string
  customer_id?: string
  customer_name: string
  customer_phone: string
  pickup_address: string
  delivery_address: string
  delivery_date: string
  delivery_time?: string
  delivery_type?: string
  status: string
  driver_name: string
  vehicle_number: string
  delivery_charge: number
  fuel_cost: number
  total_amount: number
  special_instructions: string
  assigned_staff: string
  // Link to a booking, so we can show and reschedule return
  booking_id?: string
  booking_source?: "product_order" | "package_booking"
  // If rescheduled, store the new time (ISO string). If not, UI falls back to booking's return_date
  rescheduled_return_at?: string
}

interface Staff {
  id: string
  name: string
  role: string
  is_active: boolean
  franchise?: {
    name: string
  }
}

export default function DeliveriesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState("deliveries")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [deliveryTypeFilter, setDeliveryTypeFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false)
  const [showReturnDialog, setShowReturnDialog] = useState(false)
  const [showHandoverDialog, setShowHandoverDialog] = useState(false)
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null)
  const [selectedReturn, setSelectedReturn] = useState<any>(null)
  const [returns, setReturns] = useState<any[]>([])
  const [deliveryItems, setDeliveryItems] = useState<any[]>([])
  const [deliveryPackage, setDeliveryPackage] = useState<any>(null)
  const [loadingDeliveryItems, setLoadingDeliveryItems] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState<Set<string>>(new Set())
  const [savedAddresses, setSavedAddresses] = useState<any[]>([])
  const [loadingAddresses, setLoadingAddresses] = useState(false)
  const [assignedStaffIds, setAssignedStaffIds] = useState<Set<string>>(new Set())
  const [editAssignedStaffIds, setEditAssignedStaffIds] = useState<Set<string>>(new Set())
  const [editForm, setEditForm] = useState({
    customer_name: "",
    customer_phone: "",
    customer_id: "",
    pickup_address: "",
    delivery_address: "",
    delivery_date: "",
    delivery_time: "",
    driver_name: "",
    vehicle_number: "",
    delivery_charge: "",
    fuel_cost: "",
    special_instructions: "",
  })
  const [customers, setCustomers] = useState<Customer[]>([])
  // Unified bookings list from our API (aggregates product_orders + package_bookings)
  const [bookings, setBookings] = useState<any[]>([])
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [tableNotFound, setTableNotFound] = useState(false)
  const [loading, setLoading] = useState(true)

  const [scheduleForm, setScheduleForm] = useState({
    customer_id: "",
    booking_id: "",
    booking_source: "",
    delivery_type: "package_rental",
    pickup_address: "",
    delivery_address: "",
    delivery_date: "",
    delivery_time: "",
    assigned_staff: "",
    driver_name: "",
    vehicle_number: "",
    delivery_charge: "",
    fuel_cost: "",
    special_instructions: "",
  })

  const [rescheduleForm, setRescheduleForm] = useState<{
    date: string
    time: string
  }>({ date: "", time: "18:00" })

  const [dateFilter, setDateFilter] = useState<{
    from: string
    to: string
  } | null>(null)

  useEffect(() => {
    fetchData()
  }, [dateFilter])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch customers from API (handles franchise filtering)
      try {
        const res = await fetch("/api/customers", { cache: "no-store" })
        if (res.ok) {
          const json = await res.json()
          setCustomers(json?.data || [])
        } else {
          console.warn("Error fetching customers from API:", res.status)
          setCustomers([])
        }
      } catch (e) {
        console.warn("Error fetching customers:", e)
        setCustomers([])
      }

      // Fetch bookings from unified API (includes product_orders and package_bookings)
      try {
        const res = await fetch("/api/bookings", { cache: "no-store" })
        if (!res.ok) throw new Error(`Bookings API error: ${res.status}`)
        const json = await res.json()
        setBookings(json?.data || [])
      } catch (e) {
        console.warn("Error fetching unified bookings:", e)
        setBookings([])
      }

      // Fetch staff from users table (staff members with deliveries permission)
      try {
        const staffRes = await fetch("/api/staff/delivery-team", { cache: "no-store" })
        if (staffRes.ok) {
          const staffJson = await staffRes.json()
          setStaff(staffJson?.data || [])
        } else {
          console.warn("Staff API error:", staffRes.status)
          // Fallback: try direct query to users table
          const { data: staffData, error: staffError } = await supabase
            .from("users")
            .select("id, name, email, role, franchise_id")
            .in("role", ["staff", "franchise_admin", "super_admin"])
            .order("name")

          if (staffError) {
            console.warn("Staff query error:", staffError.message)
            setStaff([])
          } else {
            setStaff(staffData || [])
          }
        }
      } catch (e) {
        console.warn("Staff feature not available:", e)
        setStaff([])
      }

      // Fetch deliveries from API
      try {
        const deliveriesRes = await fetch("/api/deliveries", { cache: "no-store" })
        
        if (!deliveriesRes.ok) {
          const errorData = await deliveriesRes.json().catch(() => ({}))
          console.warn("Deliveries API error:", errorData.error || deliveriesRes.statusText)
          setDeliveries([])
        } else {
          setTableNotFound(false)
          const deliveriesJson = await deliveriesRes.json()
          
          // Map API response to UI format
          const mappedDeliveries = (deliveriesJson?.data || []).map((d: any) => ({
            id: d.id,
            delivery_number: d.delivery_number,
            customer_id: d.customer_id,
            customer_name: d.customer?.name || "Unknown",
            customer_phone: d.customer?.phone || "",
            pickup_address: d.pickup_address || "",
            delivery_address: d.delivery_address,
            delivery_date: d.delivery_date,
            delivery_time: d.delivery_time,
            status: d.status,
            driver_name: d.driver_name || "",
            vehicle_number: d.vehicle_number || "",
            delivery_charge: Number(d.delivery_charge) || 0,
            fuel_cost: Number(d.fuel_cost) || 0,
            total_amount: Number(d.total_amount) || 0,
            special_instructions: d.special_instructions || "",
            assigned_staff: d.assigned_staff_id || "",
            booking_id: d.booking_id || undefined,
            booking_source: d.booking_source || undefined,
            rescheduled_return_at: d.rescheduled_return_at || undefined,
          }))
          
          setDeliveries(mappedDeliveries)
        }
      } catch (e: any) {
        console.warn("Error fetching deliveries:", e.message)
        setDeliveries([])
      }

      // Fetch returns
      try {
        const returnsRes = await fetch("/api/returns?status=pending", { cache: "no-store" })
        if (returnsRes.ok) {
          const returnsJson = await returnsRes.json()
          setReturns(returnsJson?.returns || [])
        } else {
          console.warn("Returns API not available yet")
          setReturns([])
        }
      } catch (e: any) {
        console.warn("Error fetching returns:", e.message)
        setReturns([])
      }
    } catch (error) {
      console.error("Error in fetchData:", error)
      toast({
        title: "Error",
        description: "Failed to fetch data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Helper: update URL query params without full reload
  const replaceQuery = (updates: Record<string, string | null | undefined>) => {
    const params = new URLSearchParams(searchParams?.toString() || "")
    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined || value === null || value === "") params.delete(key)
      else params.set(key, String(value))
    }
    const qs = params.toString()
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`)
  }

  // Helper: clear action-related params
  const clearActionParams = () => replaceQuery({ action: null, delivery_id: null, return_id: null })

  // Status update handlers
  const handleStartTransit = async (deliveryId: string) => {
    setUpdatingStatus((prev) => new Set(prev).add(deliveryId))
    try {
      const res = await fetch(`/api/deliveries/${deliveryId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "in_transit" }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || "Failed to update status")
      }

      toast({
        title: "Success",
        description: "Delivery marked as in transit",
      })

      await fetchData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setUpdatingStatus((prev) => {
        const next = new Set(prev)
        next.delete(deliveryId)
        return next
      })
    }
  }

  const handleMarkDelivered = async (deliveryId: string) => {
    setUpdatingStatus((prev) => new Set(prev).add(deliveryId))
    try {
      const res = await fetch(`/api/deliveries/${deliveryId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "delivered" }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || "Failed to update status")
      }

      const data = await res.json()

      toast({
        title: "Success",
        description: data.returnCreated
          ? "Delivery marked as delivered. Return automatically created."
          : "Delivery marked as delivered.",
      })
      // Open handover capture immediately to record 'not tied' quantities
      const justDelivered = deliveries.find(d => d.id === deliveryId) || null
      if (justDelivered) {
        setSelectedDelivery(justDelivered)
        setShowHandoverDialog(true)
        replaceQuery({ tab: "deliveries", action: "handover", delivery_id: deliveryId })
      }
      // Refresh list in background
      fetchData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setUpdatingStatus((prev) => {
        const next = new Set(prev)
        next.delete(deliveryId)
        return next
      })
    }
  }

  // Deep-link: apply URL params to UI state
  useEffect(() => {
    const tab = searchParams?.get("tab")
    if (tab && (tab === "deliveries" || tab === "returns") && tab !== activeTab) {
      setActiveTab(tab)
    }

    const action = searchParams?.get("action")
    if (!action) return

    // Handle returns actions
    if (action === "reschedule") {
      const rid = searchParams?.get("return_id")
      if (rid && returns.length && !showRescheduleDialog) {
        const r = returns.find((x: any) => x.id === rid)
        if (r) {
          // Simulate click handler logic
          const deliveryLike = {
            id: r.delivery_id || r.id,
            booking_id: r.booking_id,
            booking_source: r.booking_source,
            rescheduled_return_at: r.booking?.return_date || r.return_date,
          }
          setSelectedDelivery(deliveryLike as any)

          const currentISO = r.booking?.return_date || r.return_date
          let date = ""
          let time = "18:00"
          if (currentISO) {
            const d = new Date(currentISO)
            if (!Number.isNaN(d.getTime())) {
              date = d.toISOString().slice(0, 10)
              const hh = String(d.getHours()).padStart(2, "0")
              const mm = String(d.getMinutes()).padStart(2, "0")
              time = `${hh}:${mm}`
            }
          }
          setRescheduleForm({ date, time })
          setShowRescheduleDialog(true)
        }
      }
      return
    }

    if (action === "process") {
      const rid = searchParams?.get("return_id")
      if (rid && returns.length && !showReturnDialog) {
        const r = returns.find((x: any) => x.id === rid)
        if (r) {
          setSelectedReturn(r)
          setShowReturnDialog(true)
        }
      }
      return
    }

    // Handle delivery actions
    const did = searchParams?.get("delivery_id")
    if (did && deliveries.length) {
      const d = deliveries.find((x) => x.id === did)
      if (!d) return
      if (action === "view" && !showViewDialog) {
        setSelectedDelivery(d)
        setShowViewDialog(true)
      }
      if (action === "edit" && !showEditDialog) {
        ;(async () => {
          setSelectedDelivery(d)
          // Prefill same as Edit click
          let deliveryDate = d.delivery_date
          let deliveryTime = d.delivery_time || ""
          let deliveryAddress = d.delivery_address
          
          // Always try to fill from booking if not already filled
          if (d.booking_id) {
            const linkedBooking = bookings.find((b: any) => b.id === d.booking_id && b.source === d.booking_source)
            if (linkedBooking) {
              // Auto-fill from booking with priority to existing delivery values
              deliveryDate = deliveryDate || linkedBooking.delivery_date || ""
              deliveryTime = deliveryTime || linkedBooking.delivery_time || ""
              deliveryAddress = deliveryAddress || linkedBooking.delivery_address || ""
            }
          }
          
          // If delivery address still not filled, fetch from customer profile
          if (!deliveryAddress && d.customer_id) {
            try {
              console.log('📍 Fetching customer address for customer_id:', d.customer_id)
              const res = await fetch(`/api/customers/${d.customer_id}`)
              console.log('📍 Customer API response status:', res.status)
              if (res.ok) {
                const json = await res.json()
                console.log('📍 Customer API response:', json)
                const customer = json.data || json
                console.log('📍 Extracted customer object:', customer)
                if (customer?.address) {
                  deliveryAddress = customer.address
                  console.log('✓ Fetched delivery address from customer:', deliveryAddress)
                } else {
                  console.log('⚠ Customer has no address - address value:', customer?.address)
                }
              } else {
                console.log('⚠ Failed to fetch customer, status:', res.status)
                const errorBody = await res.text()
                console.log('⚠ Error response:', errorBody)
              }
            } catch (error) {
              console.log('⚠ Error fetching customer:', error)
            }
          }
          
          setEditForm({
            customer_name: d.customer_name,
            customer_phone: d.customer_phone,
            customer_id: d.customer_id || "",
            pickup_address: d.pickup_address,
            delivery_address: deliveryAddress,
            delivery_date: deliveryDate,
            delivery_time: deliveryTime,
            driver_name: d.driver_name,
            vehicle_number: d.vehicle_number,
            delivery_charge: d.delivery_charge.toString(),
            fuel_cost: d.fuel_cost.toString(),
            special_instructions: d.special_instructions,
          })
          // Load existing staff assignments
          if (d.assigned_staff) {
            setEditAssignedStaffIds(new Set([d.assigned_staff]))
          } else {
            setEditAssignedStaffIds(new Set())
          }
          // Try to fetch all assigned staff from junction table
          try {
            const staffRes = await fetch(`/api/deliveries/${d.id}/staff`)
            if (staffRes.ok) {
              const staffJson = await staffRes.json()
              if (staffJson.data && staffJson.data.length > 0) {
                const staffIdSet = new Set(staffJson.data.map((s: any) => s.staff?.id || s.staff_id).filter(Boolean))
                if (staffIdSet.size > 0) {
                  setEditAssignedStaffIds(staffIdSet as Set<string>)
                }
              }
            }
          } catch (e) {
            console.warn("Could not fetch staff assignments:", e)
          }
          if (d.customer_id) {
            setLoadingAddresses(true)
            try {
              const res = await fetch(`/api/customer-addresses?customer_id=${d.customer_id}`)
              if (res.ok) {
                const json = await res.json()
                if (json.data) setSavedAddresses(json.data)
              }
            } catch {}
            setLoadingAddresses(false)
          }
          setShowEditDialog(true)
        })()
      }
      if (action === "handover" && !showHandoverDialog) {
        setSelectedDelivery(d)
        setShowHandoverDialog(true)
      }
    }
  }, [searchParams, returns, deliveries, bookings])

  // Load saved addresses when customer is selected in schedule form
  useEffect(() => {
    if (showScheduleDialog && scheduleForm.customer_id) {
      (async () => {
        setLoadingAddresses(true)
        try {
          const res = await fetch(`/api/customer-addresses?customer_id=${scheduleForm.customer_id}`)
          if (res.ok) {
            const json = await res.json()
            if (json.data) setSavedAddresses(json.data)
          }
        } catch {}
        setLoadingAddresses(false)
      })()
    }
  }, [showScheduleDialog, scheduleForm.customer_id])

  // Load saved addresses when Edit dialog opens
  useEffect(() => {
    if (showEditDialog && editForm.customer_id) {
      (async () => {
        setLoadingAddresses(true)
        try {
          const res = await fetch(`/api/customer-addresses?customer_id=${editForm.customer_id}`)
          if (res.ok) {
            const json = await res.json()
            if (json.data) setSavedAddresses(json.data)
          }
        } catch {}
        setLoadingAddresses(false)
      })()
    }
  }, [showEditDialog, editForm.customer_id])

  const handleCancelDelivery = async (deliveryId: string) => {
    setUpdatingStatus((prev) => new Set(prev).add(deliveryId))
    try {
      const res = await fetch(`/api/deliveries/${deliveryId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || "Failed to cancel delivery")
      }

      toast({
        title: "Success",
        description: "Delivery cancelled",
      })

      await fetchData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setUpdatingStatus((prev) => {
        const next = new Set(prev)
        next.delete(deliveryId)
        return next
      })
    }
  }

  const deliveryOverview = {
    totalDeliveries: deliveries.length,
    inTransit: deliveries.filter((delivery) => delivery.status === "in_transit").length,
    delivered: deliveries.filter((delivery) => delivery.status === "delivered").length,
    pending: deliveries.filter((delivery) => delivery.status === "pending").length,
    cancelled: deliveries.filter((delivery) => delivery.status === "cancelled").length,
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "in_transit":
        return <Truck className="h-4 w-4 text-blue-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Package className="h-4 w-4 text-gray-500" />
    }
  }

  // Fetch items and package for the selected delivery
  const loadDeliveryItems = async (delivery: Delivery) => {
    if (!delivery.booking_id) {
      setDeliveryItems([])
      setDeliveryPackage(null)
      return
    }

    setLoadingDeliveryItems(true)
    try {
      // Fetch the order to get package/variant info
      const { data: orderData, error: orderError } = await supabase
        .from("product_orders")
        .select("variant_id, selection_mode, custom_package_price")
        .eq("id", delivery.booking_id)
        .single()

      if (!orderError && orderData?.variant_id) {
        // Fetch package details
        const { data: packageData, error: packageError } = await supabase
          .from("package_variants")
          .select("*")
          .eq("id", orderData.variant_id)
          .single()

        if (!packageError && packageData) {
          console.log("[DeliveryDetails] Loaded package:", packageData.name)
          setDeliveryPackage(packageData)
        } else {
          setDeliveryPackage(null)
        }
      } else {
        setDeliveryPackage(null)
      }

      // Fetch items from product_order_items table using the booking_id
      const { data, error } = await supabase
        .from("product_order_items")
        .select("*")
        .eq("order_id", delivery.booking_id)

      if (error) {
        console.error("[DeliveryDetails] Error fetching items:", error)
        setDeliveryItems([])
      } else {
        console.log("[DeliveryDetails] Loaded items:", data)
        setDeliveryItems(data || [])
      }
    } catch (err) {
      console.error("[DeliveryDetails] Exception fetching items:", err)
      setDeliveryItems([])
      setDeliveryPackage(null)
    } finally {
      setLoadingDeliveryItems(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800"
      case "in_transit":
        return "bg-blue-100 text-blue-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredDeliveries = deliveries.filter((delivery) => {
    const matchesSearch =
      delivery.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.delivery_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.driver_name?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || delivery.status === statusFilter
    const matchesDeliveryType = deliveryTypeFilter === "all" || delivery.delivery_type === deliveryTypeFilter

    return matchesSearch && matchesStatus && matchesDeliveryType
  })

  const paginatedDeliveries = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredDeliveries.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredDeliveries, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredDeliveries.length / itemsPerPage)

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter, deliveryTypeFilter])

  // Load delivery items when view dialog is opened
  useEffect(() => {
    if (showViewDialog && selectedDelivery) {
      loadDeliveryItems(selectedDelivery)
    }
  }, [showViewDialog, selectedDelivery?.id])

  // Mock drivers data (since we don't have a drivers table)
  const mockDrivers = [
    { id: "1", name: "Rajesh Kumar", vehicle: "MH01AB1234", phone: "+91 9876543210" },
    { id: "2", name: "Amit Singh", vehicle: "MH02CD5678", phone: "+91 9876543211" },
    { id: "3", name: "Suresh Patil", vehicle: "MH03EF9012", phone: "+91 9876543212" },
  ]

  const displayStaff =
    staff.length > 0
      ? staff
      : [
          { id: "staff-1", name: "Manager 1", role: "Manager", is_active: true },
          { id: "staff-2", name: "Staff 1", role: "Staff", is_active: true },
        ]

  const displayCustomers =
    customers.length > 0
      ? customers
      : [{ id: "cust-1", name: "John Doe", phone: "+91 9876543210", email: "john@example.com", address: "123 Main St" }]

  // Map bookings by id for quick lookup
  const bookingsById = useMemo(() => {
    const map = new Map<string, any>()
    for (const b of bookings || []) map.set(b.id, b)
    return map
  }, [bookings])

  // Compute current return for a delivery: rescheduled_return_at or booking.pickup_date (original return)
  const getCurrentReturnISO = (delivery: Delivery): string | null => {
    if (delivery.rescheduled_return_at) return delivery.rescheduled_return_at
    if (delivery.booking_id) {
      const b = bookingsById.get(delivery.booking_id)
      // unified API exposes return as pickup_date
      return b?.pickup_date || null
    }
    return null
  }

  // Calculate completeness percentage based on filled optional fields
  const calculateCompleteness = (delivery: Delivery): { percentage: number; missing: string[] } => {
    const fields = [
      { key: 'driver_name', label: 'Driver Name', value: delivery.driver_name },
      { key: 'vehicle_number', label: 'Vehicle Number', value: delivery.vehicle_number },
      { key: 'pickup_address', label: 'Pickup Address', value: delivery.pickup_address },
      { key: 'delivery_address', label: 'Delivery Address', value: delivery.delivery_address },
      { key: 'delivery_date', label: 'Delivery Date', value: delivery.delivery_date },
      { key: 'delivery_time', label: 'Delivery Time', value: delivery.delivery_time },
      { key: 'customer_phone', label: 'Customer Phone', value: delivery.customer_phone },
      { key: 'special_instructions', label: 'Special Instructions', value: delivery.special_instructions },
    ]
    
    const filled = fields.filter(f => f.value && f.value.trim() !== '').length
    const total = fields.length
    const percentage = Math.round((filled / total) * 100)
    const missing = fields.filter(f => !f.value || f.value.trim() === '').map(f => f.label)
    
    return { percentage, missing }
  }

  // Get color based on completion percentage
  const getCompletenessColor = (percentage: number): string => {
    if (percentage >= 80) return 'text-green-600 bg-green-100'
    if (percentage >= 50) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const handleBack = () => {
    console.log("[v0] Back button clicked")
    try {
      // Try to go back in browser history
      if (window.history.length > 1) {
        console.log("[v0] Going back in history")
        router.back()
      } else {
        console.log("[v0] No history, navigating to dashboard")
        router.push("/")
      }
    } catch (error) {
      console.error("[v0] Error with back navigation:", error)
      // Fallback to dashboard
      router.push("/")
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between space-y-2">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={handleBack} className="flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">📦 Deliveries & Returns Management</h2>
            <p className="text-muted-foreground">Schedule deliveries, track fulfillment, and manage product returns</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Schedule Delivery
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Schedule New Delivery</DialogTitle>
                <DialogDescription>Create a new delivery schedule for wedding turban orders</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customer">Customer</Label>
                    <Select
                      value={scheduleForm.customer_id}
                      onValueChange={(value) => {
                        // Find selected customer
                        const selectedCustomer = customers.find(c => c.id === value)
                        
                        // Get customer's address if available
                        let customerAddress = selectedCustomer?.address || ""
                        
                        // Get first booking for this customer to auto-fill date/time if available
                        const customerBookings = bookings.filter((b: any) => b.customer_id === value)
                        const firstBooking = customerBookings[0]
                        
                        // Convert delivery_date to YYYY-MM-DD format if it exists
                        let deliveryDate = ""
                        if (firstBooking?.delivery_date) {
                          // If it's an ISO string or timestamp, extract just the date part
                          const dateObj = new Date(firstBooking.delivery_date)
                          deliveryDate = dateObj.toISOString().split('T')[0] // YYYY-MM-DD
                        }
                        
                        // Convert delivery_time to HH:MM format if it exists
                        let deliveryTime = ""
                        if (firstBooking?.delivery_time) {
                          // If it's already in HH:MM format, use as-is; otherwise try to parse
                          deliveryTime = String(firstBooking.delivery_time).substring(0, 5) // Take first 5 chars for HH:MM
                        }
                        
                        console.log('📍 Customer selected:', value)
                        console.log('📍 First booking:', firstBooking)
                        console.log('📍 Delivery date from booking (raw):', firstBooking?.delivery_date)
                        console.log('📍 Delivery date converted:', deliveryDate)
                        console.log('📍 Delivery time from booking (raw):', firstBooking?.delivery_time)
                        console.log('📍 Delivery time converted:', deliveryTime)
                        
                        setScheduleForm({
                          ...scheduleForm,
                          customer_id: value,
                          booking_id: "",
                          booking_source: "",
                          // Auto-fill delivery address from customer profile
                          delivery_address: customerAddress,
                          // Auto-fill delivery date & time from first available booking (converted to proper format)
                          delivery_date: deliveryDate,
                          delivery_time: deliveryTime,
                        })
                      }}
                    >
                      <SelectTrigger className="border-gray-300 hover:border-gray-400 focus:ring-2 focus:ring-blue-500">
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent position="popper" side="top" align="start" className="max-h-[240px] z-[100] bg-white border border-gray-200 shadow-lg rounded-md p-1">
                        {displayCustomers.map((customer) => (
                          <SelectItem 
                            key={customer.id} 
                            value={customer.id}
                            className="cursor-pointer pl-8 pr-3 py-2.5 mb-1 hover:bg-gray-100 focus:bg-blue-50 data-[state=checked]:bg-blue-100 data-[state=checked]:text-blue-900 transition-colors rounded-sm relative"
                          >
                            <div className="flex flex-col gap-0.5">
                              <span className="font-medium text-sm">{customer.name}</span>
                              <span className="text-xs text-gray-500">{customer.phone}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="booking">Related Booking (Optional)</Label>
                    <Select
                      value={scheduleForm.booking_id && scheduleForm.booking_source ? `${scheduleForm.booking_id}::${scheduleForm.booking_source}` : ""}
                      onValueChange={(value) => {
                        if (!value) return
                        // value contains "<id>::<source>"
                        const [id, source] = value.split("::")
                        
                        // Find the selected booking
                        const selectedBooking = bookings.find((b: any) => b.id === id)
                        
                        if (selectedBooking) {
                          // Convert delivery_date to YYYY-MM-DD format
                          let deliveryDate = ""
                          if (selectedBooking.delivery_date) {
                            const dateObj = new Date(selectedBooking.delivery_date)
                            deliveryDate = dateObj.toISOString().split('T')[0] // YYYY-MM-DD
                          }
                          
                          // Convert delivery_time to HH:MM format
                          let deliveryTime = ""
                          if (selectedBooking.delivery_time) {
                            deliveryTime = String(selectedBooking.delivery_time).substring(0, 5) // HH:MM
                          }
                          
                          // Auto-fill data from booking
                          setScheduleForm((prev) => ({
                            ...prev,
                            booking_id: id,
                            booking_source: source,
                            // Auto-fill customer if not already selected
                            customer_id: prev.customer_id || selectedBooking.customer_id || "",
                            // Auto-fill delivery date and time from booking (with proper formatting)
                            delivery_date: deliveryDate || prev.delivery_date || "",
                            delivery_time: deliveryTime || prev.delivery_time || "",
                            // Auto-fill delivery address if available
                            delivery_address: selectedBooking.delivery_address || prev.delivery_address || "",
                          }))
                        } else {
                          setScheduleForm({ ...scheduleForm, booking_id: id, booking_source: source })
                        }
                      }}
                    >
                      <SelectTrigger className="border-gray-300 hover:border-gray-400 focus:ring-2 focus:ring-blue-500">
                        <SelectValue placeholder="Select booking" />
                      </SelectTrigger>
                      <SelectContent position="popper" side="top" align="start" className="max-h-[240px] z-[100] bg-white border border-gray-200 shadow-lg rounded-md p-1">
                        {(() => {
                          // Filter bookings by selected customer
                          const filteredBookings = scheduleForm.customer_id
                            ? bookings.filter((b: any) => b.customer_id === scheduleForm.customer_id)
                            : bookings
                          
                          if (filteredBookings.length === 0) {
                            return (
                              <div className="px-3 py-2 text-sm text-gray-500 text-center">
                                {scheduleForm.customer_id ? "No bookings for this customer" : "No bookings available"}
                              </div>
                            )
                          }
                          
                          return filteredBookings.map((booking: any) => (
                            <SelectItem 
                              key={booking.id} 
                              value={`${booking.id}::${booking.source}`}
                              className="cursor-pointer pl-8 pr-3 py-2.5 mb-1 hover:bg-gray-100 focus:bg-blue-50 data-[state=checked]:bg-blue-100 data-[state=checked]:text-blue-900 transition-colors rounded-sm relative"
                            >
                              <div className="flex flex-col gap-0.5">
                                <span className="font-medium text-sm">{booking.booking_number}</span>
                                <span className="text-xs text-gray-500">
                                  {booking.type} • ₹{booking.total_amount?.toLocaleString()}
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        })()}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="delivery_type">Delivery Type</Label>
                    <Select
                      value={scheduleForm.delivery_type}
                      onValueChange={(value) => setScheduleForm({ ...scheduleForm, delivery_type: value })}
                    >
                      <SelectTrigger className="border-gray-300 hover:border-gray-400 focus:ring-2 focus:ring-blue-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent position="popper" side="top" align="start" className="z-[100] bg-white border border-gray-200 shadow-lg rounded-md p-1">
                        <SelectItem 
                          value="package_rental"
                          className="cursor-pointer pl-8 pr-3 py-2.5 mb-1 hover:bg-gray-100 focus:bg-blue-50 data-[state=checked]:bg-blue-100 data-[state=checked]:text-blue-900 transition-colors rounded-sm relative"
                        >
                          <span className="font-medium">Package Rental</span>
                        </SelectItem>
                        <SelectItem 
                          value="product_rental"
                          className="cursor-pointer pl-8 pr-3 py-2.5 mb-1 hover:bg-gray-100 focus:bg-blue-50 data-[state=checked]:bg-blue-100 data-[state=checked]:text-blue-900 transition-colors rounded-sm relative"
                        >
                          <span className="font-medium">Product Rental</span>
                        </SelectItem>
                        <SelectItem 
                          value="product_sale"
                          className="cursor-pointer pl-8 pr-3 py-2.5 mb-1 hover:bg-gray-100 focus:bg-blue-50 data-[state=checked]:bg-blue-100 data-[state=checked]:text-blue-900 transition-colors rounded-sm relative"
                        >
                          <span className="font-medium">Product Sale</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assigned_staff">Assigned Staff</Label>
                    <Select
                      value={scheduleForm.assigned_staff}
                      onValueChange={(value) => setScheduleForm({ ...scheduleForm, assigned_staff: value })}
                    >
                      <SelectTrigger className="border-gray-300 hover:border-gray-400 focus:ring-2 focus:ring-blue-500">
                        <SelectValue placeholder="Select staff member" />
                      </SelectTrigger>
                      <SelectContent position="popper" side="top" align="start" className="max-h-[240px] z-[100] bg-white border border-gray-200 shadow-lg rounded-md p-1">
                        {displayStaff.map((member) => (
                          <SelectItem 
                            key={member.id} 
                            value={member.id}
                            className="cursor-pointer pl-8 pr-3 py-2.5 mb-1 hover:bg-gray-100 focus:bg-blue-50 data-[state=checked]:bg-blue-100 data-[state=checked]:text-blue-900 transition-colors rounded-sm relative"
                          >
                            <div className="flex flex-col gap-0.5">
                              <span className="font-medium text-sm">{member.name}</span>
                              <span className="text-xs text-gray-500">{member.role}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pickup_address">Pickup Address</Label>
                  
                  {/* Smart Address Dropdown - Only for Pickup */}
                  {savedAddresses.length > 0 && (
                    <Select
                      onValueChange={(value) => {
                        if (value === 'new') {
                          setScheduleForm({ ...scheduleForm, pickup_address: '' })
                        } else if (value === 'current') {
                          // Keep current value
                        } else {
                          const selected = savedAddresses.find(a => a.id === value)
                          if (selected) {
                            setScheduleForm({ ...scheduleForm, pickup_address: selected.full_address })
                          }
                        }
                      }}
                    >
                      <SelectTrigger className="mb-2">
                        <SelectValue placeholder="📍 Quick Select from Saved Addresses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="current">Use Current Address</SelectItem>
                        <SelectItem value="new">✏️ Type New Address</SelectItem>
                        {savedAddresses.map(addr => (
                          <SelectItem key={addr.id} value={addr.id}>
                            {addr.label ? `${addr.label}: ` : ''}{addr.full_address.substring(0, 50)}{addr.full_address.length > 50 ? '...' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  
                  <Textarea
                    id="pickup_address"
                    placeholder="Enter pickup address or select from saved addresses above"
                    value={scheduleForm.pickup_address}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, pickup_address: e.target.value })}
                  />
                  {loadingAddresses && (
                    <p className="text-xs text-muted-foreground">Loading saved addresses...</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delivery_address">Delivery Address</Label>
                  <Textarea
                    id="delivery_address"
                    placeholder="Enter delivery address"
                    value={scheduleForm.delivery_address}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, delivery_address: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="delivery_date">Delivery Date</Label>
                    <Input
                      id="delivery_date"
                      type="date"
                      value={scheduleForm.delivery_date}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, delivery_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="delivery_time">Preferred Time</Label>
                    <Input
                      id="delivery_time"
                      type="time"
                      value={scheduleForm.delivery_time}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, delivery_time: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="driver_name">Driver Name</Label>
                    <Input
                      id="driver_name"
                      placeholder="Enter driver name"
                      value={scheduleForm.driver_name}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, driver_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicle_number">Vehicle Number</Label>
                    <Input
                      id="vehicle_number"
                      placeholder="Enter vehicle number"
                      value={scheduleForm.vehicle_number}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, vehicle_number: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Assign Staff</Label>
                  <div className="border rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto bg-gray-50">
                    {staff.length > 0 ? (
                      staff.map((member) => (
                        <div key={member.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`staff_${member.id}`}
                            checked={assignedStaffIds.has(member.id)}
                            onChange={(e) => {
                              const newSet = new Set(assignedStaffIds)
                              if (e.target.checked) {
                                newSet.add(member.id)
                              } else {
                                newSet.delete(member.id)
                              }
                              setAssignedStaffIds(newSet)
                            }}
                            className="rounded"
                          />
                          <label htmlFor={`staff_${member.id}`} className="text-sm cursor-pointer flex-1">
                            {member.name}
                          </label>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No staff members available</p>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Selected: {assignedStaffIds.size} staff member{assignedStaffIds.size !== 1 ? 's' : ''}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="delivery_charge">Delivery Charge (₹)</Label>
                    <Input
                      id="delivery_charge"
                      type="number"
                      placeholder="0.00"
                      value={scheduleForm.delivery_charge}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, delivery_charge: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fuel_cost">Fuel Cost (₹)</Label>
                    <Input
                      id="fuel_cost"
                      type="number"
                      placeholder="0.00"
                      value={scheduleForm.fuel_cost}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, fuel_cost: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="special_instructions">Special Instructions</Label>
                  <Textarea
                    id="special_instructions"
                    placeholder="Any special delivery instructions"
                    value={scheduleForm.special_instructions}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, special_instructions: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      // Validation
                      if (!scheduleForm.customer_id) {
                        toast({
                          title: "Validation Error",
                          description: "Please select a customer",
                          variant: "destructive",
                        })
                        return
                      }

                      if (!scheduleForm.delivery_address || scheduleForm.delivery_address.trim() === "") {
                        toast({
                          title: "Validation Error",
                          description: "Please enter delivery address",
                          variant: "destructive",
                        })
                        return
                      }

                      if (!scheduleForm.delivery_date) {
                        toast({
                          title: "Validation Error",
                          description: "Please select delivery date",
                          variant: "destructive",
                        })
                        return
                      }

                      // Call API to create delivery using simpler endpoint
                      const response = await fetch("/api/deliveries/create", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify({
                          customer_id: scheduleForm.customer_id,
                          booking_id: scheduleForm.booking_id || null,
                          booking_source: scheduleForm.booking_source || null,
                          delivery_type: scheduleForm.delivery_type,
                          pickup_address: scheduleForm.pickup_address,
                          delivery_address: scheduleForm.delivery_address,
                          delivery_date: scheduleForm.delivery_date,
                          delivery_time: scheduleForm.delivery_time || null,
                          driver_name: scheduleForm.driver_name,
                          vehicle_number: scheduleForm.vehicle_number,
                          assigned_staff_ids: Array.from(assignedStaffIds),
                          delivery_charge: scheduleForm.delivery_charge,
                          fuel_cost: scheduleForm.fuel_cost,
                          special_instructions: scheduleForm.special_instructions,
                        }),
                      })

                      if (!response.ok) {
                        const errorData = await response.json()
                        throw new Error(errorData.error || "Failed to schedule delivery")
                      }

                      const result = await response.json()

                      // Save pickup address to customer_addresses if it's new
                      if (scheduleForm.customer_id && scheduleForm.pickup_address.trim()) {
                        try {
                          const res = await fetch('/api/customer-addresses', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              customer_id: scheduleForm.customer_id,
                              full_address: scheduleForm.pickup_address.trim(),
                              address_line_1: scheduleForm.pickup_address.trim(),
                              address_type: 'pickup'
                            })
                          })
                          if (!res.ok) {
                            const error = await res.json()
                            console.warn('Could not save pickup address:', error)
                          }
                        } catch (e) {
                          console.warn('Could not save pickup address:', e)
                        }
                      }

                      toast({
                        title: "Success!",
                        description: `Delivery ${result.data.delivery_number} scheduled successfully`,
                      })

                      // Reset form
                      setScheduleForm({
                        customer_id: "",
                        booking_id: "",
                        booking_source: "",
                        delivery_type: "package_rental",
                        pickup_address: "",
                        delivery_address: "",
                        delivery_date: "",
                        delivery_time: "",
                        assigned_staff: "",
                        driver_name: "",
                        vehicle_number: "",
                        delivery_charge: "",
                        fuel_cost: "",
                        special_instructions: "",
                      })
                      setAssignedStaffIds(new Set())
                      setShowScheduleDialog(false)
                      
                      // Refresh deliveries list
                      await fetchData()
                    } catch (error: any) {
                      console.error("Error scheduling delivery:", error)
                      toast({
                        title: "Error",
                        description: error.message || "Failed to schedule delivery. Please try again.",
                        variant: "destructive",
                      })
                    }
                  }}
                >
                  Schedule Delivery
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deliveries</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deliveryOverview.totalDeliveries}</div>
            <p className="text-xs text-muted-foreground">All scheduled deliveries</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deliveryOverview.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting pickup</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deliveryOverview.inTransit}</div>
            <p className="text-xs text-muted-foreground">On the way</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deliveryOverview.delivered}</div>
            <p className="text-xs text-muted-foreground">Successfully delivered</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deliveryOverview.cancelled}</div>
            <p className="text-xs text-muted-foreground">Cancelled orders</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Deliveries & Returns */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => {
          setActiveTab(val)
          replaceQuery({ tab: val, action: null, delivery_id: null, return_id: null })
        }}
        className="space-y-4"
      >
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="deliveries" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Deliveries
          </TabsTrigger>
          <TabsTrigger value="returns" className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Returns
          </TabsTrigger>
        </TabsList>

        {/* DELIVERIES TAB */}
        <TabsContent value="deliveries" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search deliveries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={deliveryTypeFilter} onValueChange={setDeliveryTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="package_rental">Package Rental</SelectItem>
                <SelectItem value="product_rental">Product Rental</SelectItem>
                <SelectItem value="product_sale">Product Sale</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Deliveries Table */}
          <Card>
            <CardHeader>
              <CardTitle>📦 Delivery Orders</CardTitle>
              <CardDescription>Manage and track all delivery orders</CardDescription>
            </CardHeader>
            <CardContent>
          <div className="space-y-4">
            {tableNotFound ? (
              <div className="text-center py-12 bg-yellow-50 border border-yellow-200 rounded-lg">
                <Package className="mx-auto h-16 w-16 text-yellow-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Database Setup Required</h3>
                <p className="text-sm text-gray-600 mb-4 max-w-md mx-auto">
                  The deliveries table hasn't been created yet. Please run the migration to enable delivery tracking.
                </p>
                <div className="bg-white p-4 rounded border max-w-xl mx-auto text-left">
                  <p className="text-xs font-mono text-gray-800 mb-2">Run in Supabase SQL Editor:</p>
                  <code className="text-xs bg-gray-100 p-2 block rounded">
                    -- Paste contents of MIGRATION_DELIVERIES_TABLE.sql
                  </code>
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  See <code className="bg-gray-100 px-1 py-0.5 rounded">DELIVERIES_BACKEND_COMPLETE.md</code> for full instructions
                </p>
              </div>
            ) : loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg space-x-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-3 w-[300px]" />
                    </div>
                    <Skeleton className="h-8 w-[80px]" />
                  </div>
                ))}
              </div>
            ) : filteredDeliveries.length === 0 ? (
              <div className="text-center py-8">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No deliveries found</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by scheduling a new delivery.</p>
              </div>
            ) : (
              paginatedDeliveries.map((delivery) => {
                const { percentage, missing } = calculateCompleteness(delivery)
                
                return (
                  <div key={delivery.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4 flex-1">
                      {getStatusIcon(delivery.status)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium">{delivery.delivery_number}</p>
                          <Badge className={getStatusColor(delivery.status)}>{delivery.status}</Badge>
                          
                          {/* Completeness Indicator */}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center space-x-2 ml-2">
                                  <Badge variant="outline" className={getCompletenessColor(percentage)}>
                                    {percentage}% Complete
                                  </Badge>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <div className="space-y-2">
                                  <p className="font-semibold text-sm">Delivery Completeness</p>
                                  <Progress value={percentage} className="h-2" />
                                  {missing.length > 0 ? (
                                    <div>
                                      <p className="text-xs font-medium mb-1">Missing fields:</p>
                                      <ul className="text-xs list-disc list-inside">
                                        {missing.map((field) => (
                                          <li key={field}>{field}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  ) : (
                                    <p className="text-xs text-green-600">✓ All fields complete!</p>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {delivery.customer_name} • {delivery.driver_name} • ₹{delivery.total_amount}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Delivery: {delivery.delivery_date}
                          {(() => {
                          const ret = getCurrentReturnISO(delivery)
                          if (!ret) return null
                          try {
                            const d = new Date(ret)
                            return ` • Return: ${d.toLocaleDateString()} ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`
                          } catch {
                            return ` • Return: ${ret}`
                          }
                        })()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {delivery.status === "pending" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={updatingStatus.has(delivery.id)}
                          onClick={() => handleStartTransit(delivery.id)}
                        >
                          {updatingStatus.has(delivery.id) ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4 mr-1" />
                          )}
                          Start Transit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={updatingStatus.has(delivery.id)}
                          onClick={() => handleCancelDelivery(delivery.id)}
                        >
                          {updatingStatus.has(delivery.id) ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Ban className="h-4 w-4 mr-1" />
                          )}
                          Cancel
                        </Button>
                      </>
                    )}
                    {delivery.status === "in_transit" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={updatingStatus.has(delivery.id)}
                          onClick={() => handleMarkDelivered(delivery.id)}
                        >
                          {updatingStatus.has(delivery.id) ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-1" />
                          )}
                          Mark Delivered
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={updatingStatus.has(delivery.id)}
                          onClick={() => handleCancelDelivery(delivery.id)}
                        >
                          {updatingStatus.has(delivery.id) ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Ban className="h-4 w-4 mr-1" />
                          )}
                          Cancel
                        </Button>
                      </>
                    )}
                    {delivery.status === "delivered" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedDelivery(delivery)
                          setShowHandoverDialog(true)
                          replaceQuery({ tab: "deliveries", action: "handover", delivery_id: delivery.id })
                        }}
                      >
                        <Package className="h-4 w-4 mr-1" />
                        Capture Handover
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedDelivery(delivery)
                        setShowViewDialog(true)
                        replaceQuery({ tab: "deliveries", action: "view", delivery_id: delivery.id })
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        setSelectedDelivery(delivery)
                        
                        // If delivery has no date/time but has a linked booking, fetch from booking
                        let deliveryDate = delivery.delivery_date
                        let deliveryTime = delivery.delivery_time || ""
                        let deliveryAddress = delivery.delivery_address
                        
                        if (delivery.booking_id && (!deliveryDate || !deliveryTime)) {
                          // Fetch booking details to get date/time
                          const linkedBooking = bookings.find((b: any) => 
                            b.id === delivery.booking_id && b.source === delivery.booking_source
                          )
                          
                          if (linkedBooking) {
                            // Use booking's delivery_date and delivery_time if not set in delivery
                            deliveryDate = deliveryDate || linkedBooking.delivery_date || ""
                            deliveryTime = deliveryTime || linkedBooking.delivery_time || ""
                            deliveryAddress = deliveryAddress || linkedBooking.delivery_address || ""
                          }
                        }
                        
                        setEditForm({
                          customer_name: delivery.customer_name,
                          customer_phone: delivery.customer_phone,
                          customer_id: delivery.customer_id || "",
                          pickup_address: delivery.pickup_address,
                          delivery_address: deliveryAddress,
                          delivery_date: deliveryDate,
                          delivery_time: deliveryTime,
                          driver_name: delivery.driver_name,
                          vehicle_number: delivery.vehicle_number,
                          delivery_charge: delivery.delivery_charge.toString(),
                          fuel_cost: delivery.fuel_cost.toString(),
                          special_instructions: delivery.special_instructions,
                        })
                        
                        // Fetch saved addresses for this customer
                        if (delivery.customer_id) {
                          setLoadingAddresses(true)
                          try {
                            const { data, error } = await supabase
                              .from('customer_addresses')
                              .select('*')
                              .eq('customer_id', delivery.customer_id)
                              .order('last_used_at', { ascending: false })
                              .limit(10)
                            
                            if (!error && data) {
                              setSavedAddresses(data)
                            }
                          } catch (e) {
                            console.warn('Saved addresses not available yet')
                          } finally {
                            setLoadingAddresses(false)
                          }
                        }
                        
                        setShowEditDialog(true)
                        replaceQuery({ tab: "deliveries", action: "edit", delivery_id: delivery.id })
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })
            )}
          </div>
        </CardContent>
        
        {/* Pagination Controls */}
        {filteredDeliveries.length > 0 && (
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, filteredDeliveries.length)} of{" "}
                  {filteredDeliveries.length} deliveries
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Items per page:</span>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                      setItemsPerPage(Number(value))
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger className="w-[70px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="text-sm font-medium">
                  Page {currentPage} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
        </TabsContent>

        {/* RETURNS TAB */}
        <TabsContent value="returns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>🔄 Returns Processing</CardTitle>
              <CardDescription>Process returns and update inventory for damaged, lost, or stolen items</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {returns.length === 0 ? (
                  <div className="text-center py-12">
                    <PackageCheck className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Returns Pending</h3>
                    <p className="text-sm text-gray-600 max-w-md mx-auto">
                      Returns are automatically created when rental deliveries are marked as delivered. They will appear here for processing.
                    </p>
                  </div>
                ) : (
                  returns.map((returnItem) => {
                    const plannedISO = returnItem.booking?.return_date || returnItem.return_date
                    const returnDate = plannedISO ? new Date(plannedISO) : null
                    const isOverdue = returnDate && returnDate < new Date()
                    const isRescheduled = !!(returnItem.booking?.return_date && returnItem.booking.return_date !== returnItem.return_date)
                    
                    return (
                      <div 
                        key={returnItem.id} 
                        className={`flex items-center justify-between p-4 border rounded-lg ${
                          isOverdue ? 'border-red-300 bg-red-50' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center space-x-4 flex-1">
                          <div className={`p-2 rounded-full ${isOverdue ? 'bg-red-100' : 'bg-blue-100'}`}>
                            {isOverdue ? (
                              <XCircle className="h-5 w-5 text-red-600" />
                            ) : (
                              <RotateCcw className="h-5 w-5 text-blue-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">{returnItem.return_number}</p>
                              {isOverdue && (
                                <Badge variant="destructive" className="text-xs">⚠️ Overdue</Badge>
                              )}
                              {isRescheduled && (
                                <Badge className="bg-blue-100 text-blue-800 text-xs">Rescheduled</Badge>
                              )}
                              <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                                {returnItem.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Delivery: {returnItem.delivery_number} • Customer: {returnItem.customer_name}
                            </p>
                            <div className="flex items-center gap-4 mt-2">
                              <p className="text-xs text-muted-foreground">
                                � {returnItem.total_items} item(s)
                              </p>
                              {returnDate && (
                                <p className={`text-xs font-medium ${isOverdue ? 'text-red-700' : 'text-gray-700'}`}>
                                  🔄 Return: {returnDate.toLocaleDateString()} at {returnDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {returnItem.booking_id && returnItem.booking_source && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Create a delivery-like object for the reschedule logic
                                const deliveryLike = {
                                  id: returnItem.delivery_id || returnItem.id,
                                  booking_id: returnItem.booking_id,
                                  booking_source: returnItem.booking_source,
                                  rescheduled_return_at: returnItem.booking?.return_date || returnItem.return_date,
                                }
                                setSelectedDelivery(deliveryLike as any)

                                // Pre-fill with current return date
                                const currentISO = returnItem.booking?.return_date || returnItem.return_date
                                let date = ""
                                let time = "18:00"
                                if (currentISO) {
                                  const d = new Date(currentISO)
                                  if (!Number.isNaN(d.getTime())) {
                                    date = d.toISOString().slice(0, 10)
                                    const hh = String(d.getHours()).padStart(2, "0")
                                    const mm = String(d.getMinutes()).padStart(2, "0")
                                    time = `${hh}:${mm}`
                                  }
                                }
                                setRescheduleForm({ date, time })
                                setShowRescheduleDialog(true)
                                // Deep link into this reschedule view
                                replaceQuery({ tab: "returns", action: "reschedule", return_id: returnItem.id })
                              }}
                            >
                              <CalendarClock className="h-4 w-4 mr-1" />
                              Reschedule Return
                            </Button>
                          )}
                          <Button
                            variant={isOverdue ? "destructive" : "default"}
                            size="sm"
                            onClick={() => {
                              setSelectedReturn(returnItem)
                              setShowReturnDialog(true)
                              replaceQuery({ tab: "returns", action: "process", return_id: returnItem.id })
                            }}
                          >
                            <PackageCheck className="h-4 w-4 mr-1" />
                            Process Return
                          </Button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Dialog */}
      <Dialog
        open={showViewDialog}
        onOpenChange={(open) => {
          setShowViewDialog(open)
          if (!open) clearActionParams()
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Delivery Details</DialogTitle>
            <DialogDescription>View complete delivery information</DialogDescription>
          </DialogHeader>
          {selectedDelivery && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Delivery Number</Label>
                  <p className="text-sm">{selectedDelivery.delivery_number}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(selectedDelivery.status)}
                    <Badge className={getStatusColor(selectedDelivery.status)}>{selectedDelivery.status}</Badge>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Customer</Label>
                  <p className="text-sm">{selectedDelivery.customer_name}</p>
                  <p className="text-xs text-muted-foreground">{selectedDelivery.customer_phone}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Driver</Label>
                  <p className="text-sm">{selectedDelivery.driver_name}</p>
                  <p className="text-xs text-muted-foreground">{selectedDelivery.vehicle_number}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Pickup Address</Label>
                <p className="text-sm">{selectedDelivery.pickup_address}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Delivery Address</Label>
                <p className="text-sm">{selectedDelivery.delivery_address}</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Delivery Charge</Label>
                  <p className="text-sm">₹{selectedDelivery.delivery_charge}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Fuel Cost</Label>
                  <p className="text-sm">₹{selectedDelivery.fuel_cost}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Total Amount</Label>
                  <p className="text-sm font-semibold">₹{selectedDelivery.total_amount}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Special Instructions</Label>
                <p className="text-sm">{selectedDelivery.special_instructions || "None"}</p>
              </div>

              {/* Package Details Section */}
              {deliveryPackage && (
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 rounded-lg p-4 mt-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <Label className="text-sm font-bold text-orange-900 mb-1 block">📦 PACKAGE</Label>
                      <h3 className="font-bold text-lg text-orange-900">{deliveryPackage.name}</h3>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="text-orange-700 font-medium">Price:</span>
                      <p className="font-semibold text-lg text-orange-900">₹{deliveryPackage.base_price || 0}</p>
                    </div>
                    <div>
                      <span className="text-orange-700 font-medium">Deposit:</span>
                      <p className="font-semibold text-lg text-orange-900">₹{deliveryPackage.security_deposit || 0}</p>
                    </div>
                    <div>
                      <span className="text-orange-700 font-medium">Category:</span>
                      <p className="font-semibold text-lg text-orange-900">{deliveryPackage.category_id || "N/A"}</p>
                    </div>
                  </div>
                  {deliveryPackage.inclusions && deliveryPackage.inclusions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-orange-200">
                      <span className="text-orange-700 font-medium text-sm">Inclusions:</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {deliveryPackage.inclusions.map((item: string, idx: number) => (
                          <span key={idx} className="text-xs bg-white px-2 py-1 rounded border border-orange-200 text-orange-900">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Selected Products Section */}
              <div className="border-t pt-4 mt-2">
                <Label className="text-sm font-medium mb-3 block">📦 Products to Deliver</Label>
                {loadingDeliveryItems ? (
                  <div className="text-sm text-muted-foreground">Loading products...</div>
                ) : deliveryItems.length > 0 ? (
                  <div className="space-y-2">
                    {deliveryItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-200">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{item.product_name || `Product ${item.product_id}`}</div>
                          {item.barcode && <div className="text-xs text-muted-foreground">Barcode: {item.barcode}</div>}
                          {item.category && <div className="text-xs text-muted-foreground">Category: {item.category}</div>}
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-sm">Qty: <span className="text-lg text-blue-600">{item.quantity}</span></div>
                          <div className="text-xs text-muted-foreground">₹{item.unit_price || 0} each</div>
                        </div>
                      </div>
                    ))}
                    <div className="mt-3 pt-2 border-t">
                      <div className="text-sm font-medium">
                        Total Items: <span className="text-lg text-green-600">{deliveryItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground italic">No products found for this delivery</div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={showEditDialog}
        onOpenChange={(open) => {
          setShowEditDialog(open)
          if (!open) clearActionParams()
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Delivery</DialogTitle>
            <DialogDescription>Update delivery information</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_customer_name">Customer Name</Label>
                <Input
                  id="edit_customer_name"
                  value={editForm.customer_name}
                  onChange={(e) => setEditForm({ ...editForm, customer_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_customer_phone">Customer Phone</Label>
                <Input
                  id="edit_customer_phone"
                  value={editForm.customer_phone}
                  onChange={(e) => setEditForm({ ...editForm, customer_phone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_pickup_address">Pickup Address</Label>
              
              {/* Smart Address Dropdown - Only for Pickup */}
              {savedAddresses.length > 0 && (
                <Select
                  onValueChange={(value) => {
                    if (value === 'new') {
                      setEditForm({ ...editForm, pickup_address: '' })
                    } else if (value === 'current') {
                      // Keep current value
                    } else {
                      const selected = savedAddresses.find(a => a.id === value)
                      if (selected) {
                        setEditForm({ ...editForm, pickup_address: selected.full_address })
                      }
                    }
                  }}
                >
                  <SelectTrigger className="mb-2">
                    <SelectValue placeholder="📍 Quick Select from Saved Addresses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current">Use Current Address</SelectItem>
                    <SelectItem value="new">✏️ Type New Address</SelectItem>
                    {savedAddresses.map(addr => (
                      <SelectItem key={addr.id} value={addr.id}>
                        {addr.label ? `${addr.label}: ` : ''}{addr.full_address.substring(0, 50)}{addr.full_address.length > 50 ? '...' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              <Textarea
                id="edit_pickup_address"
                placeholder="Enter pickup address or select from saved addresses above"
                value={editForm.pickup_address}
                onChange={(e) => setEditForm({ ...editForm, pickup_address: e.target.value })}
              />
              {loadingAddresses && (
                <p className="text-xs text-muted-foreground">Loading saved addresses...</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_delivery_address">Delivery Address</Label>
              <Textarea
                id="edit_delivery_address"
                value={editForm.delivery_address}
                onChange={(e) => setEditForm({ ...editForm, delivery_address: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_delivery_date">Delivery Date</Label>
                <Input
                  id="edit_delivery_date"
                  type="date"
                  value={editForm.delivery_date}
                  onChange={(e) => setEditForm({ ...editForm, delivery_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_delivery_time">Delivery Time</Label>
                <Input
                  id="edit_delivery_time"
                  type="time"
                  value={editForm.delivery_time}
                  onChange={(e) => setEditForm({ ...editForm, delivery_time: e.target.value })}
                  placeholder="HH:MM"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_driver_name">Driver Name</Label>
                <Input
                  id="edit_driver_name"
                  value={editForm.driver_name}
                  onChange={(e) => setEditForm({ ...editForm, driver_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_vehicle_number">Vehicle Number</Label>
                <Input
                  id="edit_vehicle_number"
                  value={editForm.vehicle_number}
                  onChange={(e) => setEditForm({ ...editForm, vehicle_number: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Assign Staff</Label>
              <div className="border rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto bg-gray-50">
                {staff.length > 0 ? (
                  staff.map((member) => (
                    <div key={member.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`edit_staff_${member.id}`}
                        checked={editAssignedStaffIds.has(member.id)}
                        onChange={(e) => {
                          const newSet = new Set(editAssignedStaffIds)
                          if (e.target.checked) {
                            newSet.add(member.id)
                          } else {
                            newSet.delete(member.id)
                          }
                          setEditAssignedStaffIds(newSet)
                        }}
                        className="rounded"
                      />
                      <label htmlFor={`edit_staff_${member.id}`} className="text-sm cursor-pointer flex-1">
                        {member.name}
                      </label>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No staff members available</p>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Selected: {editAssignedStaffIds.size} staff member{editAssignedStaffIds.size !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_delivery_charge">Delivery Charge (₹)</Label>
                <Input
                  id="edit_delivery_charge"
                  type="number"
                  value={editForm.delivery_charge}
                  onChange={(e) => setEditForm({ ...editForm, delivery_charge: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_fuel_cost">Fuel Cost (₹)</Label>
                <Input
                  id="edit_fuel_cost"
                  type="number"
                  value={editForm.fuel_cost}
                  onChange={(e) => setEditForm({ ...editForm, fuel_cost: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_special_instructions">Special Instructions</Label>
              <Textarea
                id="edit_special_instructions"
                value={editForm.special_instructions}
                onChange={(e) => setEditForm({ ...editForm, special_instructions: e.target.value })}
              />
            </div>

            {/* Package Details Section in Edit Dialog */}
            {deliveryPackage && (
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 rounded-lg p-4 mt-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <Label className="text-sm font-bold text-orange-900 mb-1 block">📦 PACKAGE</Label>
                    <h3 className="font-bold text-lg text-orange-900">{deliveryPackage.name}</h3>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="text-orange-700 font-medium">Price:</span>
                    <p className="font-semibold text-lg text-orange-900">₹{deliveryPackage.base_price || 0}</p>
                  </div>
                  <div>
                    <span className="text-orange-700 font-medium">Deposit:</span>
                    <p className="font-semibold text-lg text-orange-900">₹{deliveryPackage.security_deposit || 0}</p>
                  </div>
                  <div>
                    <span className="text-orange-700 font-medium">Category:</span>
                    <p className="font-semibold text-lg text-orange-900">{deliveryPackage.category_id || "N/A"}</p>
                  </div>
                </div>
                {deliveryPackage.inclusions && deliveryPackage.inclusions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-orange-200">
                    <span className="text-orange-700 font-medium text-sm">Inclusions:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {deliveryPackage.inclusions.map((item: string, idx: number) => (
                        <span key={idx} className="text-xs bg-white px-2 py-1 rounded border border-orange-200 text-orange-900">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Products Section in Edit Dialog */}
            <div className="border-t pt-4 mt-2 space-y-2">
              <Label className="text-sm font-medium">📦 Products to Deliver</Label>
              {loadingDeliveryItems ? (
                <div className="text-sm text-muted-foreground">Loading products...</div>
              ) : deliveryItems.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {deliveryItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-200">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{item.product_name || `Product ${item.product_id}`}</div>
                        {item.barcode && <div className="text-xs text-muted-foreground">Barcode: {item.barcode}</div>}
                        {item.category && <div className="text-xs text-muted-foreground">Category: {item.category}</div>}
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-sm">Qty: <span className="text-lg text-blue-600">{item.quantity}</span></div>
                        <div className="text-xs text-muted-foreground">₹{item.unit_price || 0}</div>
                      </div>
                    </div>
                  ))}
                  <div className="mt-3 pt-2 border-t">
                    <div className="text-sm font-medium">
                      Total Items: <span className="text-lg text-green-600">{deliveryItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground italic">No products found for this delivery</div>
              )}
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button
              disabled={loading}
              onClick={async () => {
                if (!selectedDelivery) return

                setLoading(true)
                try {
                  console.log('[Update Delivery] Sending update for:', selectedDelivery.id)
                  console.log('[Update Delivery] Staff IDs:', Array.from(editAssignedStaffIds))
                  
                  const response = await fetch(`/api/deliveries/update`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                      id: selectedDelivery.id,
                      pickup_address: editForm.pickup_address,
                      delivery_address: editForm.delivery_address,
                      delivery_date: editForm.delivery_date,
                      delivery_time: editForm.delivery_time || null,
                      driver_name: editForm.driver_name,
                      vehicle_number: editForm.vehicle_number,
                      delivery_charge: editForm.delivery_charge,
                      fuel_cost: editForm.fuel_cost,
                      special_instructions: editForm.special_instructions,
                      assigned_staff_ids: Array.from(editAssignedStaffIds),
                    }),
                  })

                  if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}))
                    console.error('[Update Delivery] Error:', errorData)
                    throw new Error(errorData.error || "Failed to update delivery")
                  }

                  // Save pickup address to customer_addresses if it's new
                  if (editForm.customer_id && editForm.pickup_address.trim()) {
                    try {
                      const res = await fetch('/api/customer-addresses', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          customer_id: editForm.customer_id,
                          full_address: editForm.pickup_address.trim(),
                          address_line_1: editForm.pickup_address.trim(),
                          address_type: 'pickup'
                        })
                      })
                      if (!res.ok) {
                        const error = await res.json()
                        console.warn('Could not save pickup address:', error)
                      }
                    } catch (e) {
                      console.warn('Could not save pickup address:', e)
                    }
                  }

                  // Close dialog and clear query params FIRST before refreshing data
                  setShowEditDialog(false)
                  clearActionParams()
                  
                  // Then refresh data
                  await fetchData()
                  
                  toast({
                    title: "Success",
                    description: "Delivery order updated successfully",
                  })
                } catch (error: any) {
                  console.error('[Update Delivery] Failed:', error)
                  toast({
                    title: "Error",
                    description: error.message || "Failed to update delivery",
                    variant: "destructive",
                  })
                } finally {
                  setLoading(false)
                }
              }}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Update Delivery
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Unified Handover Dialog - Now with photo, signature, and full categorization */}
      <UnifiedHandoverDialog
        open={showHandoverDialog}
        onClose={() => { setShowHandoverDialog(false); clearActionParams() }}
        delivery={selectedDelivery}
        onSaved={() => fetchData()}
      />

      {/* Reschedule Return Dialog */}
      <Dialog
        open={showRescheduleDialog}
        onOpenChange={(open) => {
          setShowRescheduleDialog(open)
          if (!open) clearActionParams()
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reschedule Return</DialogTitle>
            <DialogDescription>
              Set a new pickup/return date and time for the linked booking. If you leave it empty, we'll keep the original
              booking return.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reschedule_date">Return Date</Label>
                <Input
                  id="reschedule_date"
                  type="date"
                  value={rescheduleForm.date}
                  onChange={(e) => setRescheduleForm((f) => ({ ...f, date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reschedule_time">Return Time</Label>
                <Input
                  id="reschedule_time"
                  type="time"
                  value={rescheduleForm.time}
                  onChange={(e) => setRescheduleForm((f) => ({ ...f, time: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowRescheduleDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!selectedDelivery?.booking_id || !selectedDelivery.booking_source) {
                  toast({ title: "No booking linked", description: "This delivery doesn't have a linked booking." })
                  return
                }
                if (!rescheduleForm.date) {
                  toast({ title: "Date required", description: "Please choose a return date.", variant: "destructive" })
                  return
                }
                try {
                  const iso = (() => {
                    const d = new Date(`${rescheduleForm.date}T${rescheduleForm.time || "00:00"}:00`)
                    return d.toISOString()
                  })()
                  const resp = await fetch(
                    `/api/bookings/${selectedDelivery.booking_id}?type=${selectedDelivery.booking_source}`,
                    {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ return_date: iso }),
                    }
                  )
                  if (!resp.ok) {
                    const err = await resp.json().catch(() => ({}))
                    throw new Error(err?.error || `Failed with ${resp.status}`)
                  }
                  // Update local deliveries list with rescheduled time
                  setDeliveries((prev) =>
                    prev.map((d) => (d.id === selectedDelivery.id ? { ...d, rescheduled_return_at: iso } : d))
                  )
                  // Also update local bookings list for immediate UI consistency
                  setBookings((prev) =>
                    (prev || []).map((b: any) =>
                      b.id === selectedDelivery.booking_id ? { ...b, pickup_date: iso, return_date: iso } : b
                    )
                  )
                  // Update returns list so the "Returns" tab reflects the new plan immediately
                  setReturns((prev) =>
                    (prev || []).map((r: any) =>
                      r.booking_id === selectedDelivery.booking_id
                        ? { ...r, booking: { ...(r.booking || {}), return_date: iso } }
                        : r
                    )
                  )
                  toast({ title: "Return rescheduled", description: "Return date/time updated successfully." })
                  // Close the dialog immediately for better UX, then refresh in background
                  setShowRescheduleDialog(false)
                  clearActionParams()
                  // Refresh server data to keep everything in sync (IDs, related fields, badges)
                  void fetchData()
                } catch (e: any) {
                  console.error("Reschedule failed:", e)
                  toast({ title: "Error", description: e?.message || "Failed to reschedule", variant: "destructive" })
                }
              }}
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Return Processing Dialog */}
      {selectedReturn && (
        <ReturnProcessingDialog
          open={showReturnDialog}
          onClose={() => {
            setShowReturnDialog(false)
            setSelectedReturn(null)
            clearActionParams()
          }}
          returnRecord={selectedReturn}
          onSuccess={async () => {
            setShowReturnDialog(false)
            setSelectedReturn(null)
            await fetchData()
            toast({
              title: "Success",
              description: "Return processed successfully. Inventory has been updated.",
            })
          }}
        />
      )}
    </div>
  )
}
