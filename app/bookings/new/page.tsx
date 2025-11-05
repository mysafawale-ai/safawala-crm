"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  Save,
  Plus,
  Minus,
  User,
  Calendar,
  ShoppingCart,
  CreditCard,
  XCircle,
  Loader2,
  Zap,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

import { NotificationService } from "@/lib/notification-service"

interface Customer {
  id: string
  customer_code: string
  name: string
  phone: string
  whatsapp?: string
  email?: string
  address?: string
  city?: string
  pincode?: string
  state?: string
}

interface Product {
  id: string
  name: string
  category: string
  barcode?: string | null
  product_code?: string
  rental_price: number
  sale_price: number
  stock_quantity: number
}

interface BookingItem {
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
}

interface BookingFormData {
  customer_id: string
  type: "rental" | "sale"
  event_type: string
  payment_type: string
  event_date: string
  delivery_date: string
  return_date: string
  event_for: string
  groom_name: string
  groom_home_address: string
  groom_additional_whatsapp: string
  bride_name: string
  bride_additional_whatsapp: string
  venue_name: string
  venue_address: string
  special_instructions: string
}

interface NewCustomerData {
  name: string
  phone: string
  whatsapp: string
  email: string
  address: string
  city: string
  pincode: string
  state: string
}

export default function NewBookingPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [quickLoading, setQuickLoading] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [bookingItems, setBookingItems] = useState<BookingItem[]>([])
  const [showNewCustomerDialog, setShowNewCustomerDialog] = useState(false)
  const [newCustomerLoading, setNewCustomerLoading] = useState(false)
  const [otherAmount, setOtherAmount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const [quickBookingData, setQuickBookingData] = useState({
    customer_id: "",
    customer_name: "",
    customer_phone: "",
    event_date: "",
    event_type: "wedding",
    type: "rental" as "rental" | "sale",
    total_amount: 0,
    advance_amount: 0,
    notes: "",
  })

  const [customerSearch, setCustomerSearch] = useState("")
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)

  const [selectedCategory, setSelectedCategory] = useState("all")
  const [productSearchTerm, setProductSearchTerm] = useState("")

  const [formData, setFormData] = useState<BookingFormData>({
    customer_id: "",
    type: "rental",
    event_type: "wedding",
    payment_type: "advance",
    event_date: "",
    delivery_date: "",
    return_date: "",
    event_for: "both",
    groom_name: "",
    groom_home_address: "",
    groom_additional_whatsapp: "",
    bride_name: "",
    bride_additional_whatsapp: "",
    venue_name: "",
    venue_address: "",
    special_instructions: "",
  })

  const [newCustomerData, setNewCustomerData] = useState<NewCustomerData>({
    name: "",
    phone: "",
    whatsapp: "",
    email: "",
    address: "",
    city: "",
    pincode: "",
    state: "",
  })

  console.log("[v0] New booking page component starting to render...")

  useEffect(() => {
    console.log("[v0] New booking page mounted successfully")

    // Test basic functionality
    fetchCustomers()
    fetchProducts()
  }, [])

  useEffect(() => {
    if (customerSearch.trim() === "") {
      setFilteredCustomers([])
      setShowCustomerDropdown(false)
    } else {
      const filtered = customers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(customerSearch.toLowerCase()) || customer.phone.includes(customerSearch),
      )
      setFilteredCustomers(filtered)
      setShowCustomerDropdown(true)
    }
  }, [customerSearch, customers])

  const fetchCustomers = async () => {
    try {
      console.log("[v0] Fetching customers...")
      const { data, error } = await supabase.from("customers").select("*").order("name")

      if (error) {
        console.error("[v0] Supabase error fetching customers:", error)
        throw error
      }
      setCustomers(data || [])
      console.log("[v0] Customers fetched successfully:", data?.length || 0)
    } catch (error) {
      console.error("[v0] Error fetching customers:", error)
      toast({
        title: "Error",
        description: "Failed to load customers",
        variant: "destructive",
      })
    }
  }

  const fetchProducts = async () => {
    try {
      console.log("[v0] Fetching products...")
      const { data, error } = await supabase.from("products").select("*").order("name")

      if (error) {
        console.error("[v0] Supabase error fetching products:", error)
        throw error
      }
      setProducts(data || [])
      console.log("[v0] Products fetched successfully:", data?.length || 0)
    } catch (error) {
      console.error("[v0] Error fetching products:", error)
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      })
    }
  }

  if (error) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => router.push("/bookings")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-red-600">Error Loading Page</h2>
              <p className="text-muted-foreground">{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handleInputChange = (field: keyof BookingFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleNewCustomerChange = (field: keyof NewCustomerData, value: string) => {
    setNewCustomerData((prev) => ({ ...prev, [field]: value }))
  }

  const generateBookingNumber = () => {
    const now = new Date()
    const year = now.getFullYear().toString().slice(-2)
    const month = (now.getMonth() + 1).toString().padStart(2, "0")
    const day = now.getDate().toString().padStart(2, "0")
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")
    return `BK${year}${month}${day}${random}`
  }

  const addProductToBooking = (product: Product) => {
    const existingItem = bookingItems.find((item) => item.product_id === product.id)

    if (existingItem) {
      updateItemQuantity(product.id, existingItem.quantity + 1)
    } else {
      const unitPrice = formData.type === "rental" ? product.rental_price : product.sale_price
      const newItem: BookingItem = {
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        unit_price: unitPrice,
        total_price: unitPrice,
      }
      setBookingItems((prev) => [...prev, newItem])
    }
  }

  const updateItemQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setBookingItems((prev) => prev.filter((item) => item.product_id !== productId))
    } else {
      setBookingItems((prev) =>
        prev.map((item) =>
          item.product_id === productId
            ? { ...item, quantity: newQuantity, total_price: item.unit_price * newQuantity }
            : item,
        ),
      )
    }
  }

  const removeItem = (productId: string) => {
    setBookingItems((prev) => prev.filter((item) => item.product_id !== productId))
  }

  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
    const search = productSearchTerm.toLowerCase()
    const matchesSearch =
      product.name.toLowerCase().includes(search) ||
      (product.barcode ? String(product.barcode).toLowerCase().includes(search) : false) ||
      (product.product_code ? String(product.product_code).toLowerCase().includes(search) : false)
    return matchesCategory && matchesSearch
  })

  const subtotal = bookingItems.reduce((sum, item) => sum + item.total_price, 0)
  const gstAmount = subtotal * 0.18 // 18% GST
  const totalAmount = subtotal + gstAmount + otherAmount

  const handleCreateCustomer = async () => {
    try {
      setNewCustomerLoading(true)
      console.log("[v0] Creating new customer...")

      const customerCode = `CUST${Date.now().toString().slice(-6)}`

      const { data, error } = await supabase
        .from("customers")
        .insert([
          {
            customer_code: customerCode,
            name: newCustomerData.name,
            phone: newCustomerData.phone,
            whatsapp: newCustomerData.whatsapp || newCustomerData.phone,
            email: newCustomerData.email,
            address: newCustomerData.address,
            city: newCustomerData.city,
            pincode: newCustomerData.pincode,
            state: newCustomerData.state,
          },
        ])
        .select()
        .single()

      if (error) throw error

      console.log("[v0] Customer created:", data)
      setCustomers((prev) => [...prev, data])
      setFormData((prev) => ({ ...prev, customer_id: data.id }))
      setCustomerSearch(data.name)
      setShowNewCustomerDialog(false)
      setNewCustomerData({
        name: "",
        phone: "",
        whatsapp: "",
        email: "",
        address: "",
        city: "",
        pincode: "",
        state: "",
      })

      toast({
        title: "Success",
        description: "Customer created successfully",
      })
    } catch (error) {
      console.error("[v0] Error creating customer:", error)
      toast({
        title: "Error",
        description: "Failed to create customer",
        variant: "destructive",
      })
    } finally {
      setNewCustomerLoading(false)
    }
  }

  const validateForm = () => {
    if (!formData.customer_id) {
      toast({
        title: "Validation Error",
        description: "Please select a customer",
        variant: "destructive",
      })
      return false
    }

    if (bookingItems.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one product",
        variant: "destructive",
      })
      return false
    }

    if (!formData.event_date) {
      toast({
        title: "Validation Error",
        description: "Please select an event date",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    try {
      setLoading(true)
      console.log("[v0] Creating booking...")

      const bookingNumber = generateBookingNumber()

      // Create booking
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert([
          {
            booking_number: bookingNumber,
            customer_id: formData.customer_id,
            type: formData.type,
            event_type: formData.event_type,
            payment_type: formData.payment_type,
            event_date: formData.event_date,
            delivery_date: formData.delivery_date || null,
            return_date: formData.return_date || null,
            event_for: formData.event_for,
            groom_name: formData.groom_name || null,
            groom_home_address: formData.groom_home_address || null,
            groom_additional_whatsapp: formData.groom_additional_whatsapp || null,
            bride_name: formData.bride_name || null,
            bride_additional_whatsapp: formData.bride_additional_whatsapp || null,
            venue_name: formData.venue_name || null,
            venue_address: formData.venue_address || null,
            special_instructions: formData.special_instructions || null,
            subtotal: subtotal,
            gst_amount: gstAmount,
            other_amount: otherAmount,
            total_amount: totalAmount,
            status: "pending_payment",
          },
        ])
        .select()
        .single()

      if (bookingError) throw bookingError

      // Create booking items
      const bookingItemsData = bookingItems.map((item) => ({
        booking_id: booking.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      }))

      const { error: itemsError } = await supabase.from("booking_items").insert(bookingItemsData)

      if (itemsError) throw itemsError

      console.log("[v0] Booking created successfully:", booking)

      try {
        const selectedCustomer = customers.find((c) => c.id === formData.customer_id)
        if (selectedCustomer?.phone) {
          console.log("[v0] Sending WhatsApp notification to:", selectedCustomer.phone)

          const bookingWithCustomerInfo = {
            ...booking,
            customer_name: selectedCustomer.name,
            customer_phone: selectedCustomer.phone,
            venue: formData.venue_name,
          }

          await NotificationService.notifyBookingCreated(bookingWithCustomerInfo)
          console.log("[v0] WhatsApp notification sent successfully")
        } else {
          console.log("[v0] No customer phone found, skipping WhatsApp notification")
        }
      } catch (notificationError) {
        console.error("[v0] Failed to send WhatsApp notification:", notificationError)
        // Don't fail the booking creation if notification fails
      }

      toast({
        title: "Success",
        description: `Booking ${bookingNumber} created successfully`,
      })

      router.push(`/bookings/${booking.id}`)
    } catch (error) {
      console.error("[v0] Error creating booking:", error)
      toast({
        title: "Error",
        description: "Failed to create booking. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const categories = [...new Set(products.map((p) => p.category))]

  console.log("[v0] New booking page rendering with state:", {
    customersCount: customers.length,
    productsCount: products.length,
    bookingItemsCount: bookingItems.length,
    selectedCustomer: formData.customer_id,
  })

  const handleQuickBookingChange = (field: string, value: string | number) => {
    setQuickBookingData((prev) => ({ ...prev, [field]: value }))
  }

  const handleQuickSubmit = async () => {
    try {
      setQuickLoading(true)
      console.log("[v0] Creating quick booking...")

      // Validate quick booking
      if (!quickBookingData.customer_id && !quickBookingData.customer_name) {
        toast({
          title: "Validation Error",
          description: "Please select a customer or enter customer details",
          variant: "destructive",
        })
        return
      }

      if (!quickBookingData.event_date) {
        toast({
          title: "Validation Error",
          description: "Please select an event date",
          variant: "destructive",
        })
        return
      }

      let customerId = quickBookingData.customer_id

      // Create customer if new
      if (!customerId && quickBookingData.customer_name) {
        const customerCode = `CUST${Date.now().toString().slice(-6)}`
        const { data: newCustomer, error: customerError } = await supabase
          .from("customers")
          .insert([
            {
              customer_code: customerCode,
              name: quickBookingData.customer_name,
              phone: quickBookingData.customer_phone,
              whatsapp: quickBookingData.customer_phone,
            },
          ])
          .select()
          .single()

        if (customerError) throw customerError
        customerId = newCustomer.id
      }

      const bookingNumber = generateBookingNumber()

      // Create quick booking
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert([
          {
            booking_number: bookingNumber,
            customer_id: customerId,
            type: quickBookingData.type,
            event_type: quickBookingData.event_type,
            event_date: quickBookingData.event_date,
            subtotal: quickBookingData.total_amount,
            gst_amount: quickBookingData.total_amount * 0.18,
            total_amount: quickBookingData.total_amount + quickBookingData.total_amount * 0.18,
            advance_amount: quickBookingData.advance_amount,
            special_instructions: quickBookingData.notes,
            status: "pending",
          },
        ])
        .select()
        .single()

      if (bookingError) throw bookingError

      console.log("[v0] Quick booking created successfully:", booking)

      toast({
        title: "Success",
        description: `Quick booking ${bookingNumber} created successfully`,
      })

      router.push(`/bookings/${booking.id}`)
    } catch (error) {
      console.error("[v0] Error creating quick booking:", error)
      toast({
        title: "Error",
        description: "Failed to create quick booking. Please try again.",
        variant: "destructive",
      })
    } finally {
      setQuickLoading(false)
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.push("/bookings")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Create New Booking</h2>
            <p className="text-muted-foreground">Add a new booking to the system</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="detailed" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="detailed" className="flex items-center">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Detailed Booking
          </TabsTrigger>
          <TabsTrigger value="quick" className="flex items-center">
            <Zap className="mr-2 h-4 w-4" />
            Quick Booking
          </TabsTrigger>
        </TabsList>

        <TabsContent value="detailed" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Create Detailed Booking
                </>
              )}
            </Button>
          </div>

          {/* Existing detailed booking form */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Customer Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customer-search">Search Customer</Label>
                  <div className="relative">
                    <Input
                      id="customer-search"
                      placeholder="Search by name or phone..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                    />
                    {showCustomerDropdown && filteredCustomers.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                        {filteredCustomers.map((customer) => (
                          <div
                            key={customer.id}
                            className="p-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => {
                              setFormData((prev) => ({ ...prev, customer_id: customer.id }))
                              setCustomerSearch(customer.name)
                              setShowCustomerDropdown(false)
                            }}
                          >
                            <div className="font-medium">{customer.name}</div>
                            <div className="text-sm text-gray-500">{customer.phone}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <Dialog open={showNewCustomerDialog} onOpenChange={setShowNewCustomerDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full bg-transparent">
                      <Plus className="mr-2 h-4 w-4" />
                      Add New Customer
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Customer</DialogTitle>
                      <DialogDescription>Create a new customer profile for this booking.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="new-customer-name">Name *</Label>
                          <Input
                            id="new-customer-name"
                            value={newCustomerData.name}
                            onChange={(e) => handleNewCustomerChange("name", e.target.value)}
                            placeholder="Customer name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="new-customer-phone">Phone *</Label>
                          <Input
                            id="new-customer-phone"
                            value={newCustomerData.phone}
                            onChange={(e) => handleNewCustomerChange("phone", e.target.value)}
                            placeholder="Phone number"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="new-customer-whatsapp">WhatsApp</Label>
                          <Input
                            id="new-customer-whatsapp"
                            value={newCustomerData.whatsapp}
                            onChange={(e) => handleNewCustomerChange("whatsapp", e.target.value)}
                            placeholder="WhatsApp number"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="new-customer-email">Email</Label>
                          <Input
                            id="new-customer-email"
                            type="email"
                            value={newCustomerData.email}
                            onChange={(e) => handleNewCustomerChange("email", e.target.value)}
                            placeholder="Email address"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-customer-address">Address</Label>
                        <Textarea
                          id="new-customer-address"
                          value={newCustomerData.address}
                          onChange={(e) => handleNewCustomerChange("address", e.target.value)}
                          placeholder="Full address"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="new-customer-city">City</Label>
                          <Input
                            id="new-customer-city"
                            value={newCustomerData.city}
                            onChange={(e) => handleNewCustomerChange("city", e.target.value)}
                            placeholder="City"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="new-customer-pincode">Pincode</Label>
                          <Input
                            id="new-customer-pincode"
                            value={newCustomerData.pincode}
                            onChange={(e) => handleNewCustomerChange("pincode", e.target.value)}
                            placeholder="Pincode"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="new-customer-state">State</Label>
                          <Input
                            id="new-customer-state"
                            value={newCustomerData.state}
                            onChange={(e) => handleNewCustomerChange("state", e.target.value)}
                            placeholder="State"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setShowNewCustomerDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateCustomer} disabled={newCustomerLoading}>
                          {newCustomerLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            "Create Customer"
                          )}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* Booking Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4" />
                  Booking Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="booking-type">Type</Label>
                    <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rental">Rental</SelectItem>
                        <SelectItem value="sale">Direct Sale</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="event-type">Event Type</Label>
                    <Select
                      value={formData.event_type}
                      onValueChange={(value) => handleInputChange("event_type", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="wedding">Wedding</SelectItem>
                        <SelectItem value="engagement">Engagement</SelectItem>
                        <SelectItem value="reception">Reception</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="event-date">Event Date *</Label>
                  <Input
                    id="event-date"
                    type="date"
                    value={formData.event_date}
                    onChange={(e) => handleInputChange("event_date", e.target.value)}
                  />
                </div>

                {formData.type === "rental" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="delivery-date">Delivery Date</Label>
                      <Input
                        id="delivery-date"
                        type="date"
                        value={formData.delivery_date}
                        onChange={(e) => handleInputChange("delivery_date", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="return-date">Return Date</Label>
                      <Input
                        id="return-date"
                        type="date"
                        value={formData.return_date}
                        onChange={(e) => handleInputChange("return_date", e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="payment-type">Payment Type</Label>
                  <Select
                    value={formData.payment_type}
                    onValueChange={(value) => handleInputChange("payment_type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="advance">Advance</SelectItem>
                      <SelectItem value="full">Full Payment</SelectItem>
                      <SelectItem value="cod">Cash on Delivery</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST (18%):</span>
                    <span>₹{gstAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <Label htmlFor="other-amount">Other Amount:</Label>
                    <Input
                      id="other-amount"
                      type="number"
                      value={otherAmount}
                      onChange={(e) => setOtherAmount(Number(e.target.value) || 0)}
                      className="w-24 text-right"
                    />
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>₹{totalAmount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>Items: {bookingItems.length}</p>
                  <p>Total Quantity: {bookingItems.reduce((sum, item) => sum + item.quantity, 0)}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Product Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Product Selection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search products..."
                    value={productSearchTerm}
                    onChange={(e) => setProductSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="border rounded-lg p-4">
                    <h3 className="font-medium">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">{product.category}</p>
                    <p className="text-xs text-muted-foreground">
                      Barcode: {product.barcode || product.product_code || "—"}
                    </p>
                    <div className="mt-2 flex justify-between items-center">
                      <div>
                        <p className="font-semibold">
                          ₹{formData.type === "rental" ? product.rental_price : product.sale_price}
                        </p>
                        <p className="text-xs text-muted-foreground">Stock: {product.stock_quantity}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => addProductToBooking(product)}
                        disabled={product.stock_quantity <= 0}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Selected Items */}
          {bookingItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Selected Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bookingItems.map((item) => (
                    <div key={item.product_id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium">{item.product_name}</h3>
                        <p className="text-sm text-muted-foreground">₹{item.unit_price} each</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateItemQuantity(item.product_id, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateItemQuantity(item.product_id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <div className="w-20 text-right font-semibold">₹{item.total_price.toLocaleString()}</div>
                        <Button size="sm" variant="destructive" onClick={() => removeItem(item.product_id)}>
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Details */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="venue-name">Venue Name</Label>
                  <Input
                    id="venue-name"
                    value={formData.venue_name}
                    onChange={(e) => handleInputChange("venue_name", e.target.value)}
                    placeholder="Event venue name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event-for">Event For</Label>
                  <Select value={formData.event_for} onValueChange={(value) => handleInputChange("event_for", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="groom">Groom</SelectItem>
                      <SelectItem value="bride">Bride</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="venue-address">Venue Address</Label>
                <Textarea
                  id="venue-address"
                  value={formData.venue_address}
                  onChange={(e) => handleInputChange("venue_address", e.target.value)}
                  placeholder="Complete venue address"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="groom-name">Groom Name</Label>
                  <Input
                    id="groom-name"
                    value={formData.groom_name}
                    onChange={(e) => handleInputChange("groom_name", e.target.value)}
                    placeholder="Groom's name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bride-name">Bride Name</Label>
                  <Input
                    id="bride-name"
                    value={formData.bride_name}
                    onChange={(e) => handleInputChange("bride_name", e.target.value)}
                    placeholder="Bride's name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="special-instructions">Special Instructions</Label>
                <Textarea
                  id="special-instructions"
                  value={formData.special_instructions}
                  onChange={(e) => handleInputChange("special_instructions", e.target.value)}
                  placeholder="Any special instructions or notes"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quick" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={handleQuickSubmit} disabled={quickLoading}>
              {quickLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Create Quick Booking
                </>
              )}
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  Customer Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="quick-customer-search">Search Existing Customer</Label>
                  <div className="relative">
                    <Input
                      id="quick-customer-search"
                      placeholder="Search by name or phone..."
                      onChange={(e) => {
                        const searchTerm = e.target.value
                        if (searchTerm.trim() === "") {
                          setQuickBookingData((prev) => ({
                            ...prev,
                            customer_id: "",
                            customer_name: "",
                            customer_phone: "",
                          }))
                        } else {
                          const customer = customers.find(
                            (c) =>
                              c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm),
                          )
                          if (customer) {
                            setQuickBookingData((prev) => ({
                              ...prev,
                              customer_id: customer.id,
                              customer_name: customer.name,
                              customer_phone: customer.phone,
                            }))
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="text-center text-sm text-muted-foreground">OR</div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="quick-customer-name">New Customer Name</Label>
                    <Input
                      id="quick-customer-name"
                      placeholder="Enter customer name"
                      value={quickBookingData.customer_name}
                      onChange={(e) => handleQuickBookingChange("customer_name", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quick-customer-phone">Phone Number</Label>
                    <Input
                      id="quick-customer-phone"
                      placeholder="Enter phone number"
                      value={quickBookingData.customer_phone}
                      onChange={(e) => handleQuickBookingChange("customer_phone", e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4" />
                  Booking Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quick-event-type">Event Type</Label>
                    <Select
                      value={quickBookingData.event_type}
                      onValueChange={(value) => handleQuickBookingChange("event_type", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="wedding">Wedding</SelectItem>
                        <SelectItem value="engagement">Engagement</SelectItem>
                        <SelectItem value="reception">Reception</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quick-booking-type">Type</Label>
                    <Select
                      value={quickBookingData.type}
                      onValueChange={(value) => handleQuickBookingChange("type", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rental">Rental</SelectItem>
                        <SelectItem value="sale">Direct Sale</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quick-event-date">Event Date *</Label>
                  <Input
                    id="quick-event-date"
                    type="date"
                    value={quickBookingData.event_date}
                    onChange={(e) => handleQuickBookingChange("event_date", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quick-total-amount">Total Amount</Label>
                    <Input
                      id="quick-total-amount"
                      type="number"
                      placeholder="0"
                      value={quickBookingData.total_amount}
                      onChange={(e) => handleQuickBookingChange("total_amount", Number(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quick-advance-amount">Advance Amount</Label>
                    <Input
                      id="quick-advance-amount"
                      type="number"
                      placeholder="0"
                      value={quickBookingData.advance_amount}
                      onChange={(e) => handleQuickBookingChange("advance_amount", Number(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quick-notes">Notes</Label>
                  <Textarea
                    id="quick-notes"
                    placeholder="Any special instructions or notes"
                    value={quickBookingData.notes}
                    onChange={(e) => handleQuickBookingChange("notes", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="mr-2 h-4 w-4" />
                Quick Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{quickBookingData.total_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (18%):</span>
                  <span>₹{(quickBookingData.total_amount * 0.18).toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total with GST:</span>
                  <span>
                    ₹{(quickBookingData.total_amount + quickBookingData.total_amount * 0.18).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Advance Paid:</span>
                  <span>₹{quickBookingData.advance_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span>Balance Due:</span>
                  <span>
                    ₹
                    {(
                      quickBookingData.total_amount +
                      quickBookingData.total_amount * 0.18 -
                      quickBookingData.advance_amount
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
