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
import { Search, Plus, Truck, Package, Clock, CheckCircle, XCircle, Eye, Edit, ArrowLeft, CalendarClock, Loader2, RotateCcw, PackageCheck } from "lucide-react"
import { useRouter } from "next/navigation"

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
  customer_name: string
  customer_phone: string
  pickup_address: string
  delivery_address: string
  delivery_date: string
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
  const [activeTab, setActiveTab] = useState("deliveries")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false)
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null)
  const [editForm, setEditForm] = useState({
    customer_name: "",
    customer_phone: "",
    pickup_address: "",
    delivery_address: "",
    delivery_date: "",
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
    delivery_type: "standard",
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
      // Fetch customers
      const { data: customersData, error: customersError } = await supabase.from("customers").select("*").order("name")

      if (customersError) {
        console.warn("Error fetching customers:", customersError)
        setCustomers([])
      } else {
        setCustomers(customersData || [])
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

      // Fetch staff (optional - table may not exist)
      try {
        const { data: staffData, error: staffError } = await supabase
          .from("staff")
          .select("*, franchise:franchises(name)")
          .eq("is_active", true)
          .order("name")

        if (staffError) {
          console.warn("Staff table not available:", staffError.message)
          setStaff([])
        } else {
          setStaff(staffData || [])
        }
      } catch (e) {
        console.warn("Staff feature not available")
        setStaff([])
      }

      // Fetch deliveries from API
      try {
        const deliveriesRes = await fetch("/api/deliveries", { cache: "no-store" })
        
        if (!deliveriesRes.ok) {
          const errorData = await deliveriesRes.json().catch(() => ({}))
          console.warn("Deliveries API error:", errorData.error || deliveriesRes.statusText)
          
          // If table doesn't exist, show helpful message
          if (deliveriesRes.status === 500 || deliveriesRes.status === 404) {
            console.info("💡 Run MIGRATION_DELIVERIES_TABLE.sql to create the deliveries table")
            setTableNotFound(true)
            setDeliveries([])
            setLoading(false)
            return
          }
        } else {
          setTableNotFound(false)
          const deliveriesJson = await deliveriesRes.json()
          
          // Map API response to UI format
          const mappedDeliveries = (deliveriesJson?.data || []).map((d: any) => ({
            id: d.id,
            delivery_number: d.delivery_number,
            customer_name: d.customer?.name || "Unknown",
            customer_phone: d.customer?.phone || "",
            pickup_address: d.pickup_address || "",
            delivery_address: d.delivery_address,
            delivery_date: d.delivery_date,
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

    return matchesSearch && matchesStatus
  })

  const paginatedDeliveries = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredDeliveries.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredDeliveries, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredDeliveries.length / itemsPerPage)

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter])

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
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 relative">
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm">
          <div className="flex items-center gap-3 text-gray-700">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading deliveries…</span>
          </div>
        </div>
      )}
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
                        setScheduleForm({ ...scheduleForm, customer_id: value, booking_id: "", booking_source: "" })
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
                        setScheduleForm({ ...scheduleForm, booking_id: id, booking_source: source })
                        // Auto-fill customer from booking if available
                        const selectedBooking = bookings.find((b: any) => b.id === id)
                        if (selectedBooking?.customer_id && !scheduleForm.customer_id) {
                          setScheduleForm((prev) => ({ ...prev, customer_id: selectedBooking.customer_id }))
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
                          value="standard"
                          className="cursor-pointer pl-8 pr-3 py-2.5 mb-1 hover:bg-gray-100 focus:bg-blue-50 data-[state=checked]:bg-blue-100 data-[state=checked]:text-blue-900 transition-colors rounded-sm relative"
                        >
                          <span className="font-medium">Standard Delivery</span>
                        </SelectItem>
                        <SelectItem 
                          value="express"
                          className="cursor-pointer pl-8 pr-3 py-2.5 mb-1 hover:bg-gray-100 focus:bg-blue-50 data-[state=checked]:bg-blue-100 data-[state=checked]:text-blue-900 transition-colors rounded-sm relative"
                        >
                          <span className="font-medium">Express Delivery</span>
                        </SelectItem>
                        <SelectItem 
                          value="same_day"
                          className="cursor-pointer pl-8 pr-3 py-2.5 mb-1 hover:bg-gray-100 focus:bg-blue-50 data-[state=checked]:bg-blue-100 data-[state=checked]:text-blue-900 transition-colors rounded-sm relative"
                        >
                          <span className="font-medium">Same Day Delivery</span>
                        </SelectItem>
                        <SelectItem 
                          value="scheduled"
                          className="cursor-pointer pl-8 pr-3 py-2.5 mb-1 hover:bg-gray-100 focus:bg-blue-50 data-[state=checked]:bg-blue-100 data-[state=checked]:text-blue-900 transition-colors rounded-sm relative"
                        >
                          <span className="font-medium">Scheduled Delivery</span>
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
                  <Textarea
                    id="pickup_address"
                    placeholder="Enter pickup address"
                    value={scheduleForm.pickup_address}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, pickup_address: e.target.value })}
                  />
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

                      // Call API to create delivery
                      // Ensure assigned_staff_id is a valid UUID; otherwise send null
                      const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
                      const safeAssignedStaff = uuidRegex.test(scheduleForm.assigned_staff) ? scheduleForm.assigned_staff : null

                      const response = await fetch("/api/deliveries", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
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
                          assigned_staff_id: safeAssignedStaff,
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

                      toast({
                        title: "Success!",
                        description: `Delivery ${result.data.delivery_number} scheduled successfully`,
                      })

                      // Reset form
                      setScheduleForm({
                        customer_id: "",
                        booking_id: "",
                        booking_source: "",
                        delivery_type: "standard",
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
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
            ) : filteredDeliveries.length === 0 ? (
              <div className="text-center py-8">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No deliveries found</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by scheduling a new delivery.</p>
              </div>
            ) : (
              paginatedDeliveries.map((delivery) => (
                <div key={delivery.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(delivery.status)}
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium">{delivery.delivery_number}</p>
                        <Badge className={getStatusColor(delivery.status)}>{delivery.status}</Badge>
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
                            return ` • Return: ${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
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
                          onClick={async () => {
                            try {
                              const response = await fetch(`/api/deliveries/${delivery.id}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ status: "in_transit" }),
                              })
                              
                              if (!response.ok) throw new Error("Failed to update status")
                              
                              await fetchData()
                              toast({
                                title: "Status Updated",
                                description: `Order ${delivery.delivery_number} is now in transit`,
                              })
                            } catch (error) {
                              toast({
                                title: "Error",
                                description: "Failed to update status",
                                variant: "destructive",
                              })
                            }
                          }}
                        >
                          <Truck className="h-4 w-4 mr-1" />
                          Start Transit
                        </Button>
                      </>
                    )}
                    {delivery.status === "in_transit" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            try {
                              const response = await fetch(`/api/deliveries/${delivery.id}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ status: "delivered" }),
                              })
                              
                              if (!response.ok) throw new Error("Failed to update status")
                              
                              await fetchData()
                              toast({
                                title: "Status Updated",
                                description: `Order ${delivery.delivery_number} marked as delivered`,
                              })
                            } catch (error) {
                              toast({
                                title: "Error",
                                description: "Failed to update status",
                                variant: "destructive",
                              })
                            }
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Mark Delivered
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={async () => {
                            try {
                              const response = await fetch(`/api/deliveries/${delivery.id}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ status: "cancelled" }),
                              })
                              
                              if (!response.ok) throw new Error("Failed to update status")
                              
                              await fetchData()
                              toast({
                                title: "Status Updated",
                                description: `Order ${delivery.delivery_number} has been cancelled`,
                              })
                            } catch (error) {
                              toast({
                                title: "Error",
                                description: "Failed to update status",
                                variant: "destructive",
                              })
                            }
                          }}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedDelivery(delivery)
                        setShowViewDialog(true)
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {delivery.booking_id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedDelivery(delivery)
                          // Pre-fill with current (rescheduled or original) return
                          const currentISO = getCurrentReturnISO(delivery)
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
                        }}
                      >
                        <CalendarClock className="h-4 w-4 mr-1" />
                        Reschedule Return
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedDelivery(delivery)
                        setEditForm({
                          customer_name: delivery.customer_name,
                          customer_phone: delivery.customer_phone,
                          pickup_address: delivery.pickup_address,
                          delivery_address: delivery.delivery_address,
                          delivery_date: delivery.delivery_date,
                          driver_name: delivery.driver_name,
                          vehicle_number: delivery.vehicle_number,
                          delivery_charge: delivery.delivery_charge.toString(),
                          fuel_cost: delivery.fuel_cost.toString(),
                          special_instructions: delivery.special_instructions,
                        })
                        setShowEditDialog(true)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
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
              <CardTitle>🔄 Returns Management</CardTitle>
              <CardDescription>Track and schedule product returns from completed deliveries</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(() => {
                  // Filter deliveries that have been delivered and have linked bookings (potential returns)
                  const returnsData = deliveries
                    .filter(d => d.booking_id && d.status === 'delivered')
                    .map(delivery => {
                      const booking = bookingsById.get(delivery.booking_id!)
                      const returnDate = getCurrentReturnISO(delivery)
                      const returnDateObj = returnDate ? new Date(returnDate) : null
                      const isOverdue = returnDateObj && returnDateObj < new Date()
                      
                      return {
                        delivery,
                        booking,
                        returnDate,
                        returnDateObj,
                        isOverdue,
                        canReschedule: true
                      }
                    })
                    .sort((a, b) => {
                      // Sort by return date (overdue first, then by date)
                      if (a.isOverdue && !b.isOverdue) return -1
                      if (!a.isOverdue && b.isOverdue) return 1
                      if (!a.returnDateObj) return 1
                      if (!b.returnDateObj) return -1
                      return a.returnDateObj.getTime() - b.returnDateObj.getTime()
                    })

                  if (returnsData.length === 0) {
                    return (
                      <div className="text-center py-12">
                        <PackageCheck className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Returns Pending</h3>
                        <p className="text-sm text-gray-600 max-w-md mx-auto">
                          Returns will appear here after deliveries are completed. Link bookings to deliveries to track returns.
                        </p>
                      </div>
                    )
                  }

                  return returnsData.map(({ delivery, booking, returnDate, returnDateObj, isOverdue }) => (
                    <div 
                      key={delivery.id} 
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
                            <p className="font-medium">{delivery.customer_name}</p>
                            {isOverdue && (
                              <Badge variant="destructive" className="text-xs">⚠️ Overdue</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Delivery: {delivery.delivery_number}
                            {booking && ` • Booking: ${booking.booking_number}`}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <p className="text-xs text-muted-foreground">
                              📍 {delivery.delivery_address}
                            </p>
                            {returnDateObj && (
                              <p className={`text-xs font-medium ${isOverdue ? 'text-red-700' : 'text-gray-700'}`}>
                                🔄 Return: {returnDateObj.toLocaleDateString()} at {returnDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedDelivery(delivery)
                            if (returnDateObj) {
                              const dateStr = returnDateObj.toISOString().split('T')[0]
                              const timeStr = returnDateObj.toTimeString().slice(0, 5)
                              setRescheduleForm({ date: dateStr, time: timeStr })
                            } else {
                              setRescheduleForm({ date: '', time: '18:00' })
                            }
                            setShowRescheduleDialog(true)
                          }}
                          className="flex items-center gap-1"
                        >
                          <CalendarClock className="h-4 w-4" />
                          Reschedule
                        </Button>
                        <Button
                          variant={isOverdue ? "destructive" : "default"}
                          size="sm"
                          onClick={() => {
                            // Open view dialog to see full details
                            setSelectedDelivery(delivery)
                            setShowViewDialog(true)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  ))
                })()}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
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
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
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
              <Textarea
                id="edit_pickup_address"
                value={editForm.pickup_address}
                onChange={(e) => setEditForm({ ...editForm, pickup_address: e.target.value })}
              />
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
                <Label htmlFor="edit_driver_name">Driver Name</Label>
                <Input
                  id="edit_driver_name"
                  value={editForm.driver_name}
                  onChange={(e) => setEditForm({ ...editForm, driver_name: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_vehicle_number">Vehicle Number</Label>
                <Input
                  id="edit_vehicle_number"
                  value={editForm.vehicle_number}
                  onChange={(e) => setEditForm({ ...editForm, vehicle_number: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_delivery_charge">Delivery Charge (₹)</Label>
                <Input
                  id="edit_delivery_charge"
                  type="number"
                  value={editForm.delivery_charge}
                  onChange={(e) => setEditForm({ ...editForm, delivery_charge: e.target.value })}
                />
              </div>
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
            <div className="space-y-2">
              <Label htmlFor="edit_special_instructions">Special Instructions</Label>
              <Textarea
                id="edit_special_instructions"
                value={editForm.special_instructions}
                onChange={(e) => setEditForm({ ...editForm, special_instructions: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!selectedDelivery) return

                try {
                  const response = await fetch(`/api/deliveries/${selectedDelivery.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      pickup_address: editForm.pickup_address,
                      delivery_address: editForm.delivery_address,
                      delivery_date: editForm.delivery_date,
                      driver_name: editForm.driver_name,
                      vehicle_number: editForm.vehicle_number,
                      delivery_charge: editForm.delivery_charge,
                      fuel_cost: editForm.fuel_cost,
                      special_instructions: editForm.special_instructions,
                    }),
                  })

                  if (!response.ok) throw new Error("Failed to update delivery")

                  await fetchData()
                  toast({
                    title: "Success",
                    description: "Delivery order updated successfully",
                  })

                  setShowEditDialog(false)
                } catch (error) {
                  toast({
                    title: "Error",
                    description: "Failed to update delivery",
                    variant: "destructive",
                  })
                }
              }}
            >
              Update Delivery
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reschedule Return Dialog */}
      <Dialog open={showRescheduleDialog} onOpenChange={setShowRescheduleDialog}>
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
                  // Also update local bookings map for immediate UI consistency
                  setBookings((prev) =>
                    (prev || []).map((b: any) => (b.id === selectedDelivery.booking_id ? { ...b, pickup_date: iso } : b))
                  )
                  toast({ title: "Return rescheduled", description: "Return date/time updated successfully." })
                  setShowRescheduleDialog(false)
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
    </div>
  )
}
