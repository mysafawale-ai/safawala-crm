"use client"

/**
 * Create Product Order Page - Complete with all fields from legacy form
 * Includes: Event Participant, Groom/Bride WhatsApp, Groom/Bride Addresses, Return Date
 * Tables: product_orders, product_order_items
 * Number prefix: ORD*
 */

import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  CalendarIcon,
  ArrowLeft,
  Plus,
  Search,
  X,
  ShoppingCart,
  Loader2,
} from "lucide-react"
import { CustomerFormDialog } from "@/components/customers/customer-form-dialog"

interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
}

interface Product {
  id: string
  name: string
  category: string
  rental_price: number
  sale_price: number
  security_deposit: number
  stock_available: number
  image_url?: string
}

interface OrderItem {
  id: string
  product_id: string
  product_name: string
  category: string
  quantity: number
  unit_price: number
  total_price: number
  security_deposit: number
  stock_available: number
}

interface StaffMember {
  id: string
  name: string
  email: string
  role: string
  franchise_id: string
}

export default function CreateProductOrderPage() {
  const router = useRouter()

  // State
  const [currentUser, setCurrentUser] = useState<any>(null)  // ✅ Store logged-in user
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [selectedStaff, setSelectedStaff] = useState<string>("none")
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [customerSearch, setCustomerSearch] = useState("")
  const [productSearch, setProductSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [showNewCustomer, setShowNewCustomer] = useState(false)
  
  // Calendar popover states for auto-close
  const [eventDateOpen, setEventDateOpen] = useState(false)
  const [deliveryDateOpen, setDeliveryDateOpen] = useState(false)
  const [returnDateOpen, setReturnDateOpen] = useState(false)

  const [formData, setFormData] = useState({
    booking_type: "rental" as "rental" | "sale",
    event_type: "Wedding",
    event_participant: "Both",
    payment_type: "full" as "full" | "advance" | "partial",
    custom_amount: 0,
    event_date: "",
    event_time: "10:00",
    delivery_date: "",
    delivery_time: "09:00",
    return_date: "",
    return_time: "18:00",
    venue_address: "",
    groom_name: "",
    groom_whatsapp: "",
    groom_address: "",
    bride_name: "",
    bride_whatsapp: "",
    bride_address: "",
    notes: "",
  })

  // Load initial data
  useEffect(() => {
    ;(async () => {
      try {
        // Fetch current user to apply franchise isolation
        const userRes = await fetch('/api/auth/user')
        if (!userRes.ok) throw new Error('Failed to fetch user')
        const user = await userRes.json()
        setCurrentUser(user)  // ✅ Store user in state for later use

        // Base queries
        let customersQuery = supabase.from("customers").select("*").order("name")
        let productsQuery = supabase.from("products").select("*").order("name")
        let staffQuery = supabase
          .from("users")
          .select("id,name,email,role,franchise_id")
          .in("role", ["staff", "franchise_admin"]).order("name")

        // Apply franchise filter for non-super-admins
        if (user.role !== 'super_admin' && user.franchise_id) {
          customersQuery = customersQuery.eq('franchise_id', user.franchise_id)
          productsQuery = productsQuery.eq('franchise_id', user.franchise_id)
          staffQuery = staffQuery.eq('franchise_id', user.franchise_id)
        }

        const [cust, prod, staff] = await Promise.all([
          customersQuery,
          productsQuery,
          staffQuery,
        ])

        if (cust.error) throw cust.error
        if (prod.error) throw prod.error

        setCustomers(cust.data || [])
        setProducts(prod.data || [])
        // Extract unique categories
        const uniqueCategories = Array.from(new Set((prod.data || []).map((p: Product) => p.category).filter(Boolean))) as string[]
        setCategories(uniqueCategories.sort())
        setStaffMembers(staff.data || [])
      } catch (e) {
        console.error(e)
        toast.error("Failed to load data")
      }
    })()
  }, [])

  // Auto-set payment type to "full" when booking type is "sale" (Direct Sale)
  useEffect(() => {
    if (formData.booking_type === "sale") {
      setFormData(prev => ({ ...prev, payment_type: "full" }))
    }
  }, [formData.booking_type])

  // Filtered lists
  const filteredCustomers = useMemo(
    () =>
      customers.filter(
        (c) =>
          c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
          c.phone.includes(customerSearch.trim())
      ),
    [customers, customerSearch]
  )

  const filteredProducts = useMemo(
    () =>
      products.filter((p) => {
        const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase())
        const matchesCategory = !selectedCategory || p.category === selectedCategory
        return matchesSearch && matchesCategory
      }),
    [products, productSearch, selectedCategory]
  )

  // Product management
  const addProduct = (p: Product) => {
    const existing = items.find((i) => i.product_id === p.id)
    const currentQty = existing?.quantity || 0
    const availableStock = p.stock_available - currentQty

    if (availableStock <= 0) {
      toast.error("Out of stock")
      return
    }

    const unit =
      formData.booking_type === "rental" ? (p.rental_price || 0) : (p.sale_price || 0)

    if (existing) {
      if (existing.quantity >= p.stock_available) {
        toast.error(`Only ${p.stock_available} available`)
        return
      }
      updateQuantity(existing.id, existing.quantity + 1)
      return
    }

    setItems((prev) => [
      ...prev,
      {
        id: `item-${p.id}-${Date.now()}`,
        product_id: p.id,
        product_name: p.name,
        category: p.category,
        quantity: 1,
        unit_price: unit,
        total_price: unit,
        security_deposit:
          formData.booking_type === "rental" ? (p.security_deposit || 0) : 0,
        stock_available: p.stock_available,
      },
    ])
  }

  const updateQuantity = (id: string, qty: number) => {
    setItems((prev) =>
      prev
        .map((it) => {
          if (it.id !== id) return it
          if (qty <= 0) return null as any
          if (qty > it.stock_available) {
            toast.error(`Max ${it.stock_available}`)
            return it
          }
          return {
            ...it,
            quantity: qty,
            total_price: it.unit_price * qty,
            security_deposit:
              formData.booking_type === "rental"
                ? (it.security_deposit / it.quantity) * qty
                : 0,
          }
        })
        .filter(Boolean) as OrderItem[]
    )
  }

  const removeItem = (id: string) =>
    setItems((prev) => prev.filter((i) => i.id !== id))

  // Update prices when booking type changes
  useEffect(() => {
    setItems((prev) =>
      prev.map((it) => {
        const prod = products.find((p) => p.id === it.product_id)
        if (!prod) return it

        const unit =
          formData.booking_type === "rental"
            ? prod.rental_price
            : prod.sale_price

        return {
          ...it,
          unit_price: unit,
          total_price: unit * it.quantity,
          security_deposit:
            formData.booking_type === "rental"
              ? prod.security_deposit * it.quantity
              : 0,
        }
      })
    )
  }, [formData.booking_type, products])

  // Calculate totals
  const totals = useMemo(() => {
    const subtotal = items.reduce((s, i) => s + i.total_price, 0)
    const deposit = items.reduce((s, i) => s + i.security_deposit, 0)
    const gst = subtotal * 0.05
    const grand = subtotal + gst

    let payable = grand
    if (formData.payment_type === "advance") payable = grand * 0.5
    else if (formData.payment_type === "partial")
      payable = Math.min(grand, Math.max(0, formData.custom_amount))

    return {
      subtotal,
      deposit,
      gst,
      grand,
      payable,
      remaining: grand - payable,
    }
  }, [items, formData])

  // Create customer
  const handleCustomerCreated = (newCustomer: Customer) => {
    setCustomers((c) => [...c, newCustomer])
    setSelectedCustomer(newCustomer)
  }

  // Combine date and time into ISO string
  const combineDateAndTime = (dateStr: string, timeStr: string): string => {
    if (!dateStr) return ""
    const date = new Date(dateStr)
    const [hours, minutes] = timeStr.split(":")
    date.setHours(parseInt(hours), parseInt(minutes), 0, 0)
    return date.toISOString()
  }

  // Submit order or quote
  const handleSubmit = async (isQuote: boolean = false) => {
    if (!selectedCustomer) {
      toast.error("Select customer")
      return
    }
    if (!formData.event_date) {
      toast.error("Event date required")
      return
    }
    if (items.length === 0) {
      toast.error("Add at least one product")
      return
    }
    // ✅ BUG FIX #1: Validate user session loaded
    if (!currentUser?.franchise_id) {
      toast.error("Session error: Please refresh the page")
      return
    }

    setLoading(true)
    try {
      // Generate number with appropriate prefix
      const prefix = isQuote ? "QT" : "ORD"
      const orderNumber = `${prefix}${Date.now().toString().slice(-8)}`

      // Combine dates with times
      const eventDateTime = combineDateAndTime(formData.event_date, formData.event_time)
      const deliveryDateTime = formData.delivery_date 
        ? combineDateAndTime(formData.delivery_date, formData.delivery_time)
        : null
      const returnDateTime = formData.return_date
        ? combineDateAndTime(formData.return_date, formData.return_time)
        : null

      const { data: order, error } = await supabase
        .from("product_orders")
        .insert({
          order_number: orderNumber,
          customer_id: selectedCustomer.id,
          franchise_id: currentUser.franchise_id,  // ✅ BUG FIX #1: Dynamic franchise_id
          booking_type: formData.booking_type,
          event_type: formData.event_type,
          event_participant: formData.event_participant,
          payment_type: formData.payment_type,
          event_date: eventDateTime,
          delivery_date: deliveryDateTime,
          return_date: returnDateTime,
          venue_address: formData.venue_address,
          groom_name: formData.groom_name,
          groom_whatsapp: formData.groom_whatsapp,
          groom_address: formData.groom_address,
          bride_name: formData.bride_name,
          bride_whatsapp: formData.bride_whatsapp,
          bride_address: formData.bride_address,
          notes: formData.notes,
          tax_amount: totals.gst,
          subtotal_amount: totals.subtotal,
          total_amount: totals.grand,
          amount_paid: totals.payable,  // ✅ BUG FIX #2: Use calculated payment
          pending_amount: totals.remaining,  // ✅ BUG FIX #2: Use calculated remaining
          status: isQuote ? "quote" : "pending_payment",
          is_quote: isQuote,
          sales_closed_by_id: selectedStaff && selectedStaff !== "none" ? selectedStaff : null
        })
        .select()
        .single()

      if (error) throw error

      const rows = items.map((it) => ({
        order_id: order.id,
        product_id: it.product_id,
        quantity: it.quantity,
        unit_price: it.unit_price,
        total_price: it.total_price,
        security_deposit: it.security_deposit,
      }))

      const { error: itemsErr } = await supabase
        .from("product_order_items")
        .insert(rows)

      if (itemsErr) throw itemsErr

      // Deduct inventory for each item (unless it's a quote)
      if (!isQuote) {
        for (const item of items) {
          // Get current stock
          const { data: product, error: fetchError } = await supabase
            .from('inventory')
            .select('stock_available')
            .eq('id', item.product_id)
            .single()
            
          if (fetchError) {
            console.error('Failed to fetch product stock:', fetchError)
            continue
          }
          
          // Update stock
          const newStock = (product.stock_available || 0) - item.quantity
          const { error: updateError } = await supabase
            .from('inventory')
            .update({ stock_available: Math.max(0, newStock) })
            .eq('id', item.product_id)
            
          if (updateError) {
            console.error('Failed to update inventory:', updateError)
          }
        }
      }

      const successMsg = isQuote 
        ? `Quote ${orderNumber} created successfully` 
        : `Order ${orderNumber} created successfully`
      toast.success(successMsg)
      
      // Redirect to quotes page if quote, bookings page if order
      // Add timestamp to force page reload and refetch
      const redirectPath = isQuote ? "/quotes" : "/bookings"
      router.push(`${redirectPath}?refresh=${Date.now()}`)
      router.refresh() // Force refresh to ensure data is reloaded
    } catch (e) {
      console.error(e)
      const errorMsg = isQuote ? "Failed to create quote" : "Failed to create order"
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/bookings">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Create Product Order</h1>
            <p className="text-sm text-gray-600">
              Products only (rental & sale)
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Forms Section */}
          <div className="space-y-6">
            {/* Customer Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Customer
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowNewCustomer(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    New
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search customers..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {selectedCustomer ? (
                  <div className="p-3 rounded-md bg-blue-50 border border-blue-200 flex items-start justify-between">
                    <div>
                      <div className="font-medium text-blue-900">
                        {selectedCustomer.name}
                      </div>
                      <div className="text-xs text-blue-700">
                        {selectedCustomer.phone}
                      </div>
                      {selectedCustomer.email && (
                        <div className="text-xs text-blue-600">
                          {selectedCustomer.email}
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedCustomer(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border rounded-md max-h-56 overflow-y-auto text-sm">
                    {(customerSearch ? filteredCustomers : customers.slice(0, 5)).map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCustomer(c)}
                        className="w-full text-left p-3 border-b last:border-b-0 hover:bg-muted"
                      >
                        <div className="font-medium">{c.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {c.phone}
                        </div>
                      </button>
                    ))}
                    {customerSearch && filteredCustomers.length === 0 && (
                      <div className="p-3 text-xs text-muted-foreground">
                        No matches
                      </div>
                    )}
                    {!customerSearch && customers.length > 5 && (
                      <div className="p-3 text-xs text-muted-foreground text-center bg-muted/30">
                        Showing first 5 of {customers.length} customers. Type to search more...
                      </div>
                    )}
                    {!customerSearch && customers.length === 0 && (
                      <div className="p-3 text-xs text-muted-foreground">
                        No customers found
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Booking Details */}
            <Card>
              <CardHeader>
                <CardTitle>Event & Wedding Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {/* Row 1: Booking Type, Event Type, Event Participant */}
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs">Booking Type</Label>
                    <Select
                      value={formData.booking_type}
                      onValueChange={(v) =>
                        setFormData({ ...formData, booking_type: v as any })
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rental">Rental</SelectItem>
                        <SelectItem value="sale">Direct Sale</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Event Type</Label>
                    <Select
                      value={formData.event_type}
                      onValueChange={(v) =>
                        setFormData({ ...formData, event_type: v })
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Wedding">Wedding</SelectItem>
                        <SelectItem value="Engagement">Engagement</SelectItem>
                        <SelectItem value="Reception">Reception</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Event Participant</Label>
                    <Select
                      value={formData.event_participant}
                      onValueChange={(v) =>
                        setFormData({ ...formData, event_participant: v })
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Groom">Groom Only</SelectItem>
                        <SelectItem value="Bride">Bride Only</SelectItem>
                        <SelectItem value="Both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Row 2: Payment Type */}
                <div>
                  <Label className="text-xs">Payment Type</Label>
                  <Select
                    value={formData.payment_type}
                    onValueChange={(v) =>
                      setFormData({ ...formData, payment_type: v as any })
                    }
                    disabled={formData.booking_type === "sale"}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full Payment</SelectItem>
                      {formData.booking_type === "rental" && (
                        <>
                          <SelectItem value="advance">Advance Payment</SelectItem>
                          <SelectItem value="partial">Deposit Only</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  {formData.booking_type === "sale" && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Direct sales always require full payment
                    </p>
                  )}
                  {formData.payment_type === "partial" && (
                    <Input
                      type="number"
                      min={0}
                      value={formData.custom_amount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          custom_amount: Number(e.target.value || 0),
                        })
                      }
                      className="mt-2"
                      placeholder="Custom amount"
                    />
                  )}
                </div>

                {/* Row 3: Dates & Times */}
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Event Date & Time *</Label>
                    <Popover open={eventDateOpen} onOpenChange={setEventDateOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.event_date
                            ? format(new Date(formData.event_date), "dd/MM/yyyy")
                            : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={
                            formData.event_date
                              ? new Date(formData.event_date)
                              : undefined
                          }
                          onSelect={(d) => {
                            setFormData({
                              ...formData,
                              event_date: d?.toISOString() || "",
                            })
                            setEventDateOpen(false)
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                    <Input
                      type="time"
                      value={formData.event_time}
                      onChange={(e) =>
                        setFormData({ ...formData, event_time: e.target.value })
                      }
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Delivery Date & Time</Label>
                    <Popover open={deliveryDateOpen} onOpenChange={setDeliveryDateOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.delivery_date
                            ? format(
                                new Date(formData.delivery_date),
                                "dd/MM/yyyy"
                              )
                            : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={
                            formData.delivery_date
                              ? new Date(formData.delivery_date)
                              : undefined
                          }
                          onSelect={(d) => {
                            setFormData({
                              ...formData,
                              delivery_date: d?.toISOString() || "",
                            })
                            setDeliveryDateOpen(false)
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                    <Input
                      type="time"
                      value={formData.delivery_time}
                      onChange={(e) =>
                        setFormData({ ...formData, delivery_time: e.target.value })
                      }
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Return Date & Time</Label>
                    <Popover open={returnDateOpen} onOpenChange={setReturnDateOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.return_date
                            ? format(new Date(formData.return_date), "dd/MM/yyyy")
                            : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={
                            formData.return_date
                              ? new Date(formData.return_date)
                              : undefined
                          }
                          onSelect={(d) => {
                            setFormData({
                              ...formData,
                              return_date: d?.toISOString() || "",
                            })
                            setReturnDateOpen(false)
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                    <Input
                      type="time"
                      value={formData.return_time}
                      onChange={(e) =>
                        setFormData({ ...formData, return_time: e.target.value })
                      }
                      className="text-sm"
                    />
                  </div>
                </div>

                {/* Venue Address */}
                <div>
                  <Label className="text-xs">Venue Address</Label>
                  <Textarea
                    rows={2}
                    value={formData.venue_address}
                    onChange={(e) =>
                      setFormData({ ...formData, venue_address: e.target.value })
                    }
                    className="mt-1"
                    placeholder="Enter venue address (e.g., Grand Palace Banquet, Connaught Place, Delhi - 110001)"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Groom Information - Show only if Groom or Both */}
            {(formData.event_participant === "Groom" || formData.event_participant === "Both") && (
              <Card>
                <CardHeader>
                  <CardTitle>Groom Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs">Groom Name</Label>
                      <Input
                        value={formData.groom_name}
                        onChange={(e) =>
                          setFormData({ ...formData, groom_name: e.target.value })
                        }
                        className="mt-1"
                        placeholder="Enter groom's full name (e.g., Rajesh Kumar)"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Additional WhatsApp Number</Label>
                      <Input
                        value={formData.groom_whatsapp}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            groom_whatsapp: e.target.value,
                          })
                        }
                        className="mt-1"
                        placeholder="WhatsApp number (e.g., +91 9876543210)"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Home Address</Label>
                    <Textarea
                      rows={2}
                      value={formData.groom_address}
                      onChange={(e) =>
                        setFormData({ ...formData, groom_address: e.target.value })
                      }
                      className="mt-1"
                      placeholder="Full address with locality and pin code"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Bride Information - Show only if Bride or Both */}
            {(formData.event_participant === "Bride" || formData.event_participant === "Both") && (
              <Card>
                <CardHeader>
                  <CardTitle>Bride Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Bride Name</Label>
                    <Input
                      value={formData.bride_name}
                      onChange={(e) =>
                        setFormData({ ...formData, bride_name: e.target.value })
                      }
                      className="mt-1"
                      placeholder="Enter bride's full name (e.g., Priya Sharma)"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Additional WhatsApp Number</Label>
                    <Input
                      value={formData.bride_whatsapp}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          bride_whatsapp: e.target.value,
                        })
                      }
                      className="mt-1"
                      placeholder="WhatsApp number (e.g., +91 9876543210)"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Home Address</Label>
                  <Textarea
                    rows={2}
                    value={formData.bride_address}
                    onChange={(e) =>
                      setFormData({ ...formData, bride_address: e.target.value })
                    }
                    className="mt-1"
                    placeholder="Full address with locality and pin code"
                  />
                </div>
              </CardContent>
            </Card>
            )}

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Any special instructions or requirements (e.g., Delivery before 9 AM, color preference - golden, special care needed)"
                />
              </CardContent>
            </Card>

            {/* Product Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select Products</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Category Filter Buttons */}
                {categories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant={selectedCategory === null ? "default" : "outline"}
                      onClick={() => setSelectedCategory(null)}
                    >
                      All Categories
                    </Button>
                    {categories.map((cat) => (
                      <Button
                        key={cat}
                        size="sm"
                        variant={selectedCategory === cat ? "default" : "outline"}
                        onClick={() => setSelectedCategory(cat)}
                      >
                        {cat}
                      </Button>
                    ))}
                  </div>
                )}
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search products..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="max-h-[500px] overflow-y-auto border rounded-lg p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {filteredProducts.map((p) => {
                    const unit =
                      formData.booking_type === "rental"
                        ? p.rental_price
                        : p.sale_price

                    // Calculate reserved quantity from order items
                    const reservedQty = items.find((i) => i.product_id === p.id)?.quantity || 0
                    const availableStock = p.stock_available - reservedQty
                    const isOutOfStock = availableStock <= 0

                    return (
                      <div
                        key={p.id}
                        className="border rounded-lg p-4 flex flex-col text-sm"
                      >
                        <div className="aspect-square bg-gray-100 rounded mb-3 flex items-center justify-center text-xs text-muted-foreground">
                          {p.image_url ? (
                            <img
                              src={p.image_url}
                              alt={p.name}
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            "No Image"
                          )}
                        </div>
                        <div className="font-medium line-clamp-1" title={p.name}>
                          {p.name}
                        </div>
                        <div className="text-[11px] text-gray-600 mb-1">
                          {p.category}
                        </div>
                        <div className="text-xs mb-2 space-y-0.5">
                          <div>₹{unit}</div>
                          <div className={`${isOutOfStock ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                            Stock: {availableStock}
                            {reservedQty > 0 && (
                              <span className="text-blue-600 ml-1">
                                ({reservedQty} in cart)
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => addProduct(p)}
                          disabled={isOutOfStock}
                          className="mt-auto"
                        >
                          {isOutOfStock ? "Out of Stock" : "Add"}
                        </Button>
                      </div>
                    )
                  })}

                  {filteredProducts.length === 0 && (
                    <div className="text-xs text-muted-foreground col-span-full p-4 border rounded">
                      No products found
                    </div>
                  )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                {items.length === 0 ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    <ShoppingCart className="h-8 w-8 mx-auto mb-3 text-gray-300" />
                    No items added yet
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map((it) => (
                      <div
                        key={it.id}
                        className="flex items-center justify-between border-b pb-2 gap-3"
                      >
                        <div className="min-w-0">
                          <div
                            className="text-sm font-medium leading-none truncate"
                            title={it.product_name}
                          >
                            {it.product_name}
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            {it.category}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                updateQuantity(it.id, it.quantity - 1)
                              }
                            >
                              -
                            </Button>
                            <span className="text-sm w-5 text-center">
                              {it.quantity}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                updateQuantity(it.id, it.quantity + 1)
                              }
                            >
                              +
                            </Button>
                          </div>
                          <span className="text-xs font-medium whitespace-nowrap">
                            ₹{it.total_price}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeItem(it.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Totals */}
            <Card>
              <CardHeader>
                <CardTitle>Totals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (5%)</span>
                  <span>₹{totals.gst.toFixed(2)}</span>
                </div>
                {formData.booking_type === "rental" && (
                  <div className="flex justify-between">
                    <span>Security Deposit</span>
                    <span>₹{totals.deposit.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold pt-1 border-t">
                  <span>Total</span>
                  <span>₹{totals.grand.toFixed(2)}</span>
                </div>
                {formData.payment_type !== "full" && (
                  <>
                    <div className="flex justify-between text-xs">
                      <span>Payable Now</span>
                      <span>₹{totals.payable.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Remaining</span>
                      <span>₹{totals.remaining.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Sales Closed By */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Sales Closed By</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff member (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {staffMembers.map(staff => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.name} ({staff.role === 'franchise_admin' ? 'Admin' : 'Staff'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-gray-500">Track which team member closed this sale for incentives</p>
              </CardContent>
            </Card>

            {/* Submit Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="w-full"
                disabled={loading}
                onClick={() => handleSubmit(true)}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Create Quote for Now"
                )}
              </Button>
              <Button
                className="w-full"
                disabled={loading}
                onClick={() => handleSubmit(false)}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Create Order"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* New Customer Dialog */}
      <CustomerFormDialog
        open={showNewCustomer}
        onOpenChange={setShowNewCustomer}
        onCustomerCreated={handleCustomerCreated}
      />
    </div>
  )
}
